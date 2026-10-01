import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  createDb,
  promptReports,
  prompts
} from "@prompthub/database";
import { requireAuth } from "../middleware/auth.js";
import { reportRateLimit } from "../middleware/rateLimit.js";
import { writeAudit } from "../lib/audit.js";

const router = Router();
const db = createDb();

const reportSchema = z.object({
  promptId: z.string().uuid(),
  reason: z.enum([
    "SPAM",
    "INAPPROPRIATE",
    "MISLEADING",
    "COPYRIGHT",
    "OTHER"
  ]),
  description:
    z.string()
      .trim()
      .max(1000)
      .nullable()
      .optional()
});

router.post(
  "/",
  requireAuth,
  reportRateLimit,
  async (req, res) => {
    const parsed =
      reportSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Dados da denúncia inválidos"
      });
    }

    const userId =
      req.authUser!.id;

    const [prompt] = await db
      .select({
        id: prompts.id,
        userId: prompts.userId,
        visibility: prompts.visibility
      })
      .from(prompts)
      .where(
        and(
          eq(
            prompts.id,
            parsed.data.promptId
          ),
          eq(
            prompts.visibility,
            "PUBLIC"
          ),
          isNull(
            prompts.deletedAt
          )
        )
      )
      .limit(1);

    if (!prompt) {
      return res.status(404).json({
        error:
          "Prompt público não encontrado"
      });
    }

    if (
      prompt.userId === userId
    ) {
      return res.status(400).json({
        error:
          "Você não pode denunciar seu próprio prompt"
      });
    }

    try {
      const [report] = await db
        .insert(promptReports)
        .values({
          promptId: prompt.id,
          reportedByUserId:
            userId,
          reason:
            parsed.data.reason,
          description:
            parsed.data
              .description ||
            null
        })
        .returning({
          id:
            promptReports.id
        });

      await writeAudit(req, {
        userId,
        action: "REPORT_PROMPT",
        entityType: "PROMPT",
        entityId: prompt.id,
        details: {
          reason:
            parsed.data.reason
        }
      });

      return res.status(201).json({
        report
      });
    } catch (error: any) {
      if (
        error?.code === "23505"
      ) {
        return res.status(409).json({
          error:
            "Você já denunciou este prompt"
        });
      }

      throw error;
    }
  }
);

export default router;
