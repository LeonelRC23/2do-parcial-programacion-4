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
  /** Delta con signo: negativo descuenta, positivo suma. */
  cantidad: number;
  tipo: TipoMovimiento;
  motivo?: string | null;
  observacion?: string | null;
  facturaId?: number | null;
  usuarioId: number;
};

/**
 * Regla 1 y 2 / sección 10.2 — Única función que modifica la existencia de un producto.
 * Actualiza con condición atómica (`existencia >= cantidad pedida` al descontar)
 * y graba el movimiento de stock en la misma transacción.
 * Ventas, anulaciones, ingresos y egresos deben llamar solo a esta función.
 *
 * @param tx Transacción Drizzle abierta por el llamador.
 * @param input Delta, tipo de movimiento y metadatos.
 * @returns El movimiento de stock insertado.
 * @throws STOCK_INSUFICIENTE (409) si un descuento dejaría la existencia negativa.
 */
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
    // Regla 1: UPDATE condicional — si no alcanza stock, 0 filas.
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

/**
 * RF-P4 / RF-P5 — Registra un ingreso o egreso manual de stock (solo admin).
 * Valida el cuerpo con Zod, abre una transacción y delega en `moverStock`.
 *
 * @param sessionUser Usuario autenticado (debe ser admin).
 * @param productoId Id del producto a ajustar.
 * @param raw Cuerpo `{ tipo, cantidad, motivo, observacion? }`.
 */
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
