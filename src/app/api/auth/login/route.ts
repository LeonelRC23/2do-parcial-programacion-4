import { NextResponse } from "next/server";
import { apiHandler, readJson } from "@/lib/api/handler";
import { login } from "@/lib/services/auth";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";

export const POST = apiHandler(
  async ({ request }) => {
    const body = await readJson(request);
    const user = await login(body);
    const token = await createSessionToken(user.id);
    const res = NextResponse.json(user, { status: 200 });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  },
  { auth: false },
);
