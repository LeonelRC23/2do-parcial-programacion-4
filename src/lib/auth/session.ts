import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, type Rol } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";

/** Nombre de la cookie httpOnly que guarda el JWT de sesión (RF-U1, §11.1). */
export const SESSION_COOKIE = "gc_session";

/** Duración de la sesión en días. */
const SESSION_DURATION_DAYS = 7;

/** Usuario autenticado expuesto a servicios y UI (sin hash de contraseña). */
export type SessionUser = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
};

/**
 * Obtiene la clave secreta para firmar/verificar JWT desde AUTH_SECRET.
 * @throws si el secreto falta o es demasiado corto.
 */
function getAuthSecretKey() {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret || authSecret.length < 16) {
    throw new Error("AUTH_SECRET debe tener al menos 16 caracteres");
  }
  return new TextEncoder().encode(authSecret);
}

/**
 * Crea un JWT firmado con el id del usuario como `sub`.
 * Se guarda en la cookie de sesión tras el login (RF-U1).
 */
export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getAuthSecretKey());
}

/**
 * Verifica la firma y vigencia del JWT de sesión.
 * @returns el id de usuario o null si el token es inválido/vencido.
 */
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

/**
 * Opciones estándar de la cookie de sesión (httpOnly, SameSite=Lax).
 * @param maxAgeSeconds 0 borra la cookie (logout).
 */
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

/**
 * Resuelve el usuario autenticado contra la base en cada pedido (sección 10.5).
 * Un usuario desactivado o con cookie inválida pierde el acceso de inmediato.
 * @returns el usuario o null si no hay sesión válida.
 */
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

/**
 * Exige una sesión válida (RF-U2).
 * @throws ApiError 401 NO_AUTENTICADO si no hay usuario.
 */
export async function requireUser(): Promise<SessionUser> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new ApiError(401, "NO_AUTENTICADO", "Debés iniciar sesión.");
  }
  return sessionUser;
}

/**
 * Exige rol administrador.
 * @throws ApiError 403 SIN_PERMISO si el rol no alcanza.
 */
export function requireAdmin(sessionUser: SessionUser): void {
  if (sessionUser.rol !== "admin") {
    throw new ApiError(403, "SIN_PERMISO", "No tenés permiso para esta acción.");
  }
}

/**
 * Exige que el usuario tenga uno de los roles indicados.
 * @throws ApiError 403 SIN_PERMISO si el rol no está en la lista.
 */
export function requireRole(sessionUser: SessionUser, allowedRoles: Rol[]): void {
  if (!allowedRoles.includes(sessionUser.rol)) {
    throw new ApiError(403, "SIN_PERMISO", "No tenés permiso para esta acción.");
  }
}
