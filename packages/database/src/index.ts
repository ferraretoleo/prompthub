import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

export function createDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error("DATABASE_URL não definida");
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export * from "./schema.js";
