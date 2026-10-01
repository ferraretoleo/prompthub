import { z } from "zod";

const optionalEnvString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().min(1).optional()
);

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  FRONTEND_URL: z.string().url(),
  PORT: z.coerce.number().default(10000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  RESEND_API_KEY: optionalEnvString,
  PASSWORD_RESET_FROM_EMAIL: optionalEnvString,

  OPENAI_API_KEY: optionalEnvString,
  OPENAI_MODEL: optionalEnvString,

  AI_KEYS_ENCRYPTION_SECRET: optionalEnvString
});

export const env = schema.parse(process.env);
