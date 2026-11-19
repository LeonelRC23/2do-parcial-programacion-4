import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { parseISO } from "date-fns";

/** Zona horaria de Argentina usada para filtros y tablero. */
export const TZ_AR = "America/Argentina/Tucuman";

/** Punto de venta fijo del comercio (un solo local). */
export const PUNTO_VENTA = 1;

/**
 * Formatea un importe en centavos al estilo argentino: `$ 12.345,50` (regla 10).
 */
export function formatMoney(centavos: number): string {
  const isNegative = centavos < 0;
  const absoluteCentavos = Math.abs(centavos);
  const pesosEnteros = Math.floor(absoluteCentavos / 100);
  const centavosRestantes = absoluteCentavos % 100;
  const pesosFormateados = pesosEnteros.toLocaleString("es-AR");
  const centavosFormateados = centavosRestantes.toString().padStart(2, "0");
  return `${isNegative ? "-" : ""}$ ${pesosFormateados},${centavosFormateados}`;
}

/**
 * Formatea una fecha ISO a `dd/mm/aaaa` en hora de Argentina.
 */
export function formatDate(isoDate: string): string {
  const normalizedIso = isoDate.endsWith("Z") ? isoDate : `${isoDate}Z`;
  return formatInTimeZone(parseISO(normalizedIso), TZ_AR, "dd/MM/yyyy");
}

/**
 * Formatea fecha y hora ISO a `dd/mm/aaaa HH:mm` en hora de Argentina.
 */
export function formatDateTime(isoDateTime: string): string {
  const withTimeSeparator = isoDateTime.includes("T")
    ? isoDateTime
    : `${isoDateTime.replace(" ", "T")}Z`;
  const normalizedIso = withTimeSeparator.endsWith("Z")
    ? withTimeSeparator
    : `${withTimeSeparator}Z`;
  return formatInTimeZone(parseISO(normalizedIso), TZ_AR, "dd/MM/yyyy HH:mm");
}

/**
 * Formatea número de factura correlativo: `0001-00000001` (regla 4).
 */
export function formatNumeroFactura(
  puntoVenta: number,
  numeroFactura: number,
): string {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numeroFactura).padStart(8, "0")}`;
}

/**
 * Formatea número de recibo de pago: `R 0001-00000001` (RF-C5).
 */
export function formatNumeroRecibo(
  puntoVenta: number,
  numeroRecibo: number,
): string {
  return `R ${formatNumeroFactura(puntoVenta, numeroRecibo)}`;
}

/**
 * Une tipo y número de documento para mostrar: `DNI 28.456.123`.
 */
export function formatDocumento(tipoDoc: string, nroDoc: string): string {
  return `${tipoDoc} ${nroDoc}`;
}

/**
 * Quita puntos, guiones y espacios del documento para búsquedas (RF-C1).
 */
export function normalizarDocumento(numeroDocumento: string): string {
  return numeroDocumento.replace(/[.\-\s]/g, "");
}

/**
 * Devuelve la fecha de hoy (o la indicada) como `AAAA-MM-DD` en hora Argentina.
 */
export function fechaArgentina(date = new Date()): string {
  return formatInTimeZone(date, TZ_AR, "yyyy-MM-dd");
}

/**
 * Convierte el inicio de un día Argentina (`AAAA-MM-DD`) a ISO UTC.
 */
export function inicioDiaArUtc(fechaYyyyMmDd: string): string {
  const localMidnight = toZonedTime(`${fechaYyyyMmDd}T00:00:00`, TZ_AR);
  return localMidnight.toISOString();
}

/**
 * Convierte el fin exclusivo de un día Argentina a ISO UTC (día siguiente 00:00).
 */
export function finDiaArUtc(fechaYyyyMmDd: string): string {
  const [year, month, day] = fechaYyyyMmDd.split("-").map(Number);
  const nextDayUtc = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDayString = nextDayUtc.toISOString().slice(0, 10);
  return inicioDiaArUtc(nextDayString);
}

/** Instantánea actual en ISO 8601 UTC. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Convierte un datetime de SQLite (`YYYY-MM-DD HH:MM:SS`, UTC sin Z) a ISO 8601.
 */
export function sqliteToIso(sqliteDateTime: string): string {
  if (!sqliteDateTime) return sqliteDateTime;
  if (sqliteDateTime.endsWith("Z") || sqliteDateTime.includes("+")) {
    return sqliteDateTime;
  }
  return `${sqliteDateTime.replace(" ", "T")}Z`;
}
