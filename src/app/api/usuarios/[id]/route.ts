import { apiHandler, json, readJson } from "@/lib/api/handler";
import { updateUsuario } from "@/lib/services/usuarios";
import { idParamSchema } from "@/lib/schemas/common";

export const PATCH = apiHandler(
  async ({ user, params, request }) => {
    const id = idParamSchema.parse(params.id);
    return json(await updateUsuario(user!, id, await readJson(request)));
  },
  { admin: true },
);
