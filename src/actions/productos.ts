"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/wrapper";
import {
  createProducto,
  updateProducto,
} from "@/lib/services/productos";
import { registrarMovimientoManual } from "@/lib/services/stock";

export async function crearProductoAction(raw: unknown) {
  const result = await runAction((user) => createProducto(user, raw), {
    admin: true,
  });
  if (result.ok) {
    revalidatePath("/productos");
    revalidatePath(`/productos/${result.data.id}`);
  }
  return result;
}

export async function actualizarProductoAction(
  productoId: number,
  raw: unknown,
) {
  const result = await runAction(
    (user) => updateProducto(user, productoId, raw),
    { admin: true },
  );
  if (result.ok) {
    revalidatePath("/productos");
    revalidatePath(`/productos/${productoId}`);
  }
  return result;
}

export async function movimientoStockAction(
  productoId: number,
  raw: unknown,
) {
  const result = await runAction(
    (user) => registrarMovimientoManual(user, productoId, raw),
    { admin: true },
  );
  if (result.ok) {
    revalidatePath(`/productos/${productoId}`);
    revalidatePath("/productos");
  }
  return result;
}
