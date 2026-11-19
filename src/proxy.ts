import { NextResponse, type NextRequest } from "next/server";

/** Mantiene el mismo nombre que SESSION_COOKIE en session.ts (evita importar DB en el proxy). */
const SESSION_COOKIE = "gc_session";

/**
 * RF-U2 — Middleware de sesión: bloquea rutas y API sin cookie válida,
 * excepto `/login` y `POST /api/auth/login`; redirige usuarios autenticados fuera de `/login`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const esRutaPublica =
    pathname === "/login" || pathname === "/api/auth/login";

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token && !esRutaPublica) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: {
            code: "NO_AUTENTICADO",
            message: "Debés iniciar sesión.",
          },
        },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (token && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/** Rutas sobre las que corre el proxy (excluye estáticos y archivos con extensión). */
export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};