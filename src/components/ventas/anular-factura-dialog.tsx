"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { anularFacturaAction } from "@/actions/facturas";
import { anularFacturaSchema } from "@/lib/schemas/facturas";

/** RF-V9 — Anulación con motivo obligatorio (Server Action). */
export function AnularFacturaDialog({ facturaId }: { facturaId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setPending(true);
    setError(null);
    const parsed = anularFacturaSchema.safeParse({ motivo });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Motivo inválido");
      setPending(false);
      return;
    }
    const result = await anularFacturaAction(facturaId, parsed.data);
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast.success("Factura anulada");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 items-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100">
        Anular
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular factura</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500">
          Se reingresa el stock y, si corresponde, se acredita la cuenta corriente.
        </p>
        <div className="space-y-1">
          <Label htmlFor="motivo">Motivo</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          variant="destructive"
          disabled={pending || motivo.trim().length < 3}
          onClick={() => void confirmar()}
        >
          {pending ? "Anulando…" : "Confirmar anulación"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
