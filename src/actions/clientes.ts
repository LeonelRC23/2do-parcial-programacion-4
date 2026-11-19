"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/wrapper";
import {
  createCliente,
  updateCliente,
} from "@/lib/services/clientes";
import { registrarPago } from "@/lib/services/pagos";

/** RF-C2 / RF-V2 — Alta de cliente. */
export async function crearClienteAction(raw: unknown) {
  const result = await runAction((user) => createCliente(user, raw));
  if (result.ok) {
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${result.data.id}`);
  }
  return result;
}

/** RF-C2 / RF-C7 — Edición o baja lógica de cliente. */
export async function actualizarClienteAction(
  clienteId: number,
  raw: unknown,
) {
  const result = await runAction((user) =>
    updateCliente(user, clienteId, raw),
  );
  if (result.ok) {
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/clientes/saldos");
  }
  return result;
}

/** RF-C5 — Registrar pago en cuenta corriente. */
export async function registrarPagoAction(
  clienteId: number,
  raw: unknown,
) {
  const result = await runAction((user) =>
    registrarPago(user, clienteId, raw),
  );
  if (result.ok) {
    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/clientes");
    revalidatePath("/clientes/saldos");
    revalidatePath(`/pagos/${result.data.id}`);
  }
  return result;
}
