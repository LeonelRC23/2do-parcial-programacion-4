import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { parseISO } from "date-fns";

export const TZ_AR = "America/Argentina/Tucuman";

export const PUNTO_VENTA = 1;

export function formatMoney(centavos: number): string {
  const isNegative = centavos < 0;
  const absoluteCentavos = Math.abs(centavos);
  const pesosEnteros = Math.floor(absoluteCentavos / 100);
  const centavosRestantes = absoluteCentavos % 100;
  const pesosFormateados = pesosEnteros.toLocaleString("es-AR");
  const centavosFormateados = centavosRestantes.toString().padStart(2, "0");
  return `${isNegative ? "-" : ""}$ ${pesosFormateados},${centavosFormateados}`;
}

export function formatDate(isoDate: string): string {
  const normalizedIso = isoDate.endsWith("Z") ? isoDate : `${isoDate}Z`;
  return formatInTimeZone(parseISO(normalizedIso), TZ_AR, "dd/MM/yyyy");
}

export function formatDateTime(isoDateTime: string): string {
  const withTimeSeparator = isoDateTime.includes("T")
    ? isoDateTime
    : `${isoDateTime.replace(" ", "T")}Z`;
  const normalizedIso = withTimeSeparator.endsWith("Z")
    ? withTimeSeparator
    : `${withTimeSeparator}Z`;
  return formatInTimeZone(parseISO(normalizedIso), TZ_AR, "dd/MM/yyyy HH:mm");
}

export function formatNumeroFactura(
  puntoVenta: number,
  numeroFactura: number,
): string {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numeroFactura).padStart(8, "0")}`;
}

export function formatNumeroRecibo(
  puntoVenta: number,
  numeroRecibo: number,
): string {
  return `R ${formatNumeroFactura(puntoVenta, numeroRecibo)}`;
}

export function formatDocumento(tipoDoc: string, nroDoc: string): string {
  return `${tipoDoc} ${nroDoc}`;
}

export function normalizarDocumento(numeroDocumento: string): string {
  return numeroDocumento.replace(/[.\-\s]/g, "");
}

export function fechaArgentina(date = new Date()): string {
  return formatInTimeZone(date, TZ_AR, "yyyy-MM-dd");
}

export function inicioDiaArUtc(fechaYyyyMmDd: string): string {
  const localMidnight = toZonedTime(`${fechaYyyyMmDd}T00:00:00`, TZ_AR);
  return localMidnight.toISOString();
}

export function finDiaArUtc(fechaYyyyMmDd: string): string {
  const [year, month, day] = fechaYyyyMmDd.split("-").map(Number);
  const nextDayUtc = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDayString = nextDayUtc.toISOString().slice(0, 10);
  return inicioDiaArUtc(nextDayString);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function sqliteToIso(sqliteDateTime: string): string {
  if (!sqliteDateTime) return sqliteDateTime;
  if (sqliteDateTime.endsWith("Z") || sqliteDateTime.includes("+")) {
    return sqliteDateTime;
  }
  return `${sqliteDateTime.replace(" ", "T")}Z`;
}
