import { apiHandler, json, parsePagination, readJson } from "@/lib/api/handler";
import { createProducto, listProductos } from "@/lib/services/productos";

export const GET = apiHandler(async ({ user, request }) => {
  const url = new URL(request.url);
  const { page, pageSize } = parsePagination(url);
  return json(
    await listProductos(user!, {
      q: url.searchParams.get("q") ?? undefined,
      categoriaId: url.searchParams.get("categoriaId")
        ? Number(url.searchParams.get("categoriaId"))
        : undefined,
      bajoMinimo: url.searchParams.get("bajoMinimo") === "true",
      activo: url.searchParams.get("activo") ?? undefined,
      page,
      pageSize,
    }),
  );
});

export const POST = apiHandler(
  async ({ user, request }) =>
    json(await createProducto(user!, await readJson(request)), 201),
  { admin: true },
);
