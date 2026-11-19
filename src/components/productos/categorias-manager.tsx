"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Stack } from "@/components/layout/stack";
import { Cluster } from "@/components/layout/cluster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJson, ClientApiError } from "@/lib/api-client";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type Categoria = { id: number; nombre: string; activa: boolean };

export function CategoriasManager({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [pending, setPending] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await fetchJson("/api/categorias", {
        method: "POST",
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      toast.success("Categoría creada.");
      setNombre("");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ClientApiError ? err.message : "Error al crear.",
      );
    } finally {
      setPending(false);
    }
  }

  async function guardarEdicion() {
    if (editId == null) return;
    try {
      await fetchJson(`/api/categorias/${editId}`, {
        method: "PATCH",
        body: JSON.stringify({ nombre: editNombre.trim() }),
      });
      toast.success("Categoría actualizada.");
      setEditId(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ClientApiError ? err.message : "Error al guardar.",
      );
    }
  }

  async function desactivar(id: number) {
    try {
      await fetchJson(`/api/categorias/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ activa: false }),
      });
      toast.success("Categoría desactivada.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ClientApiError ? err.message : "Error al desactivar.",
      );
    }
  }

  return (
    <Stack gap="md">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => void crear(e)}>
            <Cluster className="items-end">
              <div className="min-w-[200px] flex-1">
                <Field label="Nueva categoría" htmlFor="catNombre">
                  <Input
                    id="catNombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    minLength={2}
                  />
                </Field>
              </div>
              <Button type="submit" disabled={pending}>
                <Plus className="size-4" />
                Agregar
              </Button>
            </Cluster>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-right">
                    <Cluster className="justify-end">
                      <Dialog
                        open={editId === c.id}
                        onOpenChange={(o) => {
                          if (o) {
                            setEditId(c.id);
                            setEditNombre(c.nombre);
                          } else {
                            setEditId(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar categoría</DialogTitle>
                          </DialogHeader>
                          <Stack gap="md">
                            <Field label="Nombre" htmlFor="editNom">
                              <Input
                                id="editNom"
                                value={editNombre}
                                onChange={(e) => setEditNombre(e.target.value)}
                              />
                            </Field>
                            <Button onClick={() => void guardarEdicion()}>
                              Guardar
                            </Button>
                          </Stack>
                        </DialogContent>
                      </Dialog>
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="destructive">
                            Desactivar
                          </Button>
                        }
                        title="Desactivar categoría"
                        description={`¿Desactivar «${c.nombre}»? No debe tener productos activos.`}
                        confirmLabel="Desactivar"
                        destructive
                        onConfirm={() => void desactivar(c.id)}
                      />
                    </Cluster>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
