# Gestión comercial · Ferretería El Tornillo

Sistema de gestión comercial para un comercio minorista: facturación, stock, cuenta corriente de clientes y tablero de indicadores.

Parcial de **Programación IV** (Desarrollo Web).

## Integrantes

- _(completar)_

## URL pública

- App (Vercel): _(completar tras el deploy)_
- Base de datos (Turso): _(completar)_

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + SQLite (dev) / Turso libSQL (prod)
- Chart.js (`react-chartjs-2`)
- Sesión propia en cookie `httpOnly` firmada (jose + bcrypt)

## Puesta en marcha local

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Usuarios de prueba

| Rol        | Email                   | Contraseña     |
| ---------- | ----------------------- | -------------- |
| Admin      | `laura@ferreteria.test` | `admin1234`    |
| Vendedor   | `pablo@ferreteria.test` | `vendedor1234` |

## Variables de entorno

Ver `.env.example`:

| Variable              | Descripción                                      |
| --------------------- | ------------------------------------------------ |
| `DATABASE_URL`        | `file:./local.db` o URL `libsql://…` de Turso    |
| `DATABASE_AUTH_TOKEN` | Token de Turso (solo producción)                 |
| `AUTH_SECRET`         | Secreto para firmar la cookie (≥ 16 caracteres)  |
| `COMERCIO_*`          | Datos del comercio en comprobantes               |

## Scripts

| Comando              | Uso                          |
| -------------------- | ---------------------------- |
| `pnpm run dev`       | Servidor de desarrollo       |
| `pnpm run build`     | Build de producción          |
| `pnpm run db:migrate`| Aplicar migraciones Drizzle  |
| `pnpm run db:seed`   | Datos de prueba              |
| `pnpm run db:generate` | Generar migraciones        |

## Arquitectura

Capas según el enunciado (sección 10):

- `src/lib/db` — esquema y conexión (sin reglas de negocio)
- `src/lib/services` — validación, permisos, transacciones
- `src/app/api` — Route Handlers (adaptadores HTTP)
- `src/app/(app)` — interfaz (Server Components + Client Components)

La existencia de un producto **solo** cambia en `moverStock()`.

## Módulos

| Ruta                 | Descripción                |
| -------------------- | -------------------------- |
| `/`                  | Tablero                    |
| `/ventas/nueva`      | Nueva venta                |
| `/ventas`            | Listado de facturas        |
| `/productos`         | Catálogo                   |
| `/clientes`          | Clientes y cuenta corriente|
| `/usuarios`          | Usuarios (admin)           |
| `/login`             | Acceso                     |
