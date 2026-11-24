import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "gc_session";

/** Barrera previa: exige cookie de sesión salvo login. */
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
