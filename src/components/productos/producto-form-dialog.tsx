"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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

type Categoria = { id: number; nombre: string };

function pesosToCentavos(value: string): number {
  const n = Number(value.replace(/\./g, "").replace(",", "."));
  return Math.round(n * 100);
}

export function ProductoFormDialog({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState(
    categorias[0] ? String(categorias[0].id) : "",
  );
  const [precio, setPrecio] = useState("");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [stockInicial, setStockInicial] = useState("0");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const precioCentavos = pesosToCentavos(precio);
    if (!precioCentavos || precioCentavos <= 0) {
      toast.error("Ingresá un precio válido.");
      return;
    }
    setPending(true);
    try {
      const created = await fetchJson<{ id: number }>("/api/productos", {
        method: "POST",
        body: JSON.stringify({
          codigo: codigo.trim(),
          descripcion: descripcion.trim(),
          categoriaId: Number(categoriaId),
          precio: precioCentavos,
          stockMinimo: Number(stockMinimo) || 0,
          stockInicial: Number(stockInicial) || 0,
        }),
      });
      toast.success("Producto creado.");
      setOpen(false);
      router.push(`/productos/${created.id}`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ClientApiError
          ? err.message
          : "No se pudo crear el producto.",
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
          Nuevo producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)}>
          <Stack gap="md">
            <Field label="Código" htmlFor="codigo" required>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </Field>
            <Field label="Descripción" htmlFor="descripcion" required>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </Field>
            <Field label="Categoría" required>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegí categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Precio ($)"
              htmlFor="precio"
              hint="Ej: 1500,50"
              required
            >
              <Input
                id="precio"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock mín." htmlFor="stockMin">
                <Input
                  id="stockMin"
                  type="number"
                  min={0}
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                />
              </Field>
              <Field label="Stock inicial" htmlFor="stockIni">
                <Input
                  id="stockIni"
                  type="number"
                  min={0}
                  value={stockInicial}
                  onChange={(e) => setStockInicial(e.target.value)}
                />
              </Field>
            </div>
            <Button type="submit" disabled={pending || !categoriaId}>
              {pending ? "Guardando…" : "Crear producto"}
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
