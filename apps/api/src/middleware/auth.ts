import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthUser } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request { authUser?: AuthUser }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado" });
  try {
    req.authUser = await verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Sessão inválida ou expirada" });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    try { req.authUser = await verifyToken(header.slice(7)); } catch { /* público continua anônimo */ }
  }
  next();
}
