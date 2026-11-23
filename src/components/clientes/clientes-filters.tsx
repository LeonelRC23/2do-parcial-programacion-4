"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Cluster } from "@/components/layout/cluster";
import { Card, CardContent } from "@/components/ui/card";
import {
  useFiltrosEnVivo,
  useValorRetrasado,
} from "@/hooks/use-filtros-en-vivo";

const CLAVES = ["q", "conDeuda"] as const;

export function ClientesFilters({ basePath = "/clientes" }: { basePath?: string }) {
  const { searchParams, pendiente, aplicar } = useFiltrosEnVivo(basePath, CLAVES);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const qRetrasado = useValorRetrasado(q);
  const conDeuda = basePath.includes("saldos");

  useEffect(() => {
    const params = new URLSearchParams();
    const termino = qRetrasado.trim();
    if (termino) params.set("q", termino);
    if (conDeuda) params.set("conDeuda", "true");
    aplicar(params);
  }, [qRetrasado, conDeuda, aplicar]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Cluster className="items-end">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Buscar
            </label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre o documento"
              autoComplete="off"
            />
          </div>
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
