"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Stack } from "@/components/layout/stack";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchJson, ClientApiError } from "@/lib/api-client";

const MOTIVOS_INGRESO = [
  "Reposición",
  "Stock inicial",
  "Devolución de cliente",
] as const;
const MOTIVOS_EGRESO = [
  "Rotura",
  "Vencimiento",
  "Ajuste de inventario",
  "Uso interno",
] as const;

export function StockMovimientoDialog({
  productoId,
  tipo,
}: {
  productoId: number;
  tipo: "ingreso" | "egreso";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [cantidad, setCantidad] = useState("1");
  const motivos = tipo === "ingreso" ? MOTIVOS_INGRESO : MOTIVOS_EGRESO;
  const [motivo, setMotivo] = useState<string>(motivos[0]);
  const [observacion, setObservacion] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await fetchJson(`/api/productos/${productoId}/movimientos`, {
        method: "POST",
        body: JSON.stringify({
          tipo,
          cantidad: Number(cantidad),
          motivo,
          observacion: observacion.trim() || undefined,
        }),
      });
      toast.success(tipo === "ingreso" ? "Ingreso registrado." : "Egreso registrado.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ClientApiError
          ? err.message
          : "No se pudo registrar el movimiento.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={tipo === "ingreso" ? "default" : "outline"}>
          {tipo === "ingreso" ? "Ingreso de stock" : "Egreso de stock"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tipo === "ingreso" ? "Ingreso de stock" : "Egreso de stock"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)}>
          <Stack gap="md">
            <Field label="Cantidad" htmlFor="cant" required>
              <Input
                id="cant"
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
              />
            </Field>
            <Field label="Motivo" required>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {motivos.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Observación" htmlFor="obs">
              <Input
                id="obs"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Registrar"}
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
