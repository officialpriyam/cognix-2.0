import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
];

export function parseAllowedOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS ?? "";
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : DEFAULT_ALLOWED_ORIGINS;
}

function originMatchesAllowed(origin: string, allowed: string[]): boolean {
  if (allowed.includes(origin)) return true;
  try {
    const originHost = new URL(origin).hostname;
    for (const allowedOrigin of allowed) {
      try {
        const allowedHost = new URL(allowedOrigin).hostname;
        if (originHost === allowedHost) return true;
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }
  return false;
}

export function getAllowedOrigin(request: NextRequest): string | null {
  const allowed = parseAllowedOrigins();
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (originMatchesAllowed(origin, allowed)) return origin;
  return null;
}

export function corsForAuth(request: NextRequest): NextResponse | null {
  if (request.method !== "OPTIONS") return null;
  const origin = getAllowedOrigin(request);
  if (!origin) return new NextResponse(null, { status: 403 });

  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,Accept,X-Requested-With");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

export function addAuthCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = getAllowedOrigin(request);
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return response;
}
