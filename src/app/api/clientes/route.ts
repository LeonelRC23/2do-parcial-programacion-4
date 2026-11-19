import { apiHandler, json, parsePagination, readJson } from "@/lib/api/handler";
import { createCliente, listClientes } from "@/lib/services/clientes";

export const GET = apiHandler(async ({ user, request }) => {
  const url = new URL(request.url);
  const { page, pageSize } = parsePagination(url);
  return json(
    await listClientes(user!, {
      q: url.searchParams.get("q") ?? undefined,
      conDeuda: url.searchParams.get("conDeuda") === "true",
      orden: url.searchParams.get("orden") ?? undefined,
      activo: url.searchParams.get("activo") ?? undefined,
      page,
      pageSize,
    }),
  );
});

export const POST = apiHandler(async ({ user, request }) =>
  json(await createCliente(user!, await readJson(request)), 201),
);
