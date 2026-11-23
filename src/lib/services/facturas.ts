import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { db, type Tx } from "@/lib/db";
import { buscarTexto } from "@/lib/db/search";
import {
  clientes,
  contadores,
  facturaItems,
  facturas,
  movimientosCuenta,
  productos,
  usuarios,
} from "@/lib/db/schema";
import { ApiError } from "@/lib/api/errors";
import {
  anularFacturaSchema,
  crearFacturaSchema,
} from "@/lib/schemas/facturas";
import type { SessionUser } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/session";
import {
  formatNumeroFactura,
  PUNTO_VENTA,
  sqliteToIso,
} from "@/lib/format";
import { moverStock } from "./stock";
import { saldoCliente } from "./clientes";

async function nextFacturaNumero(tx: Tx): Promise<number> {
  const clave = "factura";
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

async function buildFacturaResponse(facturaId: number) {
  const factura = await db.query.facturas.findFirst({
    where: eq(facturas.id, facturaId),
  });
  if (!factura) throw new ApiError(404, "NO_ENCONTRADO", "Factura no encontrada.");

  const items = await db
    .select()
    .from(facturaItems)
    .where(eq(facturaItems.facturaId, facturaId));

  const vendedor = await db.query.usuarios.findFirst({
    where: eq(usuarios.id, factura.usuarioId),
  });

  let cliente = null;
  if (factura.clienteId) {
    const clienteDb = await db.query.clientes.findFirst({
      where: eq(clientes.id, factura.clienteId),
    });
    if (clienteDb) {
      cliente = {
        id: clienteDb.id,
        nombre: clienteDb.nombre,
        tipoDoc: clienteDb.tipoDoc,
        nroDoc: clienteDb.nroDoc,
        domicilio: clienteDb.domicilio,
      };
    }
  }

  const pago: Record<string, unknown> = { forma: factura.formaPago };
  if (factura.formaPago === "contado") {
    pago.montoRecibido = factura.montoRecibido ?? factura.total;
    pago.vuelto = (factura.montoRecibido ?? factura.total) - factura.total;
  }
  if (factura.formaPago === "tarjeta") {
    pago.tarjeta = {
      tipo: factura.tarjetaTipo,
      marca: factura.tarjetaMarca,
      ultimos4: factura.tarjetaUltimos4,
    };
  }

  const result: Record<string, unknown> = {
    id: factura.id,
    puntoVenta: factura.puntoVenta,
    numero: factura.numero,
    numeroFormateado: formatNumeroFactura(factura.puntoVenta, factura.numero),
    fecha: sqliteToIso(factura.fecha),
    estado: factura.estado,
    cliente,
    vendedor: { id: vendedor!.id, nombre: vendedor!.nombre },
    items: items.map((item) => ({
      productoId: item.productoId,
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal,
    })),
    total: factura.total,
    pago,
  };

  if (factura.estado === "anulada") {
    const anulador = factura.anuladaPorId
      ? await db.query.usuarios.findFirst({
          where: eq(usuarios.id, factura.anuladaPorId),
        })
      : null;
    result.anulacion = {
      fecha: factura.anuladaEn ? sqliteToIso(factura.anuladaEn) : null,
      motivo: factura.motivoAnulacion,
      usuario: anulador
        ? { id: anulador.id, nombre: anulador.nombre }
        : null,
    };
  }

  if (factura.formaPago === "cuenta_corriente" && factura.clienteId) {
    result.saldoCliente = await saldoCliente(factura.clienteId);
  }

  return result;
}

export async function crearFactura(user: SessionUser, raw: unknown) {
  if (raw && typeof raw === "object") {
    const pago = (raw as { pago?: { tarjeta?: Record<string, unknown> } }).pago;
    if (pago?.tarjeta) {
      const clavesTarjeta = Object.keys(pago.tarjeta);
      if (clavesTarjeta.some((clave) => /numero|number|pan/i.test(clave))) {
        throw new ApiError(422, "VALIDACION", "No se admite el número completo de tarjeta.", [
          { campo: "pago.tarjeta", mensaje: "Solo tipo, marca y últimos 4 dígitos." },
        ]);
      }
    }
  }

  const data = crearFacturaSchema.parse(raw);

  return db.transaction(async (tx) => {
    let cliente = null;
    if (data.clienteId) {
      cliente = await tx.query.clientes.findFirst({
        where: eq(clientes.id, data.clienteId),
      });
      if (!cliente || !cliente.activo) {
        throw new ApiError(422, "VALIDACION", "Cliente inválido o inactivo.");
      }
    }

    if (data.pago.forma === "cuenta_corriente") {
      if (!cliente || !cliente.cuentaCorriente) {
        throw new ApiError(
          422,
          "CUENTA_CORRIENTE_NO_HABILITADA",
          "Para vender a cuenta se necesita un cliente habilitado.",
        );
      }
    }

    const lineas: {
      producto: typeof productos.$inferSelect;
      cantidad: number;
      subtotal: number;
    }[] = [];

    let total = 0;
    const stockErrors: {
      productoId: number;
      solicitado: number;
      disponible: number;
    }[] = [];

    for (const item of data.items) {
      const producto = await tx.query.productos.findFirst({
        where: eq(productos.id, item.productoId),
      });
      if (!producto) {
        throw new ApiError(404, "NO_ENCONTRADO", `Producto ${item.productoId} no encontrado.`);
      }
      if (!producto.activo) {
        throw new ApiError(
          422,
          "PRODUCTO_INACTIVO",
          `El producto ${producto.codigo} está inactivo.`,
        );
      }
      if (producto.existencia < item.cantidad) {
        stockErrors.push({
          productoId: producto.id,
          solicitado: item.cantidad,
          disponible: producto.existencia,
        });
      }
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      lineas.push({ producto, cantidad: item.cantidad, subtotal });
    }

    if (stockErrors.length) {
      throw new ApiError(409, "STOCK_INSUFICIENTE", "Stock insuficiente.", stockErrors);
    }

    let montoRecibido: number | null = null;
    if (data.pago.forma === "contado") {
      montoRecibido = data.pago.montoRecibido ?? total;
      if (montoRecibido < total) {
        throw new ApiError(
          422,
          "MONTO_INSUFICIENTE",
          "El monto recibido no cubre el total.",
        );
      }
    }

    if (data.pago.forma === "cuenta_corriente" && cliente) {
      const saldoActual = await saldoCliente(cliente.id);
      const nuevoSaldo = saldoActual + total;
      if (cliente.limiteCredito != null && nuevoSaldo > cliente.limiteCredito) {
        throw new ApiError(
          422,
          "LIMITE_CREDITO_EXCEDIDO",
          "La venta supera el límite de crédito.",
          [
            {
              saldoActual,
              limite: cliente.limiteCredito,
              excedente: nuevoSaldo - cliente.limiteCredito,
            },
          ],
        );
      }
    }

    const numero = await nextFacturaNumero(tx);

    const tarjeta =
      data.pago.forma === "tarjeta" ? data.pago.tarjeta : null;

    const [factura] = await tx
      .insert(facturas)
      .values({
        puntoVenta: PUNTO_VENTA,
        numero,
        clienteId: data.clienteId,
        usuarioId: user.id,
        total,
        formaPago: data.pago.forma,
        tarjetaTipo: tarjeta?.tipo ?? null,
        tarjetaMarca: tarjeta?.marca ?? null,
        tarjetaUltimos4: tarjeta?.ultimos4 ?? null,
        montoRecibido,
        estado: "emitida",
      })
      .returning();

    for (const linea of lineas) {
      await tx.insert(facturaItems).values({
        facturaId: factura.id,
        productoId: linea.producto.id,
        codigo: linea.producto.codigo,
        descripcion: linea.producto.descripcion,
        cantidad: linea.cantidad,
        precioUnitario: linea.producto.precio,
        subtotal: linea.subtotal,
      });

      await moverStock(tx, {
        productoId: linea.producto.id,
        cantidad: -linea.cantidad,
        tipo: "venta",
        facturaId: factura.id,
        usuarioId: user.id,
      });
    }

    if (data.pago.forma === "cuenta_corriente" && cliente) {
      await tx.insert(movimientosCuenta).values({
        clienteId: cliente.id,
        tipo: "debito",
        importe: total,
        descripcion: `Factura ${formatNumeroFactura(PUNTO_VENTA, numero)}`,
        facturaId: factura.id,
      });
    }

    const items = await tx
      .select()
      .from(facturaItems)
      .where(eq(facturaItems.facturaId, factura.id));

    const pago: Record<string, unknown> = { forma: data.pago.forma };
    if (data.pago.forma === "contado") {
      pago.montoRecibido = montoRecibido;
      pago.vuelto = (montoRecibido ?? total) - total;
    }
    if (data.pago.forma === "tarjeta" && tarjeta) {
      pago.tarjeta = tarjeta;
    }

    const result: Record<string, unknown> = {
      id: factura.id,
      puntoVenta: factura.puntoVenta,
      numero: factura.numero,
      numeroFormateado: formatNumeroFactura(factura.puntoVenta, factura.numero),
      fecha: sqliteToIso(factura.fecha),
      estado: factura.estado,
      cliente: cliente
        ? {
            id: cliente.id,
            nombre: cliente.nombre,
            tipoDoc: cliente.tipoDoc,
            nroDoc: cliente.nroDoc,
            domicilio: cliente.domicilio,
          }
        : null,
      vendedor: { id: user.id, nombre: user.nombre },
      items: items.map((item) => ({
        productoId: item.productoId,
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
      })),
      total,
      pago,
    };

    if (data.pago.forma === "cuenta_corriente" && cliente) {
      const [row] = await tx
        .select({
          saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
        })
        .from(movimientosCuenta)
        .where(eq(movimientosCuenta.clienteId, cliente.id));
      result.saldoCliente = Number(row?.saldo ?? 0);
    }

    return result;
  });
}

export async function listFacturas(
  _user: SessionUser,
  query: {
    q?: string;
    desde?: string;
    hasta?: string;
    clienteId?: number;
    vendedorId?: number;
    forma?: string;
    estado?: string;
    page: number;
    pageSize: number;
  },
) {
  const conditions = [];

  if (query.desde) {
    conditions.push(sql`${facturas.fecha} >= ${query.desde}`);
  }
  if (query.hasta) {
    conditions.push(sql`${facturas.fecha} < date(${query.hasta}, '+1 day')`);
  }
  if (query.clienteId) {
    conditions.push(eq(facturas.clienteId, query.clienteId));
  }
  if (query.vendedorId) {
    conditions.push(eq(facturas.usuarioId, query.vendedorId));
  }
  if (query.forma) {
    conditions.push(
      eq(
        facturas.formaPago,
        query.forma as "contado" | "tarjeta" | "cuenta_corriente",
      ),
    );
  }
  if (query.estado) {
    conditions.push(
      eq(facturas.estado, query.estado as "emitida" | "anulada"),
    );
  }
  if (query.q) {
    const terminoBusqueda = query.q.trim();
    const numMatch = terminoBusqueda.replace(/\D/g, "");
    conditions.push(
      or(
        numMatch
          ? eq(facturas.numero, Number(numMatch) || -1)
          : sql`0`,
        sql`exists (select 1 from clientes c where c.id = ${facturas.clienteId} and ${buscarTexto(sql`c.nombre`, terminoBusqueda)})`,
      )!,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(facturas)
    .where(where);

  const [sumRow] = await db
    .select({
      totalEmitido: sql<number>`coalesce(sum(case when ${facturas.estado} = 'emitida' then ${facturas.total} else 0 end), 0)`,
    })
    .from(facturas)
    .where(where);

  const rows = await db
    .select({
      factura: facturas,
      clienteNombre: clientes.nombre,
      vendedorNombre: usuarios.nombre,
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id))
    .where(where)
    .orderBy(desc(facturas.fecha), desc(facturas.id))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return {
    data: rows.map((row) => ({
      id: row.factura.id,
      numeroFormateado: formatNumeroFactura(
        row.factura.puntoVenta,
        row.factura.numero,
      ),
      fecha: sqliteToIso(row.factura.fecha),
      cliente: row.factura.clienteId
        ? { id: row.factura.clienteId, nombre: row.clienteNombre }
        : null,
      vendedor: { id: row.factura.usuarioId, nombre: row.vendedorNombre },
      total: row.factura.total,
      formaPago: row.factura.formaPago,
      estado: row.factura.estado,
    })),
    page: query.page,
    pageSize: query.pageSize,
    total: totalRow.total,
    totalEmitido: Number(sumRow.totalEmitido ?? 0),
  };
}

export async function getFactura(_user: SessionUser, id: number) {
  return buildFacturaResponse(id);
}

export async function proximoNumero(_user: SessionUser) {
  const row = await db.query.contadores.findFirst({
    where: eq(contadores.clave, "factura"),
  });
  const next = (row?.valor ?? 0) + 1;
  return {
    numeroFormateado: formatNumeroFactura(PUNTO_VENTA, next),
  };
}

export async function anularFactura(
  user: SessionUser,
  id: number,
  raw: unknown,
) {
  requireAdmin(user);
  const data = anularFacturaSchema.parse(raw);

  return db.transaction(async (tx) => {
    const factura = await tx.query.facturas.findFirst({
      where: eq(facturas.id, id),
    });
    if (!factura) {
      throw new ApiError(404, "NO_ENCONTRADO", "Factura no encontrada.");
    }
    if (factura.estado === "anulada") {
      throw new ApiError(409, "FACTURA_ANULADA", "La factura ya está anulada.");
    }

    await tx
      .update(facturas)
      .set({
        estado: "anulada",
        motivoAnulacion: data.motivo,
        anuladaPorId: user.id,
        anuladaEn: sql`(datetime('now'))`,
      })
      .where(eq(facturas.id, id));

    const items = await tx
      .select()
      .from(facturaItems)
      .where(eq(facturaItems.facturaId, id));

    for (const item of items) {
      await moverStock(tx, {
        productoId: item.productoId,
        cantidad: item.cantidad,
        tipo: "anulacion",
        motivo: data.motivo,
        facturaId: id,
        usuarioId: user.id,
      });
    }

    if (factura.formaPago === "cuenta_corriente" && factura.clienteId) {
      await tx.insert(movimientosCuenta).values({
        clienteId: factura.clienteId,
        tipo: "credito",
        importe: factura.total,
        descripcion: `Anulación ${formatNumeroFactura(factura.puntoVenta, factura.numero)}`,
        facturaId: id,
      });
    }
  }).then(() => buildFacturaResponse(id));
}

