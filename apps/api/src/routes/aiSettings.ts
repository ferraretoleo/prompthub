import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  createDb,
  userAiSettings
} from "@prompthub/database";
import { requireAuth } from "../middleware/auth.js";
import { encryptSecret } from "../lib/secretCrypto.js";
import { writeAudit } from "../lib/audit.js";

const router = Router();
const db = createDb();

router.get("/", requireAuth, async (req, res) => {
  const [settings] = await db
    .select({
      provider: userAiSettings.provider,
      useOwnKey: userAiSettings.useOwnKey,
      model: userAiSettings.model,
      encryptedApiKey: userAiSettings.encryptedApiKey
    })
    .from(userAiSettings)
    .where(eq(userAiSettings.userId, req.authUser!.id))
    .limit(1);

  return res.json({
    settings: settings
      ? {
          provider: settings.provider,
          useOwnKey: settings.useOwnKey,
          model: settings.model,
          hasOwnKey: Boolean(settings.encryptedApiKey)
        }
      : {
          provider: "OPENAI",
          useOwnKey: false,
          model: "gpt-5.6-luna",
          hasOwnKey: false
        }
  });
});

const updateSchema = z.object({
  useOwnKey: z.boolean(),
  model: z.string().trim().min(1).max(100).default("gpt-5.6-luna"),
  apiKey: z.string().trim().min(10).max(500).optional()
});

router.put("/", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Configuração de IA inválida"
    });
  }

  const userId = req.authUser!.id;

  const [current] = await db
    .select()
    .from(userAiSettings)
    .where(eq(userAiSettings.userId, userId))
    .limit(1);

  let encryptedApiKey = current?.encryptedApiKey ?? null;
  let encryptionIv = current?.encryptionIv ?? null;
  let encryptionTag = current?.encryptionTag ?? null;

  if (parsed.data.apiKey) {
    const encrypted = encryptSecret(parsed.data.apiKey);

    encryptedApiKey = encrypted.encrypted;
    encryptionIv = encrypted.iv;
    encryptionTag = encrypted.tag;
  }

  if (parsed.data.useOwnKey && !encryptedApiKey) {
    return res.status(400).json({
      error:
        "Informe uma chave da OpenAI antes de ativar o uso da chave própria."
    });
  }

  await db
    .insert(userAiSettings)
    .values({
      userId,
      provider: "OPENAI",
      useOwnKey: parsed.data.useOwnKey,
      encryptedApiKey,
      encryptionIv,
      encryptionTag,
      model: parsed.data.model,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: userAiSettings.userId,
      set: {
        useOwnKey: parsed.data.useOwnKey,
        encryptedApiKey,
        encryptionIv,
        encryptionTag,
        model: parsed.data.model,
        updatedAt: new Date()
      }
    });

  await writeAudit(req, {
    userId,
    action: "UPDATE_AI_SETTINGS",
    entityType: "USER",
    entityId: userId,
    details: {
      useOwnKey: parsed.data.useOwnKey,
      model: parsed.data.model,
      keyUpdated: Boolean(parsed.data.apiKey)
    }
  });

  return res.json({
    ok: true,
    settings: {
      provider: "OPENAI",
      useOwnKey: parsed.data.useOwnKey,
      model: parsed.data.model,
      hasOwnKey: Boolean(encryptedApiKey)
    }
  });
});

router.delete("/key", requireAuth, async (req, res) => {
  const userId = req.authUser!.id;

  await db
    .insert(userAiSettings)
    .values({
      userId,
      provider: "OPENAI",
      useOwnKey: false,
      encryptedApiKey: null,
      encryptionIv: null,
      encryptionTag: null,
      model: "gpt-5.6-luna",
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: userAiSettings.userId,
      set: {
        useOwnKey: false,
        encryptedApiKey: null,
        encryptionIv: null,
        encryptionTag: null,
        updatedAt: new Date()
      }
    });

  await writeAudit(req, {
    userId,
    action: "DELETE_AI_KEY",
    entityType: "USER",
    entityId: userId
  });

  return res.status(204).send();
});

export default router;
