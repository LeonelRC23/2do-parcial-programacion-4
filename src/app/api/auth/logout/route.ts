import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export const POST = apiHandler(async () => {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
});
