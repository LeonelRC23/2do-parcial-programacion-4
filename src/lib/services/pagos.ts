import { eq } from "drizzle-orm";
import { db, type Tx } from "@/lib/db";
import {
  clientes,
  contadores,
  movimientosCuenta,
  pagos,
  usuarios,
} from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";
import { crearPagoSchema } from "@/lib/schemas/clientes";
import type { SessionUser } from "@/lib/auth/session";
import {
  formatNumeroRecibo,
  PUNTO_VENTA,
  sqliteToIso,
} from "@/lib/format";
import { saldoCliente } from "./clientes";

/**
 * Regla 4 — Obtiene y reserva el próximo número correlativo de recibo de pago (sin huecos).
 */
async function nextReciboNumero(tx: Tx): Promise<number> {
  const clave = "recibo";
  const contadorExistente = await tx.query.contadores.findFirst({
    where: eq(contadores.clave, clave),
  });
  if (!contadorExistente) {
    await tx.insert(contadores).values({ clave, valor: 1 });
    return 1;
  }
  const siguienteNumero = contadorExistente.valor + 1;
  await tx
    .update(contadores)
    .set({ valor: siguienteNumero })
    .where(eq(contadores.clave, clave));
  return siguienteNumero;
}

/**
 * Arma el DTO público de un pago con cliente, usuario y saldo resultante.
 */
function mapPago(
  pago: typeof pagos.$inferSelect,
  cliente: { id: number; nombre: string },
  usuario: { id: number; nombre: string },
  saldoClienteVal: number,
) {
  return {
    id: pago.id,
    numeroRecibo: formatNumeroRecibo(pago.puntoVenta, pago.numero),
    fecha: sqliteToIso(pago.fecha),
    cliente,
    importe: pago.importe,
    medio: pago.medio,
    observacion: pago.observacion,
    usuario,
    saldoCliente: saldoClienteVal,
  };
}

/**
 * RF-C5 — Registra un pago en cuenta corriente: recibo numerado, crédito en movimientos (regla 8).
 * @throws PAGO_SUPERA_DEUDA si el importe supera el saldo pendiente.
 */
export async function registrarPago(
  user: SessionUser,
  clienteId: number,
  raw: unknown,
) {
  const data = crearPagoSchema.parse(raw);

  const cliente = await db.query.clientes.findFirst({
    where: eq(clientes.id, clienteId),
  });
  if (!cliente || !cliente.activo) {
    throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado.");
  }
  if (!cliente.cuentaCorriente) {
    throw new ApiError(
      422,
      "CUENTA_CORRIENTE_NO_HABILITADA",
      "El cliente no tiene cuenta corriente habilitada.",
    );
  }

  const saldo = await saldoCliente(clienteId);
  if (data.importe > saldo) {
    throw new ApiError(
      422,
      "PAGO_SUPERA_DEUDA",
      "El pago no puede superar la deuda.",
      [{ saldoActual: saldo, importe: data.importe }],
    );
  }

  return db.transaction(async (tx) => {
    const numero = await nextReciboNumero(tx);
    const [pago] = await tx
      .insert(pagos)
      .values({
        puntoVenta: PUNTO_VENTA,
        numero,
        clienteId,
        usuarioId: user.id,
        importe: data.importe,
        medio: data.medio,
        observacion: data.observacion ?? null,
      })
      .returning();

    await tx.insert(movimientosCuenta).values({
      clienteId,
      tipo: "credito",
      importe: data.importe,
      descripcion: `Recibo ${formatNumeroRecibo(PUNTO_VENTA, numero)}`,
      pagoId: pago.id,
    });

    const nuevoSaldo = saldo - data.importe;
    return mapPago(
      pago,
      { id: cliente.id, nombre: cliente.nombre },
      { id: user.id, nombre: user.nombre },
      nuevoSaldo,
    );
  });
}

/**
 * RF-C5 — Devuelve un recibo de pago para reimpresión, con saldo actual del cliente.
 */
export async function getPago(_user: SessionUser, id: number) {
  const pago = await db.query.pagos.findFirst({
    where: eq(pagos.id, id),
  });
  if (!pago) {
    throw new ApiError(404, "NO_ENCONTRADO", "Pago no encontrado.");
  }

  const cliente = await db.query.clientes.findFirst({
    where: eq(clientes.id, pago.clienteId),
  });
  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.id, pago.usuarioId),
  });
  const saldo = await saldoCliente(pago.clienteId);

  return mapPago(
    pago,
    { id: cliente!.id, nombre: cliente!.nombre },
    { id: usuario!.id, nombre: usuario!.nombre },
    saldo,
  );
}