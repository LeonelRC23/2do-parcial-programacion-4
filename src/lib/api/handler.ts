import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

type HandlerContext = {
  user: SessionUser | null;
  params: Record<string, string>;
  request: NextRequest;
};

type RouteHandler = (context: HandlerContext) => Promise<Response | NextResponse>;

type ApiHandlerOptions = {
  auth?: boolean;
  admin?: boolean;
};

/** Envuelve Route Handlers: sesión, permisos y errores estándar. */
export function apiHandler(
  handler: RouteHandler,
  options: ApiHandlerOptions = {},
) {
  const { auth: requiresAuth = true, admin: requiresAdmin = false } = options;

  return async (
    request: NextRequest,
    routeContext?: { params?: Promise<Record<string, string>> },
  ) => {
    try {
      const routeParams = routeContext?.params
        ? await routeContext.params
        : {};
      const sessionUser = await getSessionUser();

      if (requiresAuth && !sessionUser) {
        throw new ApiError(401, "NO_AUTENTICADO", "Debés iniciar sesión.");
      }
      if (requiresAdmin && sessionUser?.rol !== "admin") {
        throw new ApiError(
          403,
          "SIN_PERMISO",
          "No tenés permiso para esta acción.",
        );
      }

      return await handler({
        user: sessionUser,
        params: routeParams,
        request,
      });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Lee el body JSON o lanza 400 si es inválido. */
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo no es JSON válido.");
  }
}

/** Respuesta JSON con status (por defecto 200). */
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Respuesta vacía 204. */
export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/** Traduce errores a la forma JSON de la API. */
export function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.status });
  }

  if (error instanceof ZodError) {
    const fieldDetails = error.issues.map((issue) => ({
      campo: issue.path.join(".") || undefined,
      mensaje: issue.message,
    }));
    return NextResponse.json(
      {
        error: {
          code: "VALIDACION",
          message: "Hay campos con errores.",
          details: fieldDetails,
        },
      },
      { status: 422 },
    );
  }

  console.error("[API]", error);
  return NextResponse.json(
    {
      error: {
        code: "ERROR_INTERNO",
        message: "Ocurrió un error inesperado.",
      },
    },
    { status: 500 },
  );
}

/** Extrae page y pageSize de la query. */
export function parsePagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const requestedPageSize =
    Number(url.searchParams.get("pageSize") ?? 20) || 20;
  const pageSize = Math.min(100, Math.max(1, requestedPageSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
