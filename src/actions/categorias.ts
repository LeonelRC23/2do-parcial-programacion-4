"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/wrapper";
import {
  createCategoria,
  updateCategoria,
} from "@/lib/services/categorias";

export async function crearCategoriaAction(raw: unknown) {
  const result = await runAction((user) => createCategoria(user, raw), {
    admin: true,
  });
  if (result.ok) revalidatePath("/productos/categorias");
  return result;
}

export async function actualizarCategoriaAction(
  categoriaId: number,
  raw: unknown,
) {
  const result = await runAction(
    (user) => updateCategoria(user, categoriaId, raw),
    { admin: true },
  );
  if (result.ok) revalidatePath("/productos/categorias");
  return result;
}
