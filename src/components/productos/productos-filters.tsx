"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cluster } from "@/components/layout/cluster";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Categoria = { id: number; nombre: string };

export function ProductosFilters({
  categorias,
  esAdmin = false,
}: {
  categorias: Categoria[];
  esAdmin?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [categoriaId, setCategoriaId] = useState(
    sp.get("categoriaId") ?? "todas",
  );
  const [bajoMinimo, setBajoMinimo] = useState(
    sp.get("bajoMinimo") === "true",
  );
  const [activo, setActivo] = useState(sp.get("activo") ?? "true");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoriaId && categoriaId !== "todas") {
      params.set("categoriaId", categoriaId);
    }
    if (bajoMinimo) params.set("bajoMinimo", "true");
    if (esAdmin && activo !== "true") params.set("activo", activo);
    router.push(`/productos?${params.toString()}`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={apply}>
          <Cluster className="items-end">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Buscar
              </label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Código o descripción"
              />
            </div>
            <div className="w-48">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Categoría
              </label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="bajoMinimo"
                checked={bajoMinimo}
                onCheckedChange={(v) => setBajoMinimo(v === true)}
              />
              <Label htmlFor="bajoMinimo">Bajo mínimo</Label>
            </div>
            {esAdmin ? (
              <div className="w-36">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Estado
                </label>
                <Select value={activo} onValueChange={setActivo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activos</SelectItem>
                    <SelectItem value="false">Inactivos</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </Cluster>
        </form>
      </CardContent>
    </Card>
  );
}
