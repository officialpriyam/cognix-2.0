import { NextRequest, NextResponse } from "next/server";

export const DEFAULT_ALLOWED_ORIGINS = [
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

export function getAllowedOrigin(request: NextRequest): string | null {
  const allowed = parseAllowedOrigins();
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (allowed.includes(origin)) return origin;
  // Fallback: allow requests whose origin matches any allowed origin loosely
  const originHost = new URL(origin).hostname;
  for (const allowedOrigin of allowed) {
    try {
      if (new URL(allowedOrigin).hostname === originHost) {
        return origin;
      }
    } catch {
      /* skip */
    }
  }
  return null;
}

export function corsForAuth(request: NextRequest): NextResponse | null {
  // Handle preflight
  if (request.method === "OPTIONS") {
    const origin = getAllowedOrigin(request);
    if (!origin) {
      return new NextResponse(null, { status: 403 });
    }
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,Accept,X-Requested-With");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }
  return null;
}

export function addAuthCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = getAllowedOrigin(request);
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return response;
}
