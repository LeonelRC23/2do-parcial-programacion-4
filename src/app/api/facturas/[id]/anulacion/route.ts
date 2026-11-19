import { apiHandler, json, readJson } from "@/lib/api/handler";
import { anularFactura } from "@/lib/services/facturas";
import { idParamSchema } from "@/lib/schemas/common";

export const POST = apiHandler(
  async ({ user, params, request }) => {
    const id = idParamSchema.parse(params.id);
    return json(await anularFactura(user!, id, await readJson(request)));
  },
  { admin: true },
);
