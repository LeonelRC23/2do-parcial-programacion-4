import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, type Rol } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";

export const SESSION_COOKIE = "gc_session";

const SESSION_DURATION_DAYS = 7;

export type SessionUser = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
};

function getAuthSecretKey() {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret || authSecret.length < 16) {
    throw new Error("AUTH_SECRET debe tener al menos 16 caracteres");
  }
  return new TextEncoder().encode(authSecret);
}

export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getAuthSecretKey());
}

export async function verifySessionToken(
  sessionToken: string,
): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(sessionToken, getAuthSecretKey());
    const subject = payload.sub;
    if (!subject) return null;
    return Number(subject);
  } catch {
    return null;
  }
}

export function sessionCookieOptions(
  maxAgeSeconds = SESSION_DURATION_DAYS * 24 * 60 * 60,
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const userId = await verifySessionToken(sessionToken);
  if (!userId) return null;

  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.id, userId),
  });

  if (!usuario || !usuario.activo) return null;

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new ApiError(401, "NO_AUTENTICADO", "Debés iniciar sesión.");
  }
  return sessionUser;
}

export function requireAdmin(sessionUser: SessionUser): void {
  if (sessionUser.rol !== "admin") {
    throw new ApiError(403, "SIN_PERMISO", "No tenés permiso para esta acción.");
  }
}

export function requireRole(sessionUser: SessionUser, allowedRoles: Rol[]): void {
  if (!allowedRoles.includes(sessionUser.rol)) {
    throw new ApiError(403, "SIN_PERMISO", "No tenés permiso para esta acción.");
  }
}
