"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, KeyRound, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Stack } from "@/components/layout/stack";
import { Cluster } from "@/components/layout/cluster";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "vendedor";
  activo: boolean;
};

export function UsuariosManager({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<"admin" | "vendedor">("vendedor");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await fetchJson("/api/usuarios", {
        method: "POST",
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          rol,
          password,
        }),
      });
      toast.success("Usuario creado.");
      setCreateOpen(false);
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("vendedor");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ClientApiError ? err.message : "Error al crear.",
      );
    } finally {
      setPending(false);
    }
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setPending(true);
    try {
      await fetchJson(`/api/usuarios/${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre: editUser.nombre.trim(),
          email: editUser.email.trim(),
          rol: editUser.rol,
          activo: editUser.activo,
        }),
      });
      toast.success("Usuario actualizado.");
      setEditUser(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ClientApiError ? err.message : "Error al guardar.",
      );
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(id: number) {
    try {
      const res = await fetchJson<{ passwordTemporal: string }>(
        `/api/usuarios/${id}/reset-password`,
        { method: "POST" },
      );
      setTempPassword(res.passwordTemporal);
      toast.success("Contraseña restablecida.");
    } catch (err) {
      toast.error(
        err instanceof ClientApiError ? err.message : "Error al restablecer.",
      );
    }
  }

  return (
    <Stack gap="md">
      <Cluster className="justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => void crear(e)}>
              <Stack gap="md">
                <Field label="Nombre" htmlFor="uNombre" required>
                  <Input
                    id="uNombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Email" htmlFor="uEmail" required>
                  <Input
                    id="uEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Rol">
                  <Select
                    value={rol}
                    onValueChange={(v) => setRol(v as "admin" | "vendedor")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="Contraseña temporal"
                  htmlFor="uPass"
                  hint="Mínimo 8 caracteres"
                  required
                >
                  <Input
                    id="uPass"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando…" : "Crear"}
                </Button>
              </Stack>
            </form>
          </DialogContent>
        </Dialog>
      </Cluster>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="capitalize">{u.rol}</TableCell>
                  <TableCell>
                    <StatusBadge status={u.activo ? "activo" : "inactivo"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Cluster className="justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditUser({ ...u })}
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="secondary">
                            <KeyRound className="size-3.5" />
                            Reset
                          </Button>
                        }
                        title="Restablecer contraseña"
                        description={`Se generará una contraseña temporal para ${u.nombre}.`}
                        confirmLabel="Restablecer"
                        onConfirm={() => void resetPassword(u.id)}
                      />
                    </Cluster>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!editUser}
        onOpenChange={(o) => {
          if (!o) setEditUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editUser ? (
            <form onSubmit={(e) => void guardarEdicion(e)}>
              <Stack gap="md">
                <Field label="Nombre" htmlFor="eNombre">
                  <Input
                    id="eNombre"
                    value={editUser.nombre}
                    onChange={(e) =>
                      setEditUser({ ...editUser, nombre: e.target.value })
                    }
                  />
                </Field>
                <Field label="Email" htmlFor="eEmail">
                  <Input
                    id="eEmail"
                    type="email"
                    value={editUser.email}
                    onChange={(e) =>
                      setEditUser({ ...editUser, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Rol">
                  <Select
                    value={editUser.rol}
                    onValueChange={(v) =>
                      setEditUser({
                        ...editUser,
                        rol: v as "admin" | "vendedor",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Estado">
                  <Select
                    value={editUser.activo ? "activo" : "inactivo"}
                    onValueChange={(v) =>
                      setEditUser({ ...editUser, activo: v === "activo" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando…" : "Guardar"}
                </Button>
              </Stack>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!tempPassword}
        onOpenChange={(o) => {
          if (!o) setTempPassword(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contraseña temporal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Copiá y compartí esta contraseña ahora; no se volverá a mostrar.
          </p>
          <p className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-lg tracking-wide">
            {tempPassword}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              if (tempPassword) void navigator.clipboard.writeText(tempPassword);
              toast.success("Copiada al portapapeles.");
            }}
          >
            Copiar
          </Button>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
