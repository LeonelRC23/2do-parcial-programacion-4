import { z } from "zod";

const tarjetaSchema = z
  .object({
    tipo: z.enum(["debito", "credito"]),
    marca: z.string().trim().min(1, "Marca obligatoria."),
    ultimos4: z
      .string()
      .regex(/^\d{4}$/, "Deben ser exactamente 4 dígitos."),
  })
  .strict();

const pagoContado = z
  .object({
    forma: z.literal("contado"),
    montoRecibido: z.number().int().positive().optional(),
  })
  .strict();

const pagoTarjeta = z
  .object({
    forma: z.literal("tarjeta"),
    tarjeta: tarjetaSchema,
  })
  .strict();

const pagoCuenta = z
  .object({
    forma: z.literal("cuenta_corriente"),
  })
  .strict();

export const crearFacturaSchema = z
  .object({
    clienteId: z.number().int().positive().nullable(),
    items: z
      .array(
        z.object({
          productoId: z.number().int().positive(),
          cantidad: z.number().int().positive(),
        }),
      )
      .min(1, "Agregá al menos un producto."),
    pago: z.discriminatedUnion("forma", [pagoContado, pagoTarjeta, pagoCuenta]),
  })
  .superRefine((data, ctx) => {
    const ids = data.items.map((i) => i.productoId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "No se permiten productos repetidos.",
      });
    }
  });

export const anularFacturaSchema = z.object({
  motivo: z.string().trim().min(3, "El motivo es obligatorio."),
});
