import { Router } from "express";
import {
  and,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql
} from "drizzle-orm";
import { z } from "zod";
import {
  auditLogs,
  createDb,
  promptReports,
  prompts,
  users
} from "@prompthub/database";
import { requireAuth } from "../middleware/auth.js";
import { writeAudit } from "../lib/audit.js";

const router = Router();
const db = createDb();

async function requireAdminUser(
  userId: string
) {
  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      isActive: users.isActive
    })
    .from(users)
    .where(
      eq(
        users.id,
        userId
      )
    )
    .limit(1);

  if (
    !user ||
    !user.isActive ||
    user.role !== "ADMIN"
  ) {
    return null;
  }

  return user;
}

router.get(
  "/access",
  requireAuth,
  async (req, res) => {
    const admin =
      await requireAdminUser(
        req.authUser!.id
      );

    if (!admin) {
      return res.status(403).json({
        allowed: false
      });
    }

    return res.json({
      allowed: true,
      role: "ADMIN"
    });
  }
);

router.get(
  "/summary",
  requireAuth,
  async (req, res) => {
    const admin =
      await requireAdminUser(
        req.authUser!.id
      );

    if (!admin) {
      return res.status(403).json({
        error:
          "Acesso restrito ao administrador"
      });
    }

    const [
      totalUsersRow,
      activeUsersRow,
      publicPromptsRow,
      privatePromptsRow,
      openReportsRow
    ] = await Promise.all([
      db
        .select({
          total:
            sql<number>`count(*)`
        })
        .from(users),

      db
        .select({
          total:
            sql<number>`count(*)`
        })
        .from(users)
        .where(
          eq(
            users.isActive,
            true
          )
        ),

      db
        .select({
          total:
            sql<number>`count(*)`
        })
        .from(prompts)
        .where(
          and(
            eq(
              prompts.visibility,
              "PUBLIC"
            ),
            isNull(
              prompts.deletedAt
            )
          )
        ),

      db
        .select({
          total:
            sql<number>`count(*)`
        })
        .from(prompts)
        .where(
          and(
            eq(
              prompts.visibility,
              "PRIVATE"
            ),
            isNull(
              prompts.deletedAt
            )
          )
        ),

      db
        .select({
          total:
            sql<number>`count(*)`
        })
        .from(promptReports)
        .where(
          or(
            eq(
              promptReports.status,
              "OPEN"
            ),
            eq(
              promptReports.status,
              "REVIEWING"
            )
          )
        )
    ]);

    return res.json({
      summary: {
        users:
          Number(
            totalUsersRow[0]
              ?.total ?? 0
          ),
        activeUsers:
          Number(
            activeUsersRow[0]
              ?.total ?? 0
          ),
        publicPrompts:
          Number(
            publicPromptsRow[0]
              ?.total ?? 0
          ),
        privatePrompts:
          Number(
            privatePromptsRow[0]
              ?.total ?? 0
          ),
        openReports:
          Number(
            openReportsRow[0]
              ?.total ?? 0
          )
      }
    });
  }
);

router.get(
  "/users",
  requireAuth,
  async (req, res) => {
    const admin =
      await requireAdminUser(
        req.authUser!.id
      );

    if (!admin) {
      return res.status(403).json({
        error:
          "Acesso restrito ao administrador"
      });
    }

    const q =
      String(
        req.query.q || ""
      ).trim();

    const page =
      Math.max(
        1,
        Number(
          req.query.page || 1
        )
      );

    const limit =
      Math.min(
        50,
        Math.max(
          1,
          Number(
            req.query.limit || 20
          )
        )
      );

    const offset =
      (page - 1) * limit;

    const filter =
      q
        ? or(
            ilike(
              users.name,
              `%${q}%`
            ),
            ilike(
              users.username,
              `%${q}%`
            ),
            ilike(
              users.email,
              `%${q}%`
            )
          )
        : undefined;

    const items =
      await db
        .select({
          id:
            users.id,
          name:
            users.name,
          username:
            users.username,
          email:
            users.email,
          role:
            users.role,
          isActive:
            users.isActive,
          createdAt:
            users.createdAt,
          updatedAt:
            users.updatedAt
        })
        .from(users)
        .where(filter)
        .orderBy(
          desc(
            users.createdAt
          )
        )
        .limit(limit)
        .offset(offset);

    return res.json({
      items,
      page,
      limit
    });
  }
);

