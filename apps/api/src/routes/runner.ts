import { Router } from "express";
import {
  and,
  desc,
  eq,
  gte,
  isNull,
  or,
  sql
} from "drizzle-orm";
import { z } from "zod";
import {
  createDb,
  promptRuns,
  prompts,
  userAiSettings
} from "@prompthub/database";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimit } from "../middleware/rateLimit.js";
import { runOpenAIPrompt } from "../lib/openai.js";
import { decryptSecret } from "../lib/secretCrypto.js";
import { writeAudit } from "../lib/audit.js";
import { env } from "../lib/env.js";

const router = Router();
const db = createDb();

const runRateLimit = createRateLimit({
  prefix: "prompt-run",
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: "Limite horário de testes com IA atingido."
});

function getRouteParam(
  value: string | string[] | undefined
) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value) && value[0]) {
    return value[0];
  }

  return null;
}

function extractVariables(content: string) {
  const matches = content.matchAll(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g
  );

  return Array.from(
    new Set(
      Array.from(matches)
        .map((match) => match[1])
        .filter(Boolean)
    )
  );
}

function renderTemplate(
  content: string,
  values: Record<string, string>
) {
  return content.replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    (_match, key: string) =>
      values[key] ?? ""
  );
}

async function resolveAiConfig(userId: string) {
  const [settings] = await db
    .select()
    .from(userAiSettings)
    .where(eq(userAiSettings.userId, userId))
    .limit(1);

  const model =
    settings?.model ||
    env.OPENAI_MODEL ||
    "gpt-5.6-luna";

  if (settings?.useOwnKey) {
    if (
      !settings.encryptedApiKey ||
      !settings.encryptionIv ||
      !settings.encryptionTag
    ) {
      throw new Error(
        "Sua chave própria está ativada, mas não está configurada corretamente."
      );
    }

    return {
      apiKey: decryptSecret(
        settings.encryptedApiKey,
        settings.encryptionIv,
        settings.encryptionTag
      ),
      model,
      executionMode: "OWN_KEY" as const,
      dailyLimit: 100
    };
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error(
      "A chave da plataforma não está configurada. Cadastre sua própria chave em Configurações > Inteligência Artificial."
    );
  }

  return {
    apiKey: env.OPENAI_API_KEY,
    model,
    executionMode: "PLATFORM" as const,
    dailyLimit: 20
  };
}

async function processRun(
  runId: string,
  userId: string,
  promptId: string,
  renderedInput: string,
  aiConfig: {
    apiKey: string;
    model: string;
    executionMode: "PLATFORM" | "OWN_KEY";
    dailyLimit: number;
  }
) {
  const startedAt = Date.now();

  console.log(
    "PROMPT_RUN_START",
    runId,
    promptId,
    aiConfig.executionMode,
    aiConfig.model
  );

  try {
    const result = await runOpenAIPrompt(
      renderedInput,
      {
        apiKey: aiConfig.apiKey,
        model: aiConfig.model
      }
    );

    const durationMs = Date.now() - startedAt;

    await db
      .update(promptRuns)
      .set({
        model: result.model,
        outputText: result.text,
        status: "SUCCESS",
        durationMs,
        inputTokens: result.inputTokens ?? null,
        outputTokens: result.outputTokens ?? null
      })
      .where(
        and(
          eq(promptRuns.id, runId),
          eq(promptRuns.userId, userId)
        )
      );

    console.log(
      "PROMPT_RUN_SUCCESS",
      runId,
      durationMs
    );
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao executar IA";

    await db
      .update(promptRuns)
      .set({
        status: "ERROR",
        errorMessage: message.slice(0, 1000),
        durationMs
      })
      .where(
        and(
          eq(promptRuns.id, runId),
          eq(promptRuns.userId, userId)
        )
      );

    console.error(
      "PROMPT_RUN_ERROR",
      runId,
      message
    );
  }
}

router.get("/:id/config", requireAuth, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: "ID do prompt inválido"
    });
  }

  const userId = req.authUser!.id;

  const [prompt] = await db
    .select({
      id: prompts.id,
      title: prompts.title,
      description: prompts.description,
      content: prompts.content,
      visibility: prompts.visibility,
      userId: prompts.userId
    })
    .from(prompts)
    .where(
      and(
        eq(prompts.id, id),
        isNull(prompts.deletedAt),
        or(
          eq(prompts.userId, userId),
          eq(prompts.visibility, "PUBLIC")
        )
      )
    )
    .limit(1);

  if (!prompt) {
    return res.status(404).json({
      error: "Prompt não encontrado"
    });
  }

  const [settings] = await db
    .select({
      useOwnKey: userAiSettings.useOwnKey,
      model: userAiSettings.model
    })
    .from(userAiSettings)
    .where(eq(userAiSettings.userId, userId))
    .limit(1);

  const useOwnKey = Boolean(settings?.useOwnKey);

  return res.json({
    prompt,
    variables: extractVariables(prompt.content),
    ai: {
      executionMode: useOwnKey ? "OWN_KEY" : "PLATFORM",
      model:
        settings?.model ||
        env.OPENAI_MODEL ||
        "gpt-5.6-luna",
      dailyLimit: useOwnKey ? 100 : 20
    }
  });
});

