import { apiHandler, json } from "@/lib/api/handler";
import { proximoNumero } from "@/lib/services/facturas";

export const GET = apiHandler(async ({ user }) =>
  json(await proximoNumero(user!)),
);
