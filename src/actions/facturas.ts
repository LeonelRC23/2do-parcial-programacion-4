"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/wrapper";
import { anularFactura, crearFactura } from "@/lib/services/facturas";

/** RF-V1 a RF-V6 — Emite una factura (también disponible vía POST /api/facturas). */
export async function crearFacturaAction(raw: unknown) {
  const result = await runAction((user) => crearFactura(user, raw));
  if (result.ok) {
    revalidatePath("/ventas");
    revalidatePath(`/ventas/${result.data.id as number}`);
    revalidatePath("/");
    revalidatePath("/productos");
  }
  return result;
}

/** RF-V9 — Anula una factura (admin). */
export async function anularFacturaAction(facturaId: number, raw: unknown) {
  const result = await runAction(
    (user) => anularFactura(user, facturaId, raw),
    { admin: true },
  );
  if (result.ok) {
    revalidatePath("/ventas");
    revalidatePath(`/ventas/${facturaId}`);
    revalidatePath("/");
    revalidatePath("/productos");
  }
  return result;
}
