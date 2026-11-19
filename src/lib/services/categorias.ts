import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categorias, productos } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";
import {
  createCategoriaSchema,
  updateCategoriaSchema,
} from "@/lib/schemas/productos";
import type { SessionUser } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/session";

/**
 * RF-P7 — Lista todas las categorías activas (sin paginar), ordenadas por nombre.
 */
export async function listCategorias(_sessionUser: SessionUser) {
  return db.query.categorias.findMany({
    where: eq(categorias.activa, true),
    orderBy: (categoria, { asc }) => [asc(categoria.nombre)],
  });
}

/**
 * RF-P7 — Alta de categoría con nombre único (solo admin).
 * @throws NOMBRE_DUPLICADO (409) si ya existe.
 */
export async function createCategoria(sessionUser: SessionUser, raw: unknown) {
  requireAdmin(sessionUser);
  const nuevaCategoria = createCategoriaSchema.parse(raw);

  const nombreExistente = await db.query.categorias.findFirst({
    where: eq(categorias.nombre, nuevaCategoria.nombre),
  });
  if (nombreExistente) {
    throw new ApiError(
      409,
      "NOMBRE_DUPLICADO",
      "Ya existe una categoría con ese nombre.",
    );
  }

  const [categoriaCreada] = await db
    .insert(categorias)
    .values({ nombre: nuevaCategoria.nombre })
    .returning();
  return categoriaCreada;
}

/**
 * RF-P7 — Edición o desactivación de categoría (solo admin).
 * No permite desactivar si hay productos activos asociados (CATEGORIA_EN_USO).
 */
export async function updateCategoria(
  sessionUser: SessionUser,
  categoriaId: number,
  raw: unknown,
) {
  requireAdmin(sessionUser);
  const cambios = updateCategoriaSchema.parse(raw);

  const categoria = await db.query.categorias.findFirst({
    where: eq(categorias.id, categoriaId),
  });
  if (!categoria) {
    throw new ApiError(404, "NO_ENCONTRADO", "Categoría no encontrada.");
  }

  if (cambios.nombre) {
    const nombreDuplicado = await db.query.categorias.findFirst({
      where: and(
        eq(categorias.nombre, cambios.nombre),
        sql`${categorias.id} != ${categoriaId}`,
      ),
    });
    if (nombreDuplicado) {
      throw new ApiError(
        409,
        "NOMBRE_DUPLICADO",
        "Ya existe una categoría con ese nombre.",
      );
    }
  }

  if (cambios.activa === false) {
    const productoActivoEnCategoria = await db.query.productos.findFirst({
      where: and(
        eq(productos.categoriaId, categoriaId),
        eq(productos.activo, true),
      ),
    });
    if (productoActivoEnCategoria) {
      throw new ApiError(
        409,
        "CATEGORIA_EN_USO",
        "No se puede desactivar: hay productos activos en esta categoría.",
      );
    }
  }

  const [categoriaActualizada] = await db
    .update(categorias)
    .set(cambios)
    .where(eq(categorias.id, categoriaId))
    .returning();
  return categoriaActualizada;
}
