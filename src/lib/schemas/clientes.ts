import { z } from "zod";

export const createClienteSchema = z.object({
  tipoDoc: z.enum(["DNI", "CUIT"]),
  nroDoc: z.string().trim().min(5, "Número de documento obligatorio."),
  nombre: z.string().trim().min(2, "Nombre obligatorio."),
  domicilio: z.string().trim().optional().nullable(),
  telefono: z.string().trim().optional().nullable(),
  email: z
    .string()
    .email("Email inválido.")
    .optional()
    .nullable()
    .or(z.literal("")),
  cuentaCorriente: z.boolean().default(false),
  limiteCredito: z.number().int().positive().nullable().optional(),
});

export const updateClienteSchema = z
  .object({
    tipoDoc: z.enum(["DNI", "CUIT"]).optional(),
    nroDoc: z.string().trim().min(5).optional(),
    nombre: z.string().trim().min(2).optional(),
    domicilio: z.string().trim().nullable().optional(),
    telefono: z.string().trim().nullable().optional(),
    email: z
      .string()
      .email()
      .nullable()
      .optional()
      .or(z.literal("")),
    cuentaCorriente: z.boolean().optional(),
    limiteCredito: z.number().int().positive().nullable().optional(),
    activo: z.boolean().optional(),
  })
  .strict();

export const crearPagoSchema = z.object({
  importe: z.number().int().positive("El importe debe ser mayor a 0."),
  medio: z.enum(["efectivo", "transferencia", "tarjeta_debito"]),
  observacion: z.string().trim().optional().nullable(),
});
