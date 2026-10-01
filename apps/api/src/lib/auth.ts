import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.js";

const secret = new TextEncoder().encode(env.AUTH_SECRET);

export type AuthUser = { id: string; username: string; email: string };

export async function signToken(user: AuthUser) {
  return new SignJWT({ username: user.username, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  if (!payload.sub || typeof payload.username !== "string" || typeof payload.email !== "string") {
    throw new Error("Token inválido");
  }
  return { id: payload.sub, username: payload.username, email: payload.email };
}
