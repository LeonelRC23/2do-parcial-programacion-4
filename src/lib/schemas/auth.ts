import { z } from "zod";
import { passwordSchema } from "./common";

export const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export const changePasswordSchema = z.object({
  actual: z.string().min(1, "Ingresá la contraseña actual."),
  nueva: passwordSchema,
});

export const createUsuarioSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre obligatorio."),
  email: z.string().email("Email inválido."),
  rol: z.enum(["admin", "vendedor"]),
  password: passwordSchema,
});

export const updateUsuarioSchema = z
  .object({
    nombre: z.string().trim().min(2).optional(),
    email: z.string().email().optional(),
    rol: z.enum(["admin", "vendedor"]).optional(),
    activo: z.boolean().optional(),
  })
  .strict();
