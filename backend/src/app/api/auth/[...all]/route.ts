import { auth } from "auth/server";
import { NextRequest, NextResponse } from "next/server";
import { corsForAuth, addAuthCorsHeaders } from "@/lib/cors";

export default async function handler(request: NextRequest): Promise<NextResponse> {
  // CORS preflight first
  if (request.method === "OPTIONS") {
    throw new Error("OPTIONS_HANDLER_HIT");
  }

  // Delegate GET/POST (and any other method) to better-auth
  const authResponse = await auth.handler(request);
  return addAuthCorsHeaders(authResponse as NextResponse, request);
}

export const runtime = "nodejs";
