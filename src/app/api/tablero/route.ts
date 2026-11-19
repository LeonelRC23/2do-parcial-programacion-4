import { apiHandler, json } from "@/lib/api/handler";
import { getTablero } from "@/lib/services/tablero";

export const GET = apiHandler(async ({ user }) =>
  json(await getTablero(user!)),
);
