import type { Request } from "express";
import { auditLogs, createDb } from "@prompthub/database";

const db = createDb();

type AuditInput = {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

export async function writeAudit(
  req: Request,
  input: AuditInput
) {
  try {
    await db.insert(auditLogs).values({
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      ipAddress: (req.ip || req.socket.remoteAddress || "").slice(0, 64) || null,
      userAgent: req.get("user-agent")?.slice(0, 2000) || null,
      details: input.details ? JSON.stringify(input.details) : null
    });
  } catch (error) {
    console.error(
      "AUDIT_ERROR",
      error instanceof Error ? error.message : "erro desconhecido"
    );
  }
}
