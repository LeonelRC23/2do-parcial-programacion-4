import { apiHandler, json, parsePagination, readJson } from "@/lib/api/handler";
import {
  listMovimientosProducto,
} from "@/lib/services/productos";
import { registrarMovimientoManual } from "@/lib/services/stock";
import { idParamSchema } from "@/lib/schemas/common";

export const GET = apiHandler(async ({ user, params, request }) => {
  const id = idParamSchema.parse(params.id);
  const url = new URL(request.url);
  const { page, pageSize } = parsePagination(url);
  return json(await listMovimientosProducto(user!, id, { page, pageSize }));
});

export const POST = apiHandler(
  async ({ user, params, request }) => {
    const id = idParamSchema.parse(params.id);
    return json(
      await registrarMovimientoManual(user!, id, await readJson(request)),
      201,
    );
  },
  { admin: true },
);
