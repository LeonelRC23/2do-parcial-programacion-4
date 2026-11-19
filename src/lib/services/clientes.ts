import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientes,
  facturas,
  movimientosCuenta,
} from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";
import {
  createClienteSchema,
  updateClienteSchema,
} from "@/lib/schemas/clientes";
import type { SessionUser } from "@/lib/auth/session";
import {
  formatNumeroFactura,
  normalizarDocumento,
  sqliteToIso,
} from "@/lib/format";

/**
 * Regla 7 — Calcula el saldo del cliente como débitos menos créditos,
 * opcionalmente solo hasta una fecha exclusiva.
 */
export async function saldoCliente(
  clienteId: number,
  untilExclusive?: string,
): Promise<number> {
  const conditions = [eq(movimientosCuenta.clienteId, clienteId)];
  if (untilExclusive) {
    conditions.push(sql`${movimientosCuenta.fecha} < ${untilExclusive}`);
  }

  const [row] = await db
    .select({
      saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
    })
    .from(movimientosCuenta)
    .where(and(...conditions));

  return Number(row?.saldo ?? 0);
}

/**
 * Arma el DTO público de un cliente con saldo, disponible de crédito y estado.
 */
function mapCliente(
  cliente: typeof clientes.$inferSelect,
  saldo: number,
) {
  const disponible =
    cliente.limiteCredito == null ? null : cliente.limiteCredito - saldo;
  return {
    id: cliente.id,
    tipoDoc: cliente.tipoDoc,
    nroDoc: cliente.nroDoc,
    nombre: cliente.nombre,
    domicilio: cliente.domicilio,
    telefono: cliente.telefono,
    email: cliente.email,
    cuentaCorriente: cliente.cuentaCorriente,
    limiteCredito: cliente.limiteCredito,
    saldo,
    disponible,
    activo: cliente.activo,
  };
}

/**
 * RF-C1 / RF-C6 — Listado con saldo; filtros por búsqueda, deuda y orden por saldo o nombre.
 */
