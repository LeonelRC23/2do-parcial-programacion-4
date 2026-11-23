import { like, sql, type SQLWrapper } from "drizzle-orm";

const PARES_ACENTOS: Array<[string, string]> = [
  ["á", "a"],
  ["Á", "A"],
  ["é", "e"],
  ["É", "E"],
  ["í", "i"],
  ["Í", "I"],
  ["ó", "o"],
  ["Ó", "O"],
  ["ú", "u"],
  ["Ú", "U"],
  ["ü", "u"],
  ["Ü", "U"],
  ["ñ", "n"],
  ["Ñ", "N"],
];

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function patronBusqueda(texto: string): string {
  return `%${normalizarTexto(texto)}%`;
}

export function textoNormalizado(columna: SQLWrapper) {
  let expresion = sql`${columna}`;
  for (const [conAcento, sinAcento] of PARES_ACENTOS) {
    expresion = sql`replace(${expresion}, ${conAcento}, ${sinAcento})`;
  }
  return sql`lower(${expresion})`;
}

export function buscarTexto(columna: SQLWrapper, termino: string) {
  return like(textoNormalizado(columna), patronBusqueda(termino));
}
