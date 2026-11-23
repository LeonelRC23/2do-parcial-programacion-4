import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { buscarTexto } from "@/lib/db/search";
import { usuarios } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
} from "@/lib/schemas/auth";
import {
  generateTempPassword,
  hashPassword,
} from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/session";

function toPublicUsuario(usuario: typeof usuarios.$inferSelect) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    createdAt: usuario.createdAt,
  };
}

export async function listUsuarios(
  sessionUser: SessionUser,
  query: { q?: string; activo?: string; page: number; pageSize: number },
) {
  requireAdmin(sessionUser);

  const whereConditions = [];
  if (query.q) {
    whereConditions.push(
      or(
        buscarTexto(usuarios.nombre, query.q),
        buscarTexto(usuarios.email, query.q),
      )!,
    );
  }
  if (query.activo === "true") whereConditions.push(eq(usuarios.activo, true));
  if (query.activo === "false") whereConditions.push(eq(usuarios.activo, false));

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(usuarios)
    .where(whereClause);

  const usuarioRows = await db
    .select()
    .from(usuarios)
    .where(whereClause)
    .orderBy(desc(usuarios.id))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return {
    data: usuarioRows.map(toPublicUsuario),
    page: query.page,
    pageSize: query.pageSize,
    total: totalRow.total,
  };
}

export async function createUsuario(sessionUser: SessionUser, raw: unknown) {
  requireAdmin(sessionUser);
  const nuevoUsuario = createUsuarioSchema.parse(raw);
  const emailNormalizado = nuevoUsuario.email.toLowerCase().trim();

  const emailExistente = await db.query.usuarios.findFirst({
    where: eq(usuarios.email, emailNormalizado),
  });
  if (emailExistente) {
    throw new ApiError(409, "EMAIL_DUPLICADO", "Ese email ya está registrado.");
  }

  const passwordHash = await hashPassword(nuevoUsuario.password);
  const [usuarioCreado] = await db
    .insert(usuarios)
    .values({
      nombre: nuevoUsuario.nombre,
      email: emailNormalizado,
      rol: nuevoUsuario.rol,
      passwordHash,
    })
    .returning();

  return toPublicUsuario(usuarioCreado);
}

export async function updateUsuario(
  sessionUser: SessionUser,
  usuarioId: number,
  raw: unknown,
) {
  requireAdmin(sessionUser);
  const cambios = updateUsuarioSchema.parse(raw);

  const usuarioObjetivo = await db.query.usuarios.findFirst({
    where: eq(usuarios.id, usuarioId),
  });
  if (!usuarioObjetivo) {
    throw new ApiError(404, "NO_ENCONTRADO", "Usuario no encontrado.");
  }

  if (sessionUser.id === usuarioId) {
    if (cambios.activo === false || (cambios.rol && cambios.rol !== "admin")) {
      throw new ApiError(
        422,
        "OPERACION_SOBRE_SI_MISMO",
        "No podés desactivarte ni quitarte el rol de administrador.",
      );
    }
  }

  if (cambios.email) {
    const emailNormalizado = cambios.email.toLowerCase().trim();
    const emailDuplicado = await db.query.usuarios.findFirst({
      where: and(
        eq(usuarios.email, emailNormalizado),
        sql`${usuarios.id} != ${usuarioId}`,
      ),
    });
    if (emailDuplicado) {
      throw new ApiError(409, "EMAIL_DUPLICADO", "Ese email ya está registrado.");
    }
    cambios.email = emailNormalizado;
  }

  const [usuarioActualizado] = await db
    .update(usuarios)
    .set(cambios)
    .where(eq(usuarios.id, usuarioId))
    .returning();

  return toPublicUsuario(usuarioActualizado);
}

export async function resetPassword(
  sessionUser: SessionUser,
  usuarioId: number,
) {
  requireAdmin(sessionUser);

  const usuarioObjetivo = await db.query.usuarios.findFirst({
    where: eq(usuarios.id, usuarioId),
  });
  if (!usuarioObjetivo) {
    throw new ApiError(404, "NO_ENCONTRADO", "Usuario no encontrado.");
  }

  const passwordTemporal = generateTempPassword();
  const passwordHash = await hashPassword(passwordTemporal);
  await db
    .update(usuarios)
    .set({ passwordHash })
    .where(eq(usuarios.id, usuarioId));

  return { passwordTemporal };
}
