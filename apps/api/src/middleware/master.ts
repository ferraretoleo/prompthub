import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { createDb, users } from "@prompthub/database";

const db = createDb();

export async function requireMaster(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser) {
    return res.status(401).json({
      error: "Não autenticado"
    });
  }

  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      isActive: users.isActive
    })
    .from(users)
    .where(eq(users.id, req.authUser.id))
    .limit(1);

  if (!user || !user.isActive) {
    return res.status(403).json({
      error: "Usuário sem acesso"
    });
  }

  if (user.role !== "MASTER") {
    return res.status(403).json({
      error: "Acesso permitido somente ao usuário MASTER"
    });
  }

  next();
}
