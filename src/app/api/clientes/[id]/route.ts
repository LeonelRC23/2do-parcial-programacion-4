import { apiHandler, json, readJson } from "@/lib/api/handler";
import { getCliente, updateCliente } from "@/lib/services/clientes";
import { idParamSchema } from "@/lib/schemas/common";

export const GET = apiHandler(async ({ user, params }) => {
  const id = idParamSchema.parse(params.id);
  return json(await getCliente(user!, id));
});

export const PATCH = apiHandler(async ({ user, params, request }) => {
  const id = idParamSchema.parse(params.id);
  return json(await updateCliente(user!, id, await readJson(request)));
});
