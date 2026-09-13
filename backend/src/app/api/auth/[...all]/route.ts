import { auth } from "auth/server";
import { NextRequest, NextResponse } from "next/server";
import { corsForAuth, addAuthCorsHeaders } from "@/lib/cors";

export default async function handler(request: NextRequest): Promise<NextResponse> {
  // CORS preflight first
  if (request.method === "OPTIONS") {
    const preflight = corsForAuth(request);
    if (preflight) {
      preflight.headers.set("x-cors-debug", "yes");
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

export const runtime = "nodejs";
