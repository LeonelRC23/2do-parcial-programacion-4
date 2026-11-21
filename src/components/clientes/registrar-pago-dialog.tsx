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
import { formatMoney } from "@/lib/format";
import { registrarPagoAction } from "@/actions/clientes";
import { crearPagoSchema } from "@/lib/schemas/clientes";

function pesosToCentavos(value: string): number {
  return Math.round(Number(value.replace(/\./g, "").replace(",", ".")) * 100);
}

export function RegistrarPagoDialog({
  clienteId,
  saldo,
}: {
  clienteId: number;
  saldo: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [importe, setImporte] = useState("");
  const [medio, setMedio] = useState<
    "efectivo" | "transferencia" | "tarjeta_debito"
  >("efectivo");
  const [observacion, setObservacion] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    const centavos = pesosToCentavos(importe);
    const parsed = crearPagoSchema.safeParse({
      importe: centavos,
      medio,
      observacion: observacion.trim() || null,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setPending(true);
    const result = await registrarPagoAction(clienteId, parsed.data);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error.message);
      setFieldError(result.error.message);
      return;
    }
    toast.success(`Pago registrado · ${result.data.numeroRecibo}`);
    setOpen(false);
    setImporte("");
    setObservacion("");
    router.push(`/pagos/${result.data.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={saldo <= 0}>Registrar pago</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Deuda actual: {formatMoney(saldo)}
        </p>
        <form onSubmit={(e) => void submit(e)}>
          <Stack gap="md">
            <Field
              label="Importe ($)"
              htmlFor="importe"
              required
              error={fieldError ?? undefined}
            >
              <Input
                id="importe"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                placeholder={(saldo / 100).toFixed(2)}
                required
              />
            </Field>
            <Field label="Medio">
              <Select
                value={medio}
                onValueChange={(v) =>
                  setMedio(
                    v as "efectivo" | "transferencia" | "tarjeta_debito",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta_debito">Tarjeta débito</SelectItem>
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
              {pending ? "Guardando…" : "Confirmar pago"}
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
