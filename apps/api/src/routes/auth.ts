import { Router } from "express";
import bcrypt from "bcryptjs";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { createDb, users } from "@prompthub/database";
import { signToken } from "../lib/auth.js";
import { normalizeUsername } from "../lib/utils.js";
import { requireAuth } from "../middleware/auth.js";

const db = createDb();
const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128)
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }

  const username = normalizeUsername(parsed.data.username);
  const email = parsed.data.email.toLowerCase();

  if (username.length < 3) {
    return res.status(400).json({ error: "Username inválido" });
  }

  const [exists] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1);

  if (exists) {
    return res.status(409).json({ error: "E-mail ou username já cadastrado" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      username,
      email,
      passwordHash,
      isActive: true
    })
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl
    });

  if (!user) {
    return res.status(500).json({ error: "Falha ao criar usuário" });
  }

  const token = await signToken({
    id: user.id,
    username: user.username,
    email: user.email
  });

  return res.status(201).json({ token, user });
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "E-mail ou senha inválidos" });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "Conta indisponível" });
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
      isActive: users.isActive
    })
    .from(users)
    .where(and(eq(users.id, req.authUser!.id)))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "Conta indisponível" });
  }

  return res.json({ user });
});

export default router;
