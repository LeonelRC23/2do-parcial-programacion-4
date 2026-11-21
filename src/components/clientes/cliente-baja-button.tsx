"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { actualizarClienteAction } from "@/actions/clientes";

export function ClienteBajaButton({
  clienteId,
  activo,
}: {
  clienteId: number;
  activo: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    const result = await actualizarClienteAction(clienteId, {
      activo: !activo,
    });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(activo ? "Cliente desactivado" : "Cliente reactivado");
    router.refresh();
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant={activo ? "destructive" : "outline"} size="sm">
          {activo ? "Dar de baja" : "Reactivar"}
        </Button>
      }
      title={activo ? "Dar de baja el cliente" : "Reactivar cliente"}
      description={
        activo
          ? "El cliente se desactiva y conserva su historial. No se permite si tiene saldo pendiente."
          : "El cliente volverá a estar disponible."
      }
      confirmLabel={activo ? "Desactivar" : "Reactivar"}
      destructive={activo}
      onConfirm={toggle}
    />
  );
}
