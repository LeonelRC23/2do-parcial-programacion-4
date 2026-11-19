import { apiHandler, json, readJson } from "@/lib/api/handler";
import { updateCategoria } from "@/lib/services/categorias";
import { idParamSchema } from "@/lib/schemas/common";

export const PATCH = apiHandler(
  async ({ user, params, request }) => {
    const id = idParamSchema.parse(params.id);
    return json(await updateCategoria(user!, id, await readJson(request)));
  },
  { admin: true },
);
