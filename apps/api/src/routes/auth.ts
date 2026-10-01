import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  and,
  eq,
  gt,
  isNull,
  or
} from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import {
  createDb,
  passwordResetTokens,
  users
} from "@prompthub/database";
import { signToken } from "../lib/auth.js";
import { normalizeUsername } from "../lib/utils.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loginRateLimit,
  registerRateLimit,
  resetRateLimit
} from "../middleware/rateLimit.js";
import { writeAudit } from "../lib/audit.js";
import { sendPasswordResetEmail } from "../lib/email.js";
import { env } from "../lib/env.js";

const db = createDb();
const router = Router();

function hashResetToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128)
});

router.post("/register", registerRateLimit, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

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
    return res.status(500).json({
      error: "Falha ao criar usuário"
    });
  }

  await writeAudit(req, {
    userId: user.id,
    action: "REGISTER",
    entityType: "USER",
    entityId: user.id
  });

  const token = await signToken({
    id: user.id,
    username: user.username,
    email: user.email
  });

  return res.status(201).json({
    token,
    user
  });
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

router.post("/login", loginRateLimit, async (req, res) => {
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

  if (
    !user ||
    !(await bcrypt.compare(
      parsed.data.password,
      user.passwordHash
    ))
  ) {
    await writeAudit(req, {
      userId: user?.id ?? null,
      action: "LOGIN_FAILED",
      entityType: "USER",
      entityId: user?.id ?? null
    });

    return res.status(401).json({
      error: "E-mail ou senha inválidos"
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      error: "Conta indisponível"
    });
  }

  await writeAudit(req, {
    userId: user.id,
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id
  });

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
    .where(eq(users.id, req.authUser!.id))
    .limit(1);

  if (!user) {
    return res.status(404).json({
      error: "Usuário não encontrado"
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      error: "Conta indisponível"
    });
  }

  return res.json({ user });
});

const forgotSchema = z.object({
  email: z.string().trim().email()
});

router.post(
  "/forgot-password",
  resetRateLimit,
  async (req, res) => {
    const parsed = forgotSchema.safeParse(req.body);

    const genericResponse = {
      ok: true,
      message:
        "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação."
    };

    if (!parsed.success) {
      return res.json(genericResponse);
    }

    const email = parsed.data.email.toLowerCase();

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        isActive: users.isActive
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.isActive) {
      return res.json(genericResponse);
    }

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);

    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    );

    await db
      .insert(passwordResetTokens)
      .values({
        userId: user.id,
        tokenHash,
        expiresAt
      });

    const resetUrl =
      `${env.FRONTEND_URL.replace(/\/$/, "")}` +
      `/reset-password?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail(
      user.email,
      resetUrl
    );

    await writeAudit(req, {
      userId: user.id,
      action: "PASSWORD_RESET_REQUEST",
      entityType: "USER",
      entityId: user.id
    });

    return res.json(genericResponse);
  }
);

const resetSchema = z.object({
  token: z.string().min(20).max(256),
  password: z.string().min(8).max(128)
});

router.post(
  "/reset-password",
  resetRateLimit,
  async (req, res) => {
    const parsed = resetSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Link ou senha inválidos"
      });
    }

    const tokenHash =
      hashResetToken(parsed.data.token);

    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(
            passwordResetTokens.tokenHash,
            tokenHash
          ),
          isNull(passwordResetTokens.usedAt),
          gt(
            passwordResetTokens.expiresAt,
            new Date()
          )
        )
      )
      .limit(1);

    if (!record) {
      return res.status(400).json({
        error:
          "O link de recuperação é inválido ou expirou."
      });
    }

    const passwordHash =
      await bcrypt.hash(
        parsed.data.password,
        12
      );

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, record.userId));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        eq(
          passwordResetTokens.id,
          record.id
        )
      );

    await writeAudit(req, {
      userId: record.userId,
      action: "PASSWORD_RESET",
      entityType: "USER",
      entityId: record.userId
    });

    return res.json({
      ok: true,
      message:
        "Senha redefinida com sucesso."
    });
  }
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
});

router.post(
  "/change-password",
  requireAuth,
  resetRateLimit,
  async (req, res) => {
    const parsed =
      changePasswordSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        error:
          "A nova senha deve ter pelo menos 8 caracteres."
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.authUser!.id))
      .limit(1);

    if (
      !user ||
      !(await bcrypt.compare(
        parsed.data.currentPassword,
        user.passwordHash
      ))
    ) {
      return res.status(400).json({
        error: "Senha atual incorreta"
      });
    }

    const passwordHash =
      await bcrypt.hash(
        parsed.data.newPassword,
        12
      );

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    await writeAudit(req, {
      userId: user.id,
      action: "CHANGE_PASSWORD",
      entityType: "USER",
      entityId: user.id
    });

    return res.json({
      ok: true,
      message: "Senha alterada."
    });
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmation: z.literal("EXCLUIR")
});

router.delete(
  "/account",
  requireAuth,
  resetRateLimit,
  async (req, res) => {
    const parsed =
      deleteAccountSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        error:
          "Confirmação de exclusão inválida"
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.authUser!.id))
      .limit(1);

    if (
      !user ||
      !(await bcrypt.compare(
        parsed.data.password,
        user.passwordHash
      ))
    ) {
      return res.status(400).json({
        error: "Senha incorreta"
      });
    }

    await writeAudit(req, {
      userId: user.id,
      action: "DELETE_ACCOUNT",
      entityType: "USER",
      entityId: user.id
    });

    await db
      .delete(users)
      .where(eq(users.id, user.id));

    return res.status(204).send();
  }
);

export default router;
