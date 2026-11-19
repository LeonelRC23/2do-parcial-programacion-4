import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";
import {
  changePasswordSchema,
  loginSchema,
} from "@/lib/schemas/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";

/**
 * Proyecta un usuario de DB a la forma pública de la API (sin passwordHash).
 */
function toPublicUser(usuario: {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "vendedor";
}) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
}

/**
 * RF-U1 — Inicia sesión con email y contraseña.
 * Mensaje único si el email no existe, la contraseña no coincide o el usuario está inactivo.
 * @param raw Cuerpo sin validar `{ email, password }`.
 * @returns Usuario público (el Route Handler setea la cookie).
 */
export async function login(raw: unknown) {
  const credentials = loginSchema.parse(raw);

  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.email, credentials.email.toLowerCase().trim()),
  });

  if (!usuario || !usuario.activo) {
    throw new ApiError(
      401,
      "CREDENCIALES_INVALIDAS",
      "Email o contraseña incorrectos.",
    );
  }

  const passwordMatches = await verifyPassword(
    credentials.password,
    usuario.passwordHash,
  );
  if (!passwordMatches) {
    throw new ApiError(
      401,
      "CREDENCIALES_INVALIDAS",
      "Email o contraseña incorrectos.",
    );
  }

  return toPublicUser(usuario);
}

/**
 * RF-U5 — Cambia la contraseña del usuario conectado.
 * Exige la contraseña actual y una nueva de al menos 8 caracteres.
 * @param sessionUser Usuario autenticado.
 * @param raw Cuerpo `{ actual, nueva }`.
 */
export async function changePassword(sessionUser: SessionUser, raw: unknown) {
  const passwords = changePasswordSchema.parse(raw);

  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.id, sessionUser.id),
  });
  if (!usuario) {
    throw new ApiError(401, "NO_AUTENTICADO", "Debés iniciar sesión.");
  }

  const currentMatches = await verifyPassword(
    passwords.actual,
    usuario.passwordHash,
  );
  if (!currentMatches) {
    throw new ApiError(
      422,
      "CONTRASENA_ACTUAL_INCORRECTA",
      "La contraseña actual es incorrecta.",
    );
  }

  const newPasswordHash = await hashPassword(passwords.nueva);
  await db
    .update(usuarios)
    .set({ passwordHash: newPasswordHash })
    .where(eq(usuarios.id, sessionUser.id));
}
