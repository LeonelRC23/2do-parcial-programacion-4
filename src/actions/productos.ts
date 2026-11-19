"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/wrapper";
import {
  createProducto,
  updateProducto,
} from "@/lib/services/productos";
import { registrarMovimientoManual } from "@/lib/services/stock";

/** RF-P2 — Alta de producto (admin). */
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

/** RF-P2 / RF-P3 — Edición o baja lógica de producto (admin). */
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

/** RF-P4 / RF-P5 — Ingreso o egreso manual de stock (admin). */
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
