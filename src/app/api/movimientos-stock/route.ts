import { apiHandler, json, parsePagination } from "@/lib/api/handler";
import { listMovimientosStock } from "@/lib/services/productos";

export const GET = apiHandler(async ({ user, request }) => {
  const url = new URL(request.url);
  const { page, pageSize } = parsePagination(url);
  const productoId = url.searchParams.get("productoId");
  return json(
    await listMovimientosStock(user!, {
      productoId: productoId ? Number(productoId) : undefined,
      tipo: url.searchParams.get("tipo") ?? undefined,
      desde: url.searchParams.get("desde") ?? undefined,
      hasta: url.searchParams.get("hasta") ?? undefined,
      page,
      pageSize,
    }),
  );
});
