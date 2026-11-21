"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
import { actualizarClienteAction } from "@/actions/clientes";
import { updateClienteSchema } from "@/lib/schemas/clientes";

type ClienteEdit = {
  id: number;
  tipoDoc: "DNI" | "CUIT";
  nroDoc: string;
  nombre: string;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  cuentaCorriente: boolean;
  limiteCredito: number | null;
};

export function ClienteEditDialog({ cliente }: { cliente: ClienteEdit }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tipoDoc, setTipoDoc] = useState<"DNI" | "CUIT">(cliente.tipoDoc);
  const [nroDoc, setNroDoc] = useState(cliente.nroDoc);
  const [nombre, setNombre] = useState(cliente.nombre);
  const [domicilio, setDomicilio] = useState(cliente.domicilio ?? "");
  const [telefono, setTelefono] = useState(cliente.telefono ?? "");
  const [email, setEmail] = useState(cliente.email ?? "");
  const [cuentaCorriente, setCuentaCorriente] = useState(
    cliente.cuentaCorriente,
  );
  const [limite, setLimite] = useState(
    cliente.limiteCredito != null
      ? (cliente.limiteCredito / 100).toFixed(2)
      : "",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const limiteCredito =
      cuentaCorriente && limite.trim()
        ? Math.round(
            Number(limite.replace(/\./g, "").replace(",", ".")) * 100,
          )
        : null;
    const parsed = updateClienteSchema.safeParse({
      tipoDoc,
      nroDoc: nroDoc.trim(),
      nombre: nombre.trim(),
      domicilio: domicilio.trim() || null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      cuentaCorriente,
      limiteCredito,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path.join(".") || "_"] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setPending(true);
    const result = await actualizarClienteAction(cliente.id, parsed.data);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Cliente actualizado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)}>
          <Stack gap="md">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" error={fieldErrors.tipoDoc}>
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
              <Field
                label="Documento"
                htmlFor="edit-nro"
                required
                error={fieldErrors.nroDoc}
              >
                <Input
                  id="edit-nro"
                  value={nroDoc}
                  onChange={(e) => setNroDoc(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field
              label="Nombre"
              htmlFor="edit-nombre"
              required
              error={fieldErrors.nombre}
            >
              <Input
                id="edit-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </Field>
            <Field label="Domicilio" htmlFor="edit-dom">
              <Input
                id="edit-dom"
                value={domicilio}
                onChange={(e) => setDomicilio(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono" htmlFor="edit-tel">
                <Input
                  id="edit-tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </Field>
              <Field label="Email" htmlFor="edit-mail" error={fieldErrors.email}>
                <Input
                  id="edit-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-cc"
                checked={cuentaCorriente}
                onCheckedChange={(v) => setCuentaCorriente(v === true)}
              />
              <Label htmlFor="edit-cc">Cuenta corriente habilitada</Label>
            </div>
            {cuentaCorriente ? (
              <Field
                label="Límite de crédito ($)"
                htmlFor="edit-limite"
                hint="Vacío = sin límite"
                error={fieldErrors.limiteCredito}
              >
                <Input
                  id="edit-limite"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                />
              </Field>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
