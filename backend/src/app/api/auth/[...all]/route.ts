import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const res = NextResponse.json({ hit: "OPTIONS_named" }, { status: 200 });
  res.headers.set("x-cors-debug", "OPTIONS_named_export");
  res.headers.set("access-control-allow-origin", "*");
  return res;
}
