import { and, eq, gte, sql } from "drizzle-orm";
import { db, type Tx } from "@/lib/db";
import { movimientosStock, productos } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";
import type { SessionUser } from "@/lib/auth/session";
import { movimientoStockSchema } from "@/lib/schemas/productos";
import { sqliteToIso } from "@/lib/format";

type TipoMovimiento = "venta" | "anulacion" | "ingreso" | "egreso";

type MoverStockInput = {
  productoId: number;
  cantidad: number;
  tipo: TipoMovimiento;
  motivo?: string | null;
  observacion?: string | null;
  facturaId?: number | null;
  usuarioId: number;
};

/** Única vía para cambiar existencia: UPDATE atómico + movimiento. */
export async function moverStock(tx: Tx, input: MoverStockInput) {
  const {
    productoId,
    cantidad,
    tipo,
    motivo,
    observacion,
    facturaId,
    usuarioId,
  } = input;

  if (cantidad === 0) {
    throw new ApiError(422, "VALIDACION", "La cantidad no puede ser cero.");
  }

  let filasActualizadas: { existencia: number }[];

  if (cantidad < 0) {
    const cantidadADescontar = -cantidad;
    filasActualizadas = await tx
      .update(productos)
      .set({ existencia: sql`${productos.existencia} + ${cantidad}` })
      .where(
        and(
          eq(productos.id, productoId),
          gte(productos.existencia, cantidadADescontar),
        ),
      )
      .returning({ existencia: productos.existencia });

    if (filasActualizadas.length === 0) {
      const producto = await tx.query.productos.findFirst({
        where: eq(productos.id, productoId),
      });
      throw new ApiError(409, "STOCK_INSUFICIENTE", "Stock insuficiente.", [
        {
          productoId,
          solicitado: cantidadADescontar,
          disponible: producto?.existencia ?? 0,
        },
      ]);
    }
  } else {
    filasActualizadas = await tx
      .update(productos)
      .set({ existencia: sql`${productos.existencia} + ${cantidad}` })
      .where(eq(productos.id, productoId))
      .returning({ existencia: productos.existencia });

    if (filasActualizadas.length === 0) {
      throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado.");
    }
  }

  const existenciaResultante = filasActualizadas[0].existencia;

  const [movimiento] = await tx
    .insert(movimientosStock)
    .values({
      productoId,
      tipo,
      cantidad,
      existenciaResultante,
      motivo: motivo ?? null,
      observacion: observacion ?? null,
      facturaId: facturaId ?? null,
      usuarioId,
    })
    .returning();

  return movimiento;
}

/** Ingreso o egreso manual de stock (solo admin). */
export async function registrarMovimientoManual(
  sessionUser: SessionUser,
  productoId: number,
  raw: unknown,
) {
  if (sessionUser.rol !== "admin") {
    throw new ApiError(403, "SIN_PERMISO", "No tenés permiso para esta acción.");
  }

  const movimientoInput = movimientoStockSchema.parse(raw);

  const producto = await db.query.productos.findFirst({
    where: eq(productos.id, productoId),
  });
  if (!producto) {
    throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado.");
  }

  const deltaCantidad =
    movimientoInput.tipo === "ingreso"
      ? movimientoInput.cantidad
      : -movimientoInput.cantidad;

  return db.transaction(async (tx) => {
    const movimiento = await moverStock(tx, {
      productoId,
      cantidad: deltaCantidad,
      tipo: movimientoInput.tipo,
      motivo: movimientoInput.motivo,
      observacion: movimientoInput.observacion,
      usuarioId: sessionUser.id,
    });

    return {
      id: movimiento.id,
      producto: { id: producto.id, codigo: producto.codigo },
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
      existenciaResultante: movimiento.existenciaResultante,
      motivo: movimiento.motivo,
      referencia: null,
      usuario: { id: sessionUser.id, nombre: sessionUser.nombre },
      fecha: sqliteToIso(movimiento.fecha),
    };
  });
}
