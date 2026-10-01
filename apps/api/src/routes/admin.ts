import { Router } from "express";
import bcrypt from "bcryptjs";
import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { createDb, users } from "@prompthub/database";
import { requireAuth } from "../middleware/auth.js";
import { requireMaster } from "../middleware/master.js";
import { normalizeUsername } from "../lib/utils.js";

const router = Router();
const db = createDb();

router.use(requireAuth);
router.use(requireMaster);

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128)
});

router.get("/users", async (_req, res) => {
  const items = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return res.json({ items });
});

router.post("/users", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados inválidos",
      details: parsed.error.flatten()
    });
  }

  const username = normalizeUsername(parsed.data.username);
  const email = parsed.data.email.toLowerCase();

  if (username.length < 3) {
    return res.status(400).json({
      error: "Username inválido"
    });
  }

  const [exists] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        eq(users.email, email),
        eq(users.username, username)
      )
    )
    .limit(1);

  if (exists) {
    return res.status(409).json({
      error: "E-mail ou username já cadastrado"
    });
  }

  const passwordHash = await bcrypt.hash(
    parsed.data.password,
    12
  );

  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      username,
      email,
      passwordHash,
      role: "USER",
      isActive: true
    })
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    });

  return res.status(201).json({ user });
});

const statusSchema = z.object({
  isActive: z.boolean()
});

router.patch("/users/:id/status", async (req, res) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  if (!id) {
    return res.status(400).json({
      error: "ID inválido"
    });
  }

  if (id === req.authUser!.id) {
    return res.status(400).json({
      error: "O usuário MASTER não pode desativar a própria conta"
    });
  }

  const parsed = statusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Status inválido"
    });
  }

  const [target] = await db
    .select({
      id: users.id,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target) {
    return res.status(404).json({
      error: "Usuário não encontrado"
    });
  }

  if (target.role === "MASTER") {
    return res.status(400).json({
      error: "A conta MASTER não pode ser desativada por esta operação"
    });
  }

  const [updated] = await db
    .update(users)
    .set({
      isActive: parsed.data.isActive,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      isActive: users.isActive
    });

  return res.json({ user: updated });
});

const passwordSchema = z.object({
  password: z.string().min(8).max(128)
});

router.patch("/users/:id/password", async (req, res) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  if (!id) {
    return res.status(400).json({
      error: "ID inválido"
    });
  }

  const parsed = passwordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "A senha deve ter entre 8 e 128 caracteres"
    });
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target) {
    return res.status(404).json({
      error: "Usuário não encontrado"
    });
  }

  const passwordHash = await bcrypt.hash(
    parsed.data.password,
    12
  );

  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date()
    })
    .where(eq(users.id, id));

  return res.json({
    ok: true,
    message: "Senha redefinida"
  });
});

export default router;
