import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/backend";

type Context = {
  params: Promise<{
    path: string[];
  }>;
};

async function handler(
  request: Request,
  context: Context
) {
  try {
    const { path } =
      await context.params;

    const token =
      (await cookies())
        .get("prompthub_token")
        ?.value;

    const url =
      new URL(request.url);

    const target =
      backendUrl(
        `/api/${path.join("/")}${url.search}`
      );

    const headers =
      new Headers();

    const contentType =
      request.headers.get(
        "content-type"
      );

    if (contentType) {
      headers.set(
        "content-type",
        contentType
      );
    }

    if (token) {
      headers.set(
        "authorization",
        `Bearer ${token}`
      );
    }

    headers.set(
      "accept",
      "application/json"
    );

    const method =
      request.method;

    let body:
      string | undefined;

    if (
      method !== "GET" &&
      method !== "HEAD"
    ) {
      body =
        await request.text();
    }

    const response =
      await fetch(
        target,
        {
          method,
          headers,
          body:
            body &&
            body.length > 0
              ? body
              : undefined,
          cache:
            "no-store"
        }
      );

    const responseText =
      await response.text();

    return new NextResponse(
      responseText,
      {
        status:
          response.status,
        headers: {
          "content-type":
            response.headers.get(
              "content-type"
            ) ||
            "application/json"
        }
      }
    );
  } catch (error) {
    console.error(
      "PROXY_ERROR",
      error instanceof Error
        ? error.message
        : error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Falha no proxy: ${error.message}`
            : "Falha no proxy entre Cloudflare e Render."
      },
      {
        status: 502
      }
    );
  }
}

export const GET =
  handler;

export const POST =
  handler;

export const PATCH =
  handler;

export const DELETE =
  handler;
