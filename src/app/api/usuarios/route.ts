import { apiHandler, json, parsePagination, readJson } from "@/lib/api/handler";
import { createUsuario, listUsuarios } from "@/lib/services/usuarios";

export const GET = apiHandler(
  async ({ user, request }) => {
    const url = new URL(request.url);
    const { page, pageSize } = parsePagination(url);
    return json(
      await listUsuarios(user!, {
        q: url.searchParams.get("q") ?? undefined,
        activo: url.searchParams.get("activo") ?? undefined,
        page,
        pageSize,
      }),
    );
  },
  { admin: true },
);

export const POST = apiHandler(
  async ({ user, request }) =>
    json(await createUsuario(user!, await readJson(request)), 201),
  { admin: true },
);
