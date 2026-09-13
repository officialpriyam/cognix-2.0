import { auth } from "auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import {
  corsForAuth,
  addAuthCorsHeaders,
} from "@/lib/cors";

const handler = toNextJsHandler(auth.handler);

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const preflight = corsForAuth(request);
  if (preflight) {
    preflight.headers.set("x-cors-debug", "yes");
    return preflight;
  }
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set("x-cors-debug", "no-preflight");
  return res;
}

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const response = await handler(request);
  return addAuthCorsHeaders(response, request);
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const response = await handler(request);
  return addAuthCorsHeaders(response, request);
};
