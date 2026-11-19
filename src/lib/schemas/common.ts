import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.coerce.number().int().positive();

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres.");
