"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
import { actualizarProductoAction } from "@/actions/productos";
import { updateProductoSchema } from "@/lib/schemas/productos";

type Categoria = { id: number; nombre: string };

type ProductoEdit = {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: { id: number };
  precio: number;
  stockMinimo: number;
};

/** RF-P2 — Formulario de edición de producto (Server Action + Zod). */
export function ProductoEditDialog({
  producto,
  categorias,
}: {
  producto: ProductoEdit;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [codigo, setCodigo] = useState(producto.codigo);
  const [descripcion, setDescripcion] = useState(producto.descripcion);
  const [categoriaId, setCategoriaId] = useState(String(producto.categoria.id));
  const [precio, setPrecio] = useState((producto.precio / 100).toFixed(2));
  const [stockMinimo, setStockMinimo] = useState(String(producto.stockMinimo));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const precioCentavos = Math.round(
      Number(precio.replace(/\./g, "").replace(",", ".")) * 100,
    );
    const parsed = updateProductoSchema.safeParse({
      codigo: codigo.trim(),
      descripcion: descripcion.trim(),
      categoriaId: Number(categoriaId),
      precio: precioCentavos,
      stockMinimo: Number(stockMinimo) || 0,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "_";
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setPending(true);
    const result = await actualizarProductoAction(producto.id, parsed.data);
    setPending(false);
    if (!result.ok) {
      if (result.error.details?.length) {
        const errors: Record<string, string> = {};
        for (const d of result.error.details) {
          if (d.campo && d.mensaje) errors[d.campo] = d.mensaje;
        }
        setFieldErrors(errors);
      }
      toast.error(result.error.message);
      return;
    }
    toast.success("Producto actualizado");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)}>
          <Stack gap="md">
            <Field
              label="Código"
              htmlFor="edit-codigo"
              required
              error={fieldErrors.codigo}
            >
              <Input
                id="edit-codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </Field>
            <Field
              label="Descripción"
              htmlFor="edit-desc"
              required
              error={fieldErrors.descripcion}
            >
              <Input
                id="edit-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </Field>
            <Field label="Categoría" required error={fieldErrors.categoriaId}>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue />
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
              htmlFor="edit-precio"
              required
              error={fieldErrors.precio}
            >
              <Input
                id="edit-precio"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
              />
            </Field>
            <Field
              label="Stock mínimo"
              htmlFor="edit-min"
              error={fieldErrors.stockMinimo}
            >
              <Input
                id="edit-min"
                type="number"
                min={0}
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
