"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

function pesosToCentavos(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export type ClienteCreado = {
  id: number;
  nombre: string;
  tipoDoc: string;
  nroDoc: string;
  cuentaCorriente: boolean;
  saldo: number;
  limiteCredito: number | null;
};

export function ClienteFormDialog({
  onCreated,
  triggerLabel = "Nuevo cliente",
  redirectOnCreate = true,
}: {
  onCreated?: (cliente: ClienteCreado) => void;
  triggerLabel?: string;
  redirectOnCreate?: boolean;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [tipoDoc, setTipoDoc] = useState<"DNI" | "CUIT">("DNI");
  const [nroDoc, setNroDoc] = useState("");
  const [nombre, setNombre] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [cuentaCorriente, setCuentaCorriente] = useState(false);
  const [limite, setLimite] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const created = await fetchJson<ClienteCreado>("/api/clientes", {
        method: "POST",
        body: JSON.stringify({
          tipoDoc,
          nroDoc: nroDoc.trim(),
          nombre: nombre.trim(),
          domicilio: domicilio.trim() || null,
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          cuentaCorriente,
          limiteCredito: cuentaCorriente ? pesosToCentavos(limite) : null,
        }),
      });
      toast.success("Cliente creado.");
      setOpen(false);
      onCreated?.(created);
      if (redirectOnCreate && !onCreated) {
        router.push(`/clientes/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ClientApiError
          ? err.message
          : "No se pudo crear el cliente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)}>
          <Stack gap="md">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <Select
                  value={tipoDoc}
                  onValueChange={(v) => setTipoDoc(v as "DNI" | "CUIT")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="CUIT">CUIT</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Documento" htmlFor="nro" required>
                <Input
                  id="nro"
                  value={nroDoc}
                  onChange={(e) => setNroDoc(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field label="Nombre" htmlFor="nombre" required>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </Field>
            <Field label="Domicilio" htmlFor="dom">
              <Input
                id="dom"
                value={domicilio}
                onChange={(e) => setDomicilio(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono" htmlFor="tel">
                <Input
                  id="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </Field>
              <Field label="Email" htmlFor="mail">
                <Input
                  id="mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="cc"
                checked={cuentaCorriente}
                onCheckedChange={(v) => setCuentaCorriente(v === true)}
              />
              <Label htmlFor="cc">Habilitar cuenta corriente</Label>
            </div>
            {cuentaCorriente ? (
              <Field
                label="Límite de crédito ($)"
                htmlFor="limite"
                hint="Vacío = sin límite"
              >
                <Input
                  id="limite"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                />
              </Field>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Crear cliente"}
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
