import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  FRONTEND_URL: z.string().url(),
  PORT: z.coerce.number().default(10000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  RESEND_API_KEY: z.string().min(1).optional(),
  PASSWORD_RESET_FROM_EMAIL: z.string().email().optional()
});

export const env = schema.parse(process.env);
