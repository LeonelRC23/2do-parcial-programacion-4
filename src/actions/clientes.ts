"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/wrapper";
import {
  createCliente,
  updateCliente,
} from "@/lib/services/clientes";
import { registrarPago } from "@/lib/services/pagos";

/** Server Action: alta de cliente. */
export async function crearClienteAction(raw: unknown) {
  const result = await runAction((user) => createCliente(user, raw));
  if (result.ok) {
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${result.data.id}`);
  }
  return result;
}

/** Server Action: edición o baja de cliente. */
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

/** Server Action: pago en cuenta corriente. */
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
