import { apiHandler, json, readJson } from "@/lib/api/handler";
import { createCategoria, listCategorias } from "@/lib/services/categorias";

export const GET = apiHandler(async ({ user }) =>
  json(await listCategorias(user!)),
);

export const POST = apiHandler(
  async ({ user, request }) =>
    json(await createCategoria(user!, await readJson(request)), 201),
  { admin: true },
);
