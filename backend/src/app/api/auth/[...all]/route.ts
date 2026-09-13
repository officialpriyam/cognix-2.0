import { auth } from "auth/server";
import { NextRequest, NextResponse } from "next/server";
import { corsForAuth, addAuthCorsHeaders } from "@/lib/cors";

export default async function handler(request: NextRequest): Promise<NextResponse> {
  // CORS preflight first
  if (request.method === "OPTIONS") {
    const preflight = corsForAuth(request);
    if (preflight) {
      preflight.headers.set("x-cors-debug", "yes");
      preflight.headers.set("access-control-allow-origin", preflight.headers.get("access-control-allow-origin") ?? "");
      return preflight;
    }
    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.headers.set("x-cors-debug", "no-preflight");
    return res;
  }

  // Delegate GET/POST (and any other method) to better-auth
  const authResponse = await auth.handler(request);
  return addAuthCorsHeaders(authResponse as NextResponse, request);
}

// Diagnostic endpoint to confirm the deployed route file is active.
// Remove after confirming CORS works.
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (request.nextUrl.pathname === "/api/auth/_cors-test") {
    const res = NextResponse.json({ deployed: true, time: Date.now() });
    res.headers.set("x-cors-debug", "yes");
    return res;
  }
  const authResponse = await auth.handler(request);
  return addAuthCorsHeaders(authResponse as NextResponse, request);
}

export const runtime = "nodejs";
