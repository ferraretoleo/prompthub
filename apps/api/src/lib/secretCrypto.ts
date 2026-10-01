import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import { env } from "./env.js";

function encryptionKey() {
  if (!env.AI_KEYS_ENCRYPTION_SECRET) {
    throw new Error(
      "AI_KEYS_ENCRYPTION_SECRET não configurada no servidor"
    );
  }

  return createHash("sha256")
    .update(env.AI_KEYS_ENCRYPTION_SECRET)
    .digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final()
  ]);

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64")
  };
}

export function decryptSecret(
  encrypted: string,
  iv: string,
  tag: string
) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64")
  );

  decipher.setAuthTag(
    Buffer.from(tag, "base64")
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encrypted, "base64")
    ),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}
