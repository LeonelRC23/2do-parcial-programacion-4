"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { actualizarProductoAction } from "@/actions/productos";

/** RF-P3 — Baja lógica del producto (admin, con confirmación). */
export function ProductoBajaButton({
  productoId,
  activo,
}: {
  productoId: number;
  activo: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    const result = await actualizarProductoAction(productoId, {
      activo: !activo,
    });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(activo ? "Producto desactivado" : "Producto reactivado");
    router.refresh();
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant={activo ? "destructive" : "outline"} size="sm">
          {activo ? "Dar de baja" : "Reactivar"}
        </Button>
      }
      title={activo ? "Dar de baja el producto" : "Reactivar producto"}
      description={
        activo
          ? "El producto dejará de ofrecerse en ventas, pero conserva su historial."
          : "El producto volverá a estar disponible en ventas."
      }
      confirmLabel={activo ? "Desactivar" : "Reactivar"}
      destructive={activo}
      onConfirm={toggle}
    />
  );
}
