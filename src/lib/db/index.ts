import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Crea la instancia de Drizzle sobre libSQL/Turso usando `DATABASE_URL`
 * y el token opcional `DATABASE_AUTH_TOKEN`.
 */
function createDb() {
  const url = process.env.DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  const client = createClient({
    url,
    authToken: authToken || undefined,
  });

  return drizzle(client, { schema });
}

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createDb> | undefined;
}

/** Conexión compartida a la base; en desarrollo se reutiliza en `globalThis` entre recargas. */
export const db = globalThis.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}

/** Tipo de la conexión Drizzle exportada. */
export type Db = typeof db;

/** Tipo del cliente transaccional pasado a callbacks de `db.transaction`. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];