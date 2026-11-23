"use client";

import { useEffect, useState } from "react";
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
import {
  useFiltrosEnVivo,
  useValorRetrasado,
} from "@/hooks/use-filtros-en-vivo";

type Categoria = { id: number; nombre: string };

const CLAVES = ["q", "categoriaId", "bajoMinimo", "activo"] as const;

export function ProductosFilters({
  categorias,
  esAdmin = false,
}: {
  categorias: Categoria[];
  esAdmin?: boolean;
}) {
  const { searchParams, pendiente, aplicar } = useFiltrosEnVivo(
    undefined,
    CLAVES,
  );
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [categoriaId, setCategoriaId] = useState(
    searchParams.get("categoriaId") ?? "todas",
  );
  const [bajoMinimo, setBajoMinimo] = useState(
    searchParams.get("bajoMinimo") === "true",
  );
  const [activo, setActivo] = useState(searchParams.get("activo") ?? "true");
  const qRetrasado = useValorRetrasado(q);

  useEffect(() => {
    const params = new URLSearchParams();
    const termino = qRetrasado.trim();
    if (termino) params.set("q", termino);
    if (categoriaId && categoriaId !== "todas") {
      params.set("categoriaId", categoriaId);
    }
    if (bajoMinimo) params.set("bajoMinimo", "true");
    if (esAdmin && activo !== "true") params.set("activo", activo);
    aplicar(params);
  }, [qRetrasado, categoriaId, bajoMinimo, activo, esAdmin, aplicar]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Cluster className="items-end">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Buscar
            </label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Código o descripción"
              autoComplete="off"
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
          <span
            aria-live="polite"
            className="pb-2 text-xs text-slate-500 tabular-nums"
          >
            {pendiente ? "Actualizando…" : ""}
          </span>
        </Cluster>
      </CardContent>
    </Card>
  );
}