export async function listClientes(
  _user: SessionUser,
  query: {
    q?: string;
    conDeuda?: boolean;
    orden?: string;
    page: number;
    pageSize: number;
    activo?: string;
  },
) {
  const conditions = [];
  if (query.activo !== "todos") {
    conditions.push(eq(clientes.activo, true));
  }
  if (query.q) {
    const terminoBusqueda = query.q.trim();
    const documentoNormalizado = `%${normalizarDocumento(terminoBusqueda)}%`;
    const patronNombre = `%${terminoBusqueda}%`;
    conditions.push(
      or(
        like(clientes.nombre, patronNombre),
        like(clientes.nroDocNorm, documentoNormalizado),
        like(clientes.nroDoc, patronNombre),
      )!,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const all = await db.select().from(clientes).where(where);
  const withSaldo = await Promise.all(
    all.map(async (cliente) => {
      const saldo = await saldoCliente(cliente.id);
      return { cliente, saldo };
    }),
  );

  let filtered = withSaldo;
  if (query.conDeuda) {
    filtered = withSaldo.filter((entrada) => entrada.saldo > 0);
  }

  if (query.orden === "saldo" || query.conDeuda) {
    filtered.sort((a, b) => b.saldo - a.saldo);
  } else {
    filtered.sort((a, b) =>
      a.cliente.nombre.localeCompare(b.cliente.nombre, "es"),
    );
  }

  const total = filtered.length;
  const start = (query.page - 1) * query.pageSize;
  const pageRows = filtered.slice(start, start + query.pageSize);

  return {
    data: pageRows.map((row) => mapCliente(row.cliente, row.saldo)),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalAdeudado: query.conDeuda
      ? filtered.reduce((suma, entrada) => suma + entrada.saldo, 0)
      : undefined,
  };
}

/**
 * RF-C3 — Ficha del cliente con saldo actual y últimas facturas emitidas.
 */
export async function getCliente(_user: SessionUser, id: number) {
  const cliente = await db.query.clientes.findFirst({
    where: eq(clientes.id, id),
  });
  if (!cliente) {
    throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado.");
  }

  const saldo = await saldoCliente(id);
  const ultimas = await db
    .select()
    .from(facturas)
    .where(eq(facturas.clienteId, id))
    .orderBy(desc(facturas.fecha), desc(facturas.id))
    .limit(6);

  return {
    ...mapCliente(cliente, saldo),
    ultimasFacturas: ultimas.map((factura) => ({
      id: factura.id,
      numeroFormateado: formatNumeroFactura(factura.puntoVenta, factura.numero),
      fecha: sqliteToIso(factura.fecha),
      total: factura.total,
      formaPago: factura.formaPago,
      estado: factura.estado,
    })),
  };
}

/**
 * RF-C2 / RF-V2 — Alta de cliente con documento único normalizado.
 */
export async function createCliente(_user: SessionUser, raw: unknown) {
  const data = createClienteSchema.parse(raw);
  const nroDocNorm = normalizarDocumento(data.nroDoc);

  const duplicado = await db.query.clientes.findFirst({
    where: and(
      eq(clientes.tipoDoc, data.tipoDoc),
      eq(clientes.nroDocNorm, nroDocNorm),
    ),
  });
  if (duplicado) {
    throw new ApiError(
      409,
      "DOCUMENTO_DUPLICADO",
      "Ya existe un cliente con ese documento.",
    );
  }

  const [created] = await db
    .insert(clientes)
    .values({
      tipoDoc: data.tipoDoc,
      nroDoc: data.nroDoc,
      nroDocNorm,
      nombre: data.nombre,
      domicilio: data.domicilio || null,
      telefono: data.telefono || null,
      email: data.email || null,
      cuentaCorriente: data.cuentaCorriente ?? false,
      limiteCredito: data.limiteCredito ?? null,
    })
    .returning();

  return mapCliente(created, 0);
}

/**
 * RF-C2 / RF-C7 — Edición y baja lógica; no desactiva ni deshabilita CC con saldo pendiente.
 */
export async function updateCliente(
  _user: SessionUser,
  id: number,
  raw: unknown,
) {
  const data = updateClienteSchema.parse(raw);
  const cliente = await db.query.clientes.findFirst({
    where: eq(clientes.id, id),
  });
  if (!cliente) {
    throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado.");
  }

  const saldo = await saldoCliente(id);

  if (
    (data.activo === false || data.cuentaCorriente === false) &&
    saldo !== 0
  ) {
    throw new ApiError(
      422,
      "SALDO_PENDIENTE",
      "El cliente tiene saldo pendiente.",
    );
  }

  let nroDocNorm = cliente.nroDocNorm;
  let nroDoc = data.nroDoc ?? cliente.nroDoc;
  let tipoDoc = data.tipoDoc ?? cliente.tipoDoc;

  if (data.nroDoc || data.tipoDoc) {
    nroDocNorm = normalizarDocumento(nroDoc);
    const duplicado = await db.query.clientes.findFirst({
      where: and(
        eq(clientes.tipoDoc, tipoDoc),
        eq(clientes.nroDocNorm, nroDocNorm),
        sql`${clientes.id} != ${id}`,
      ),
    });
    if (duplicado) {
      throw new ApiError(
        409,
        "DOCUMENTO_DUPLICADO",
        "Ya existe un cliente con ese documento.",
      );
    }
  }

  const [updated] = await db
    .update(clientes)
    .set({
      ...data,
      email: data.email === "" ? null : data.email,
      nroDoc,
      tipoDoc,
      nroDocNorm,
    })
    .where(eq(clientes.id, id))
    .returning();

  return mapCliente(updated, saldo);
}

/**
 * RF-C4 — Cuenta corriente cronológica con saldo acumulado en cada movimiento (regla 7).
 */
export async function getCuentaCorriente(
  _user: SessionUser,
  id: number,
  query: { desde?: string; hasta?: string },
) {
  const cliente = await db.query.clientes.findFirst({
    where: eq(clientes.id, id),
  });
  if (!cliente) {
    throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado.");
  }

  let saldoAnterior = 0;
  if (query.desde) {
    saldoAnterior = await saldoCliente(id, query.desde);
  }

  const conditions = [eq(movimientosCuenta.clienteId, id)];
  if (query.desde) {
    conditions.push(sql`${movimientosCuenta.fecha} >= ${query.desde}`);
  }
  if (query.hasta) {
    conditions.push(
      sql`${movimientosCuenta.fecha} < date(${query.hasta}, '+1 day')`,
    );
  }

  const movimientosDb = await db
    .select()
    .from(movimientosCuenta)
    .where(and(...conditions))
    .orderBy(movimientosCuenta.fecha, movimientosCuenta.id);

  let saldoAcumulado = saldoAnterior;
  const movimientos = movimientosDb.map((movimiento) => {
    saldoAcumulado +=
      movimiento.tipo === "debito" ? movimiento.importe : -movimiento.importe;
    return {
      fecha: sqliteToIso(movimiento.fecha),
      tipo: movimiento.tipo,
      importe: movimiento.importe,
      descripcion: movimiento.descripcion,
      facturaId: movimiento.facturaId,
      pagoId: movimiento.pagoId,
      saldo: saldoAcumulado,
    };
  });

  return {
    cliente: { id: cliente.id, nombre: cliente.nombre },
    saldoAnterior,
    movimientos,
    saldo: saldoAcumulado,
  };
}

// silence
void count;
void like;