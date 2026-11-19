import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categorias,
  facturas,
  movimientosStock,
  productos,
  usuarios,
} from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";
import {
  createProductoSchema,
  updateProductoSchema,
} from "@/lib/schemas/productos";
import type { SessionUser } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/session";
import { moverStock } from "./stock";
import { formatNumeroFactura, sqliteToIso } from "@/lib/format";

/**
 * Arma el DTO público de un producto con categoría y marca de stock bajo el mínimo (RF-P1).
 */
function mapProducto(
  producto: typeof productos.$inferSelect,
  categoria: { id: number; nombre: string },
) {
  return {
    id: producto.id,
    codigo: producto.codigo,
    descripcion: producto.descripcion,
    categoria: { id: categoria.id, nombre: categoria.nombre },
    precio: producto.precio,
    existencia: producto.existencia,
    stockMinimo: producto.stockMinimo,
    bajoMinimo: producto.existencia < producto.stockMinimo,
    activo: producto.activo,
  };
}

/**
 * RF-P1 — Catálogo paginado con búsqueda, filtro por categoría y productos bajo mínimo.
 */
export async function listProductos(
  user: SessionUser,
  query: {
    q?: string;
    categoriaId?: number;
    bajoMinimo?: boolean;
    activo?: string;
    page: number;
    pageSize: number;
  },
) {
  const conditions = [];

  if (query.activo === "todos" && user.rol === "admin") {
    // sin filtro
  } else if (query.activo === "false") {
    conditions.push(eq(productos.activo, false));
  } else {
    conditions.push(eq(productos.activo, true));
  }

  if (query.q) {
    const searchPattern = `%${query.q}%`;
    conditions.push(
      or(
        like(productos.codigo, searchPattern),
        like(productos.descripcion, searchPattern),
      )!,
    );
  }
  if (query.categoriaId) {
    conditions.push(eq(productos.categoriaId, query.categoriaId));
  }
  if (query.bajoMinimo) {
    conditions.push(sql`${productos.existencia} < ${productos.stockMinimo}`);
  }

  const where = and(...conditions);

  const [totalRow] = await db
    .select({ total: count() })
    .from(productos)
    .where(where);

  const rows = await db
    .select({
      producto: productos,
      categoria: { id: categorias.id, nombre: categorias.nombre },
    })
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(where)
    .orderBy(productos.codigo)
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return {
    data: rows.map((row) => mapProducto(row.producto, row.categoria)),
    page: query.page,
    pageSize: query.pageSize,
    total: totalRow.total,
  };
}

/**
 * RF-P1 — Ficha de un producto por id.
 */
export async function getProducto(_user: SessionUser, id: number) {
  const row = await db
    .select({
      producto: productos,
      categoria: { id: categorias.id, nombre: categorias.nombre },
    })
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(eq(productos.id, id))
    .limit(1);

  if (!row[0]) {
    throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado.");
  }
  return mapProducto(row[0].producto, row[0].categoria);
}

/**
 * RF-P2 — Alta de producto; el stock inicial se registra como ingreso (regla 2).
 */
export async function createProducto(user: SessionUser, raw: unknown) {
  requireAdmin(user);
  const data = createProductoSchema.parse(raw);

  const categoria = await db.query.categorias.findFirst({
    where: and(eq(categorias.id, data.categoriaId), eq(categorias.activa, true)),
  });
  if (!categoria) {
    throw new ApiError(422, "VALIDACION", "Categoría inválida.", [
      { campo: "categoriaId", mensaje: "Categoría no encontrada o inactiva." },
    ]);
  }

  const duplicado = await db.query.productos.findFirst({
    where: eq(productos.codigo, data.codigo),
  });
  if (duplicado) {
    throw new ApiError(409, "CODIGO_DUPLICADO", "Ese código ya existe.");
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(productos)
      .values({
        codigo: data.codigo,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId,
        precio: data.precio,
        stockMinimo: data.stockMinimo,
        existencia: 0,
      })
      .returning();

    if (data.stockInicial && data.stockInicial > 0) {
      await moverStock(tx, {
        productoId: created.id,
        cantidad: data.stockInicial,
        tipo: "ingreso",
        motivo: "Stock inicial",
        usuarioId: user.id,
      });
    }

    const refreshed = await tx.query.productos.findFirst({
      where: eq(productos.id, created.id),
    });
    return mapProducto(refreshed!, categoria);
  });
}

/**
 * RF-P2 / RF-P3 — Edición y baja lógica; la existencia no se modifica a mano (regla 2).
 */
