import { Router } from "express";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createDb, users } from "@prompthub/database";
import { signToken } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

const db = createDb();
const router = Router();

router.post("/register", async (_req, res) => {
  return res.status(403).json({
    error: "Cadastro público desativado. Solicite acesso ao administrador."
  });
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados inválidos"
    });
  }

  const email = parsed.data.email.toLowerCase();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return res.status(401).json({
      error: "E-mail ou senha inválidos"
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      error: "Usuário desativado. Procure o administrador."
    });
  }

  const passwordOk = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash
  );

  if (!passwordOk) {
    return res.status(401).json({
      error: "E-mail ou senha inválidos"
    });
  }

  const token = await signToken({
    id: user.id,
    username: user.username,
    email: user.email
  });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive
    }
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      role: users.role,
      isActive: users.isActive
    })
    .from(users)
    .where(and(eq(users.id, req.authUser!.id)))
    .limit(1);

  if (!user) {
    return res.status(404).json({
      error: "Usuário não encontrado"
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      error: "Usuário desativado"
    });
  }

  return res.json({ user });
});

export default router;
