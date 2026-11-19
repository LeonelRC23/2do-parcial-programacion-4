import { apiHandler, json, readJson } from "@/lib/api/handler";
import { registrarPago } from "@/lib/services/pagos";
import { idParamSchema } from "@/lib/schemas/common";

export const POST = apiHandler(async ({ user, params, request }) => {
  const id = idParamSchema.parse(params.id);
  return json(await registrarPago(user!, id, await readJson(request)), 201);
});
