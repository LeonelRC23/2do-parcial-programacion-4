import { apiHandler, json } from "@/lib/api/handler";
import { getFactura } from "@/lib/services/facturas";
import { idParamSchema } from "@/lib/schemas/common";

export const GET = apiHandler(async ({ user, params }) => {
  const id = idParamSchema.parse(params.id);
  return json(await getFactura(user!, id));
});
