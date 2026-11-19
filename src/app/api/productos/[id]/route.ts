import { apiHandler, json, readJson } from "@/lib/api/handler";
import { getProducto, updateProducto } from "@/lib/services/productos";
import { idParamSchema } from "@/lib/schemas/common";

export const GET = apiHandler(async ({ user, params }) => {
  const id = idParamSchema.parse(params.id);
  return json(await getProducto(user!, id));
});

export const PATCH = apiHandler(
  async ({ user, params, request }) => {
    const id = idParamSchema.parse(params.id);
    return json(await updateProducto(user!, id, await readJson(request)));
  },
  { admin: true },
);
