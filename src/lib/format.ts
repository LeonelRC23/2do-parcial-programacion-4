import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { parseISO } from "date-fns";

export const TZ_AR = "America/Argentina/Tucuman";

export const PUNTO_VENTA = 1;

/** Formatea centavos como importe argentino ($ 1.234,56). */
export function formatMoney(centavos: number): string {
  const isNegative = centavos < 0;
  const absoluteCentavos = Math.abs(centavos);
  const pesosEnteros = Math.floor(absoluteCentavos / 100);
  const centavosRestantes = absoluteCentavos % 100;
  const pesosFormateados = pesosEnteros.toLocaleString("es-AR");
  const centavosFormateados = centavosRestantes.toString().padStart(2, "0");
  return `${isNegative ? "-" : ""}$ ${pesosFormateados},${centavosFormateados}`;
}

/** Fecha en dd/MM/yyyy (hora Argentina). */
export function formatDate(isoDate: string): string {
  const normalizedIso = isoDate.endsWith("Z") ? isoDate : `${isoDate}Z`;
  return formatInTimeZone(parseISO(normalizedIso), TZ_AR, "dd/MM/yyyy");
}

/** Fecha y hora en dd/MM/yyyy HH:mm (hora Argentina). */
export function formatDateTime(isoDateTime: string): string {
  const withTimeSeparator = isoDateTime.includes("T")
    ? isoDateTime
    : `${isoDateTime.replace(" ", "T")}Z`;
  const normalizedIso = withTimeSeparator.endsWith("Z")
    ? withTimeSeparator
    : `${withTimeSeparator}Z`;
  return formatInTimeZone(parseISO(normalizedIso), TZ_AR, "dd/MM/yyyy HH:mm");
}

/** Número de factura correlativo (0001-00000001). */
export function formatNumeroFactura(
  puntoVenta: number,
  numeroFactura: number,
): string {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numeroFactura).padStart(8, "0")}`;
}

/** Número de recibo de pago (R 0001-...). */
export function formatNumeroRecibo(
  puntoVenta: number,
  numeroRecibo: number,
): string {
  return `R ${formatNumeroFactura(puntoVenta, numeroRecibo)}`;
}

/** Documento para mostrar (ej. DNI 12345678). */
export function formatDocumento(tipoDoc: string, nroDoc: string): string {
  return `${tipoDoc} ${nroDoc}`;
}

/** Quita puntos, guiones y espacios del documento. */
export function normalizarDocumento(numeroDocumento: string): string {
  return numeroDocumento.replace(/[.\-\s]/g, "");
}

/** Hoy (o la fecha dada) como AAAA-MM-DD en Argentina. */
export function fechaArgentina(date = new Date()): string {
  return formatInTimeZone(date, TZ_AR, "yyyy-MM-dd");
}

/** Inicio del día Argentina en ISO UTC. */
export function inicioDiaArUtc(fechaYyyyMmDd: string): string {
  const localMidnight = toZonedTime(`${fechaYyyyMmDd}T00:00:00`, TZ_AR);
  return localMidnight.toISOString();
}

/** Fin exclusivo del día Argentina en ISO UTC. */
export function finDiaArUtc(fechaYyyyMmDd: string): string {
  const [year, month, day] = fechaYyyyMmDd.split("-").map(Number);
  const nextDayUtc = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDayString = nextDayUtc.toISOString().slice(0, 10);
  return inicioDiaArUtc(nextDayString);
}

/** Instantánea actual en ISO UTC. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Normaliza un datetime de SQLite a ISO 8601. */
export function sqliteToIso(sqliteDateTime: string): string {
  if (!sqliteDateTime) return sqliteDateTime;
  if (sqliteDateTime.endsWith("Z") || sqliteDateTime.includes("+")) {
    return sqliteDateTime;
  }
  return `${sqliteDateTime.replace(" ", "T")}Z`;
}
