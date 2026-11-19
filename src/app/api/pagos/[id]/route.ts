import { apiHandler, json } from "@/lib/api/handler";
import { getPago } from "@/lib/services/pagos";
import { idParamSchema } from "@/lib/schemas/common";

export const GET = apiHandler(async ({ user, params }) => {
  const id = idParamSchema.parse(params.id);
  return json(await getPago(user!, id));
});
