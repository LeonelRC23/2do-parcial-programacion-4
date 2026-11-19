import { z } from "zod";

export const createCategoriaSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre obligatorio."),
});

export const updateCategoriaSchema = z
  .object({
    nombre: z.string().trim().min(2).optional(),
    activa: z.boolean().optional(),
  })
  .strict();

export const createProductoSchema = z
  .object({
    codigo: z.string().trim().min(1, "Código obligatorio."),
    descripcion: z.string().trim().min(2, "Descripción obligatoria."),
    categoriaId: z.number().int().positive("Categoría obligatoria."),
    precio: z.number().int().positive("El precio debe ser mayor a 0 (centavos)."),
    stockMinimo: z.number().int().min(0).default(0),
    stockInicial: z.number().int().min(0).optional(),
  })
  .strict();

export const updateProductoSchema = z
  .object({
    codigo: z.string().trim().min(1).optional(),
    descripcion: z.string().trim().min(2).optional(),
    categoriaId: z.number().int().positive().optional(),
    precio: z.number().int().positive().optional(),
    stockMinimo: z.number().int().min(0).optional(),
    activo: z.boolean().optional(),
  })
  .strict()
  .refine((v) => !("existencia" in v), {
    message: "La existencia no se edita a mano.",
    path: ["existencia"],
  });

const motivosIngreso = ["Reposición", "Stock inicial", "Devolución de cliente"] as const;
const motivosEgreso = [
  "Rotura",
  "Vencimiento",
  "Ajuste de inventario",
  "Uso interno",
] as const;

export const movimientoStockSchema = z
  .object({
    tipo: z.enum(["ingreso", "egreso"]),
    cantidad: z.number().int().positive("Cantidad mayor a cero."),
    motivo: z.string().min(1, "Motivo obligatorio."),
    observacion: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const allowed =
      data.tipo === "ingreso" ? motivosIngreso : motivosEgreso;
    if (!(allowed as readonly string[]).includes(data.motivo)) {
      ctx.addIssue({
        code: "custom",
        path: ["motivo"],
        message: `Motivo inválido para ${data.tipo}.`,
      });
    }
  });

export { motivosIngreso, motivosEgreso };
