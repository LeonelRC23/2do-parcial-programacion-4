import { apiHandler, json, parsePagination, readJson } from "@/lib/api/handler";
import { crearFactura, listFacturas } from "@/lib/services/facturas";

export const GET = apiHandler(async ({ user, request }) => {
  const url = new URL(request.url);
  const { page, pageSize } = parsePagination(url);
  const result = await listFacturas(user!, {
    q: url.searchParams.get("q") ?? undefined,
    desde: url.searchParams.get("desde") ?? undefined,
    hasta: url.searchParams.get("hasta") ?? undefined,
    clienteId: url.searchParams.get("clienteId")
      ? Number(url.searchParams.get("clienteId"))
      : undefined,
    vendedorId: url.searchParams.get("vendedorId")
      ? Number(url.searchParams.get("vendedorId"))
      : undefined,
    forma: url.searchParams.get("forma") ?? undefined,
    estado: url.searchParams.get("estado") ?? undefined,
    page,
    pageSize,
  });
  return json(result);
});

export const POST = apiHandler(async ({ user, request }) => {
  const factura = await crearFactura(user!, await readJson(request));
  return json(factura, 201);
});
