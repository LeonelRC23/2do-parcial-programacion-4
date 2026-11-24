import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  facturaItems,
  facturas,
  movimientosCuenta,
  productos,
} from "@/lib/db/schema";
import type { SessionUser } from "@/lib/auth/session";
import { fechaArgentina } from "@/lib/format";
import { formatInTimeZone } from "date-fns-tz";
import { subDays, parseISO } from "date-fns";

/** Indicadores del tablero: ventas, deudas, stock y gráficos. */
export async function getTablero(_user: SessionUser) {
  const hoy = fechaArgentina();
  const mes = hoy.slice(0, 7);

  const [hoyStats] = await db
    .select({
      cantidad: sql<number>`count(*)`,
      importe: sql<number>`coalesce(sum(${facturas.total}), 0)`,
    })
    .from(facturas)
    .where(
      and(
        eq(facturas.estado, "emitida"),
        sql`date(${facturas.fecha}, '-3 hours') = ${hoy}`,
      ),
    );

  const [mesStats] = await db
    .select({
      cantidad: sql<number>`count(*)`,
      importe: sql<number>`coalesce(sum(${facturas.total}), 0)`,
    })
    .from(facturas)
    .where(
      and(
        eq(facturas.estado, "emitida"),
        sql`strftime('%Y-%m', datetime(${facturas.fecha}, '-3 hours')) = ${mes}`,
      ),
    );

  const cantidadMes = Number(mesStats.cantidad ?? 0);
  const importeMes = Number(mesStats.importe ?? 0);

  const [ccStats] = await db
    .select({
      totalAdeudado: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
    })
    .from(movimientosCuenta);

  const saldosPorCliente = await db
    .select({
      clienteId: movimientosCuenta.clienteId,
      saldo: sql<number>`sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end)`,
    })
    .from(movimientosCuenta)
    .groupBy(movimientosCuenta.clienteId);

  const clientesConSaldo = saldosPorCliente.filter(
    (entrada) => Number(entrada.saldo) > 0,
  ).length;
  const totalAdeudado = saldosPorCliente.reduce(
    (acumulador, entrada) => acumulador + Math.max(0, Number(entrada.saldo)),
    0,
  );

  const [bajoMinimo] = await db
    .select({ cantidad: sql<number>`count(*)` })
    .from(productos)
    .where(
      and(
        eq(productos.activo, true),
        sql`${productos.existencia} < ${productos.stockMinimo}`,
      ),
    );

  const ventasPorDia = await db
    .select({
      fecha: sql<string>`date(${facturas.fecha}, '-3 hours')`,
      importe: sql<number>`coalesce(sum(${facturas.total}), 0)`,
    })
    .from(facturas)
    .where(
      and(
        eq(facturas.estado, "emitida"),
        sql`date(${facturas.fecha}, '-3 hours') >= date(${hoy}, '-29 days')`,
      ),
    )
    .groupBy(sql`date(${facturas.fecha}, '-3 hours')`);

  const mapDia = new Map(
    ventasPorDia.map((ventaDia) => [ventaDia.fecha, Number(ventaDia.importe)]),
  );

  const ventasDiarias = [];
  for (let diasAtras = 29; diasAtras >= 0; diasAtras--) {
    const fechaFormatoTz = formatInTimeZone(
      subDays(parseISO(hoy + "T12:00:00"), diasAtras),
      "UTC",
      "yyyy-MM-dd",
    );
    const fecha = (() => {
      const base = parseISO(hoy + "T12:00:00Z");
      base.setUTCDate(base.getUTCDate() - diasAtras);
      return base.toISOString().slice(0, 10);
    })();
    void fechaFormatoTz;
    ventasDiarias.push({
      fecha,
      importe: mapDia.get(fecha) ?? 0,
    });
  }

  const porForma = await db
    .select({
      forma: facturas.formaPago,
      importe: sql<number>`coalesce(sum(${facturas.total}), 0)`,
    })
    .from(facturas)
    .where(
      and(
        eq(facturas.estado, "emitida"),
        sql`strftime('%Y-%m', datetime(${facturas.fecha}, '-3 hours')) = ${mes}`,
      ),
    )
    .groupBy(facturas.formaPago);

  const formas = ["contado", "tarjeta", "cuenta_corriente"] as const;
  const porFormaDePago = formas.map((forma) => ({
    forma,
    importe: Number(
      porForma.find((fila) => fila.forma === forma)?.importe ?? 0,
    ),
  }));

  const masVendidosRows = await db
    .select({
      productoId: facturaItems.productoId,
      codigo: facturaItems.codigo,
      descripcion: facturaItems.descripcion,
      unidades: sql<number>`sum(${facturaItems.cantidad})`,
      importe: sql<number>`sum(${facturaItems.subtotal})`,
    })
    .from(facturaItems)
    .innerJoin(facturas, eq(facturaItems.facturaId, facturas.id))
    .where(
      and(
        eq(facturas.estado, "emitida"),
        sql`strftime('%Y-%m', datetime(${facturas.fecha}, '-3 hours')) = ${mes}`,
      ),
    )
    .groupBy(
      facturaItems.productoId,
      facturaItems.codigo,
      facturaItems.descripcion,
    )
    .orderBy(sql`sum(${facturaItems.cantidad}) desc`)
    .limit(5);

  void totalAdeudado;
  void ccStats;

  return {
    hoy: {
      cantidad: Number(hoyStats.cantidad ?? 0),
      importe: Number(hoyStats.importe ?? 0),
    },
    mes: {
      cantidad: cantidadMes,
      importe: importeMes,
      ticketPromedio: cantidadMes
        ? Math.round(importeMes / cantidadMes)
        : 0,
    },
    cuentasCorrientes: {
      totalAdeudado: saldosPorCliente.reduce(
        (acumulador, entrada) => acumulador + Math.max(0, Number(entrada.saldo)),
        0,
      ),
      clientesConSaldo,
    },
    bajoMinimo: { cantidad: Number(bajoMinimo.cantidad ?? 0) },
    ventasDiarias,
    porFormaDePago,
    masVendidos: masVendidosRows.map((fila) => ({
      productoId: fila.productoId,
      codigo: fila.codigo,
      descripcion: fila.descripcion,
      unidades: Number(fila.unidades),
      importe: Number(fila.importe),
    })),
  };
}