export async function updateProducto(
  user: SessionUser,
  id: number,
  raw: unknown,
) {
  requireAdmin(user);

  if (
    raw &&
    typeof raw === "object" &&
    "existencia" in (raw as Record<string, unknown>)
  ) {
    throw new ApiError(422, "VALIDACION", "La existencia no se edita a mano.", [
      { campo: "existencia", mensaje: "Usá un movimiento de stock." },
    ]);
  }

  const data = updateProductoSchema.parse(raw);

  const producto = await db.query.productos.findFirst({
    where: eq(productos.id, id),
  });
  if (!producto) {
    throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado.");
  }

  if (data.codigo) {
    const duplicado = await db.query.productos.findFirst({
      where: and(
        eq(productos.codigo, data.codigo),
        sql`${productos.id} != ${id}`,
      ),
    });
    if (duplicado) {
      throw new ApiError(409, "CODIGO_DUPLICADO", "Ese código ya existe.");
    }
  }

  if (data.categoriaId) {
    const categoriaValida = await db.query.categorias.findFirst({
      where: eq(categorias.id, data.categoriaId),
    });
    if (!categoriaValida) {
      throw new ApiError(422, "VALIDACION", "Categoría inválida.");
    }
  }

  const [updated] = await db
    .update(productos)
    .set(data)
    .where(eq(productos.id, id))
    .returning();

  const categoria = await db.query.categorias.findFirst({
    where: eq(categorias.id, updated.categoriaId),
  });
  return mapProducto(updated, categoria!);
}

/**
 * RF-P6 — Historial de movimientos de stock de un producto (paginado).
 */
export async function listMovimientosProducto(
  _user: SessionUser,
  productoId: number,
  query: { page: number; pageSize: number },
) {
  const producto = await db.query.productos.findFirst({
    where: eq(productos.id, productoId),
  });
  if (!producto) {
    throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado.");
  }

  const where = eq(movimientosStock.productoId, productoId);
  const [totalRow] = await db
    .select({ total: count() })
    .from(movimientosStock)
    .where(where);

  const rows = await db
    .select({
      movimiento: movimientosStock,
      usuario: { id: usuarios.id, nombre: usuarios.nombre },
      factura: {
        id: facturas.id,
        puntoVenta: facturas.puntoVenta,
        numero: facturas.numero,
      },
    })
    .from(movimientosStock)
    .innerJoin(usuarios, eq(movimientosStock.usuarioId, usuarios.id))
    .leftJoin(facturas, eq(movimientosStock.facturaId, facturas.id))
    .where(where)
    .orderBy(desc(movimientosStock.fecha), desc(movimientosStock.id))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return {
    data: rows.map((row) => ({
      id: row.movimiento.id,
      producto: { id: producto.id, codigo: producto.codigo },
      tipo: row.movimiento.tipo,
      cantidad: row.movimiento.cantidad,
      existenciaResultante: row.movimiento.existenciaResultante,
      motivo: row.movimiento.motivo,
      referencia: row.factura?.id
        ? {
            facturaId: row.factura.id,
            numero: formatNumeroFactura(
              row.factura.puntoVenta,
              row.factura.numero,
            ),
          }
        : null,
      usuario: row.usuario,
      fecha: sqliteToIso(row.movimiento.fecha),
    })),
    page: query.page,
    pageSize: query.pageSize,
    total: totalRow.total,
  };
}

/**
 * RF-P6 — Listado global de movimientos de stock con filtros opcionales.
 */
export async function listMovimientosStock(
  _user: SessionUser,
  query: {
    productoId?: number;
    tipo?: string;
    desde?: string;
    hasta?: string;
    page: number;
    pageSize: number;
  },
) {
  const conditions = [];
  if (query.productoId) {
    conditions.push(eq(movimientosStock.productoId, query.productoId));
  }
  if (query.tipo) {
    conditions.push(
      eq(
        movimientosStock.tipo,
        query.tipo as "venta" | "anulacion" | "ingreso" | "egreso",
      ),
    );
  }
  if (query.desde) {
    conditions.push(sql`${movimientosStock.fecha} >= ${query.desde}`);
  }
  if (query.hasta) {
    conditions.push(sql`${movimientosStock.fecha} < ${query.hasta} || ' 23:59:59'`);
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [totalRow] = await db
    .select({ total: count() })
    .from(movimientosStock)
    .where(where);

  const rows = await db
    .select({
      movimiento: movimientosStock,
      producto: { id: productos.id, codigo: productos.codigo },
      usuario: { id: usuarios.id, nombre: usuarios.nombre },
      factura: {
        id: facturas.id,
        puntoVenta: facturas.puntoVenta,
        numero: facturas.numero,
      },
    })
    .from(movimientosStock)
    .innerJoin(productos, eq(movimientosStock.productoId, productos.id))
    .innerJoin(usuarios, eq(movimientosStock.usuarioId, usuarios.id))
    .leftJoin(facturas, eq(movimientosStock.facturaId, facturas.id))
    .where(where)
    .orderBy(desc(movimientosStock.fecha), desc(movimientosStock.id))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return {
    data: rows.map((row) => ({
      id: row.movimiento.id,
      producto: row.producto,
      tipo: row.movimiento.tipo,
      cantidad: row.movimiento.cantidad,
      existenciaResultante: row.movimiento.existenciaResultante,
      motivo: row.movimiento.motivo,
      referencia: row.factura?.id
        ? {
            facturaId: row.factura.id,
            numero: formatNumeroFactura(
              row.factura.puntoVenta,
              row.factura.numero,
            ),
          }
        : null,
      usuario: row.usuario,
      fecha: sqliteToIso(row.movimiento.fecha),
    })),
    page: query.page,
    pageSize: query.pageSize,
    total: totalRow.total,
  };
}