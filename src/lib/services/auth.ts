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

/** Proyecta el usuario sin el hash de contraseña. */
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

/** Valida credenciales y devuelve el usuario público. */
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

/** Cambia la contraseña del usuario conectado. */
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