const updateUserSchema =
  z.object({
    role:
      z.enum([
        "USER",
        "MODERATOR",
        "ADMIN"
      ])
        .optional(),
    isActive:
      z.boolean()
        .optional()
  })
  .refine(
    (data) =>
      data.role !== undefined ||
      data.isActive !== undefined,
    {
      message:
        "Nenhuma alteração informada"
    }
  );

router.patch(
  "/users/:id",
  requireAuth,
  async (req, res) => {
    const admin =
      await requireAdminUser(
        req.authUser!.id
      );

    if (!admin) {
      return res.status(403).json({
        error:
          "Acesso restrito ao administrador"
      });
    }

    const parsed =
      updateUserSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        error:
          "Dados inválidos"
      });
    }

    const targetId =
      String(
        req.params.id || ""
      );

    if (!targetId) {
      return res.status(400).json({
        error:
          "Usuário inválido"
      });
    }

    const [current] =
      await db
        .select({
          id:
            users.id,
          role:
            users.role,
          isActive:
            users.isActive,
          username:
            users.username
        })
        .from(users)
        .where(
          eq(
            users.id,
            targetId
          )
        )
        .limit(1);

    if (!current) {
      return res.status(404).json({
        error:
          "Usuário não encontrado"
      });
    }

    if (
      targetId ===
      admin.id
    ) {
      if (
        parsed.data.isActive ===
        false
      ) {
        return res.status(400).json({
          error:
            "Você não pode desativar sua própria conta administrativa."
        });
      }

      if (
        parsed.data.role &&
        parsed.data.role !==
          "ADMIN"
      ) {
        return res.status(400).json({
          error:
            "Você não pode remover seu próprio perfil ADMIN."
        });
      }
    }

    const [updated] =
      await db
        .update(users)
        .set({
          role:
            parsed.data.role ??
            current.role,
          isActive:
            parsed.data.isActive ??
            current.isActive,
          updatedAt:
            new Date()
        })
        .where(
          eq(
            users.id,
            targetId
          )
        )
        .returning({
          id:
            users.id,
          name:
            users.name,
          username:
            users.username,
          email:
            users.email,
          role:
            users.role,
          isActive:
            users.isActive,
          updatedAt:
            users.updatedAt
        });

    await writeAudit(req, {
      userId:
        admin.id,
      action:
        "ADMIN_UPDATE_USER",
      entityType:
        "USER",
      entityId:
        targetId,
      details: {
        previousRole:
          current.role,
        newRole:
          updated.role,
        previousActive:
          current.isActive,
        newActive:
          updated.isActive
      }
    });

    return res.json({
      user:
        updated
    });
  }
);

router.get(
  "/audit",
  requireAuth,
  async (req, res) => {
    const admin =
      await requireAdminUser(
        req.authUser!.id
      );

    if (!admin) {
      return res.status(403).json({
        error:
          "Acesso restrito ao administrador"
      });
    }

    const limit =
      Math.min(
        100,
        Math.max(
          1,
          Number(
            req.query.limit || 50
          )
        )
      );

    const action =
      String(
        req.query.action ||
        ""
      ).trim();

    const where =
      action
        ? eq(
            auditLogs.action,
            action
          )
        : undefined;

    const rows =
      await db
        .select({
          id:
            auditLogs.id,
          userId:
            auditLogs.userId,
          action:
            auditLogs.action,
          entityType:
            auditLogs.entityType,
          entityId:
            auditLogs.entityId,
          ipAddress:
            auditLogs.ipAddress,
          userAgent:
            auditLogs.userAgent,
          details:
            auditLogs.details,
          createdAt:
            auditLogs.createdAt,
          username:
            users.username,
          name:
            users.name
        })
        .from(auditLogs)
        .leftJoin(
          users,
          eq(
            auditLogs.userId,
            users.id
          )
        )
        .where(where)
        .orderBy(
          desc(
            auditLogs.createdAt
          )
        )
        .limit(limit);

    const items =
      rows.map(
        (row) => {
          let details:
            unknown =
            row.details;

          if (
            typeof
              row.details ===
              "string" &&
            row.details
          ) {
            try {
              details =
                JSON.parse(
                  row.details
                );
            } catch {
              details =
                row.details;
            }
          }

          return {
            ...row,
            details
          };
        }
      );

    return res.json({
      items
    });
  }
);

export default router;