const runSchema = z.object({
  values: z
    .record(
      z.string(),
      z.string().max(10000)
    )
    .default({})
});

router.post("/:id/run", requireAuth, runRateLimit, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: "ID do prompt inválido"
    });
  }

  const parsed = runSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Valores inválidos"
    });
  }

  const userId = req.authUser!.id;

  const [prompt] = await db
    .select({
      id: prompts.id,
      content: prompts.content,
      visibility: prompts.visibility,
      ownerId: prompts.userId
    })
    .from(prompts)
    .where(
      and(
        eq(prompts.id, id),
        isNull(prompts.deletedAt),
        or(
          eq(prompts.userId, userId),
          eq(prompts.visibility, "PUBLIC")
        )
      )
    )
    .limit(1);

  if (!prompt) {
    return res.status(404).json({
      error: "Prompt não encontrado"
    });
  }

  let aiConfig;

  try {
    aiConfig = await resolveAiConfig(userId);
  } catch (error) {
    return res.status(503).json({
      error:
        error instanceof Error
          ? error.message
          : "Configuração de IA indisponível"
    });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [usage] = await db
    .select({
      total: sql<number>`count(*)`
    })
    .from(promptRuns)
    .where(
      and(
        eq(promptRuns.userId, userId),
        gte(promptRuns.createdAt, startOfDay),
        eq(promptRuns.executionMode, aiConfig.executionMode)
      )
    );

  const usedToday = Number(usage?.total ?? 0);

  if (usedToday >= aiConfig.dailyLimit) {
    return res.status(429).json({
      error:
        `Limite diário de ${aiConfig.dailyLimit} execuções para este modo atingido.`
    });
  }

  const renderedInput = renderTemplate(
    prompt.content,
    parsed.data.values
  );

  if (renderedInput.length > 50000) {
    return res.status(400).json({
      error:
        "O prompt final ultrapassa o limite de 50.000 caracteres."
    });
  }

  const [run] = await db
    .insert(promptRuns)
    .values({
      promptId: prompt.id,
      userId,
      model: aiConfig.model,
      renderedInput,
      status: "PENDING",
      executionMode: aiConfig.executionMode
    })
    .returning({
      id: promptRuns.id,
      status: promptRuns.status,
      model: promptRuns.model,
      executionMode: promptRuns.executionMode,
      createdAt: promptRuns.createdAt
    });

  if (!run) {
    return res.status(500).json({
      error: "Não foi possível criar a execução."
    });
  }

  await writeAudit(req, {
    userId,
    action: "RUN_PROMPT_REQUEST",
    entityType: "PROMPT",
    entityId: prompt.id,
    details: {
      runId: run.id,
      model: aiConfig.model,
      executionMode: aiConfig.executionMode
    }
  });

  setImmediate(() => {
    processRun(
      run.id,
      userId,
      prompt.id,
      renderedInput,
      aiConfig
    ).catch((error) => {
      console.error(
        "PROMPT_RUN_BACKGROUND_ERROR",
        run.id,
        error instanceof Error
          ? error.message
          : error
      );
    });
  });

  return res.status(202).json({
    run,
    limits: {
      dailyLimit: aiConfig.dailyLimit,
      usedToday: usedToday + 1,
      executionMode: aiConfig.executionMode
    }
  });
});

router.get("/run/:runId/status", requireAuth, async (req, res) => {
  const runId = getRouteParam(req.params.runId);

  if (!runId) {
    return res.status(400).json({
      error: "ID da execução inválido"
    });
  }

  const [run] = await db
    .select({
      id: promptRuns.id,
      promptId: promptRuns.promptId,
      model: promptRuns.model,
      outputText: promptRuns.outputText,
      status: promptRuns.status,
      errorMessage: promptRuns.errorMessage,
      durationMs: promptRuns.durationMs,
      inputTokens: promptRuns.inputTokens,
      outputTokens: promptRuns.outputTokens,
      executionMode: promptRuns.executionMode,
      createdAt: promptRuns.createdAt
    })
    .from(promptRuns)
    .where(
      and(
        eq(promptRuns.id, runId),
        eq(promptRuns.userId, req.authUser!.id)
      )
    )
    .limit(1);

  if (!run) {
    return res.status(404).json({
      error: "Execução não encontrada"
    });
  }

  return res.json({ run });
});

router.get("/:id/history", requireAuth, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: "ID do prompt inválido"
    });
  }

  const items = await db
    .select({
      id: promptRuns.id,
      model: promptRuns.model,
      outputText: promptRuns.outputText,
      status: promptRuns.status,
      errorMessage: promptRuns.errorMessage,
      durationMs: promptRuns.durationMs,
      inputTokens: promptRuns.inputTokens,
      outputTokens: promptRuns.outputTokens,
      executionMode: promptRuns.executionMode,
      createdAt: promptRuns.createdAt
    })
    .from(promptRuns)
    .where(
      and(
        eq(promptRuns.promptId, id),
        eq(promptRuns.userId, req.authUser!.id)
      )
    )
    .orderBy(desc(promptRuns.createdAt))
    .limit(20);

  return res.json({ items });
});

export default router;
