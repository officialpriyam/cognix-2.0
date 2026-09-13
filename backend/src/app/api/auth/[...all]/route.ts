import { auth } from "auth/server";
import { NextRequest, NextResponse } from "next/server";
import { corsForAuth, addAuthCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return corsForAuth(request) ?? NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const response = await auth.handler(request);
  return addAuthCorsHeaders(response as NextResponse, request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = await auth.handler(request);
  return addAuthCorsHeaders(response as NextResponse, request);
}

export const runtime = "nodejs";
