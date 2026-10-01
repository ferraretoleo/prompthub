import { Router } from "express";
import {
  and,
  desc,
  eq,
  inArray,
  isNull
} from "drizzle-orm";
import { z } from "zod";
import {
  createDb,
  promptReports,
  prompts,
  users
} from "@prompthub/database";
import { requireAuth } from "../middleware/auth.js";
import { reportRateLimit } from "../middleware/rateLimit.js";
import { writeAudit } from "../lib/audit.js";

const router = Router();
const db = createDb();

async function getModerator(
  userId: string
) {
  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      isActive: users.isActive
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (
    !user ||
    !user.isActive ||
    !["ADMIN", "MODERATOR"].includes(
      user.role
    )
  ) {
    return null;
  }

  return user;
}

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
      reportSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        error:
          "Dados da denúncia inválidos"
      });
    }

    const userId =
      req.authUser!.id;

    const [prompt] = await db
      .select({
        id: prompts.id,
        userId: prompts.userId,
        visibility:
          prompts.visibility
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
          promptId:
            prompt.id,
          reportedByUserId:
            userId,
          reason:
            parsed.data.reason,
          description:
            parsed.data.description ||
            null
        })
        .returning({
          id:
            promptReports.id
        });

      await writeAudit(req, {
        userId,
        action:
          "REPORT_PROMPT",
        entityType:
          "PROMPT",
        entityId:
          prompt.id,
        details: {
          reason:
            parsed.data.reason
        }
      });

      return res
        .status(201)
        .json({
          report
        });
    } catch (error: any) {
      if (
        error?.code ===
        "23505"
      ) {
        return res
          .status(409)
          .json({
            error:
              "Você já denunciou este prompt"
          });
      }

      throw error;
    }
  }
);

router.get(
  "/moderation/access",
  requireAuth,
  async (req, res) => {
    const moderator =
      await getModerator(
        req.authUser!.id
      );

    if (!moderator) {
      return res
        .status(403)
        .json({
          allowed: false
        });
    }

    return res.json({
      allowed: true,
      role:
        moderator.role
    });
  }
);

router.get(
  "/moderation",
  requireAuth,
  async (req, res) => {
    const moderator =
      await getModerator(
        req.authUser!.id
      );

    if (!moderator) {
      return res
        .status(403)
        .json({
          error:
            "Acesso restrito à moderação"
        });
    }

    const status =
      String(
        req.query.status ||
        ""
      );

    const where =
      ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]
        .includes(status)
        ? eq(
            promptReports.status,
            status
          )
        : undefined;

    const rows = await db
      .select({
        id:
          promptReports.id,
        promptId:
          promptReports.promptId,
        reportedByUserId:
          promptReports.reportedByUserId,
        reason:
          promptReports.reason,
        description:
          promptReports.description,
        status:
          promptReports.status,
        createdAt:
          promptReports.createdAt,
        updatedAt:
          promptReports.updatedAt,
        promptTitle:
          prompts.title,
        promptSlug:
          prompts.slug,
        promptOwnerId:
          prompts.userId,
        promptVisibility:
          prompts.visibility,
        promptDeletedAt:
          prompts.deletedAt
      })
      .from(promptReports)
      .innerJoin(
        prompts,
        eq(
          promptReports.promptId,
          prompts.id
        )
      )
      .where(where)
      .orderBy(
        desc(
          promptReports.createdAt
        )
      )
      .limit(100);

    const ids = Array.from(
      new Set(
        rows
          .flatMap((row) => [
            row.reportedByUserId,
            row.promptOwnerId
          ])
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
      )
    );

    const people =
      ids.length
        ? await db
            .select({
              id: users.id,
              username:
                users.username,
              name:
                users.name
            })
            .from(users)
            .where(
              inArray(
                users.id,
                ids
              )
            )
        : [];

    const peopleMap =
      new Map(
        people.map(
          (person) => [
            person.id,
            person
          ]
        )
      );

    const items =
      rows.map(
        (row) => ({
          ...row,
          reporter:
            row.reportedByUserId
              ? peopleMap.get(
                  row.reportedByUserId
                ) || null
              : null,
          owner:
            peopleMap.get(
              row.promptOwnerId
            ) || null
        })
      );

    return res.json({
      items,
      role:
        moderator.role
    });
  }
);

const moderationSchema =
  z.object({
    status: z.enum([
      "OPEN",
      "REVIEWING",
      "RESOLVED",
      "DISMISSED"
    ])
  });

router.patch(
  "/moderation/:id",
  requireAuth,
  async (req, res) => {
    const moderator =
      await getModerator(
        req.authUser!.id
      );

    if (!moderator) {
      return res
        .status(403)
        .json({
          error:
            "Acesso restrito à moderação"
        });
    }

    const parsed =
      moderationSchema
        .safeParse(
          req.body
        );

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          error:
            "Status inválido"
        });
    }

    const reportId =
      String(
        req.params.id ||
        ""
      );

    const [updated] =
      await db
        .update(
          promptReports
        )
        .set({
          status:
            parsed.data.status,
          updatedAt:
            new Date()
        })
        .where(
          eq(
            promptReports.id,
            reportId
          )
        )
        .returning();

    if (!updated) {
      return res
        .status(404)
        .json({
          error:
            "Denúncia não encontrada"
        });
    }

    await writeAudit(req, {
      userId:
        moderator.id,
      action:
        "MODERATE_REPORT",
      entityType:
        "REPORT",
      entityId:
        updated.id,
      details: {
        status:
          updated.status
      }
    });

    return res.json({
      report: updated
    });
  }
);

router.post(
  "/moderation/:id/unpublish",
  requireAuth,
  async (req, res) => {
    const moderator =
      await getModerator(
        req.authUser!.id
      );

    if (!moderator) {
      return res
        .status(403)
        .json({
          error:
            "Acesso restrito à moderação"
        });
    }

    const reportId =
      String(
        req.params.id ||
        ""
      );

    const [report] =
      await db
        .select({
          id:
            promptReports.id,
          promptId:
            promptReports.promptId
        })
        .from(
          promptReports
        )
        .where(
          eq(
            promptReports.id,
            reportId
          )
        )
        .limit(1);

    if (!report) {
      return res
        .status(404)
        .json({
          error:
            "Denúncia não encontrada"
        });
    }

    await db
      .update(prompts)
      .set({
        visibility:
          "PRIVATE",
        updatedAt:
          new Date()
      })
      .where(
        eq(
          prompts.id,
          report.promptId
        )
      );

    await db
      .update(
        promptReports
      )
      .set({
        status:
          "RESOLVED",
        updatedAt:
          new Date()
      })
      .where(
        eq(
          promptReports.id,
          report.id
        )
      );

    await writeAudit(req, {
      userId:
        moderator.id,
      action:
        "UNPUBLISH_REPORTED_PROMPT",
      entityType:
        "PROMPT",
      entityId:
        report.promptId,
      details: {
        reportId:
          report.id
      }
    });

    return res.json({
      ok: true
    });
  }
);

export default router;
