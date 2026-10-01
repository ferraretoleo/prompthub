import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/backend";

export async function POST(request: Request) {
  const body = await request.text();
  const response = await fetch(backendUrl("/api/auth/login"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok) return NextResponse.json(data, { status: response.status });

  const next = NextResponse.json({ user: data.user });
  next.cookies.set("prompthub_token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return next;
}
