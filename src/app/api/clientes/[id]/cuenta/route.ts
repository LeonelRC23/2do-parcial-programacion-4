import { apiHandler, json } from "@/lib/api/handler";
import { getCuentaCorriente } from "@/lib/services/clientes";
import { idParamSchema } from "@/lib/schemas/common";

export const GET = apiHandler(async ({ user, params, request }) => {
  const id = idParamSchema.parse(params.id);
  const url = new URL(request.url);
  return json(
    await getCuentaCorriente(user!, id, {
      desde: url.searchParams.get("desde") ?? undefined,
      hasta: url.searchParams.get("hasta") ?? undefined,
    }),
  );
});
