import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/backend";

type Context = { params: Promise<{ path: string[] }> };

async function handler(request: Request, context: Context) {
  const { path } = await context.params;
  const token = (await cookies()).get("prompthub_token")?.value;
  const url = new URL(request.url);
  const target = backendUrl(`/api/${path.join("/")}${url.search}`);
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const response = await fetch(target, { method, headers, body, cache: "no-store" });
  const payload = await response.arrayBuffer();
  return new NextResponse(payload, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" }
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
