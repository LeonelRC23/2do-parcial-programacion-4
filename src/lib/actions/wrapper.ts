"use server";

import { ZodError } from "zod";
import { ApiError } from "@/lib/api/errors";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export type ActionOk<T> = { ok: true; data: T };
export type ActionFail = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: { campo?: string; mensaje?: string }[];
  };
};
export type ActionResult<T> = ActionOk<T> | ActionFail;

/** Envuelve Server Actions con sesión, rol y errores tipados. */
export async function runAction<T>(
  fn: (user: SessionUser) => Promise<T>,
  options: { admin?: boolean } = {},
): Promise<ActionResult<T>> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return {
        ok: false,
        error: { code: "NO_AUTENTICADO", message: "Debés iniciar sesión." },
      };
    }
    if (options.admin && user.rol !== "admin") {
      return {
        ok: false,
        error: {
          code: "SIN_PERMISO",
          message: "No tenés permiso para esta acción.",
        },
      };
    }
    const data = await fn(user);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details?.map((d) => ({
            campo: typeof d.campo === "string" ? d.campo : undefined,
            mensaje: typeof d.mensaje === "string" ? d.mensaje : undefined,
          })),
        },
      };
    }
    if (err instanceof ZodError) {
      return {
        ok: false,
        error: {
          code: "VALIDACION",
          message: "Hay campos con errores.",
          details: err.issues.map((i) => ({
            campo: i.path.join(".") || undefined,
            mensaje: i.message,
          })),
        },
      };
    }
    console.error("[ServerAction]", err);
    return {
      ok: false,
      error: {
        code: "ERROR_INTERNO",
        message: "Ocurrió un error inesperado.",
      },
    };
  }
}
