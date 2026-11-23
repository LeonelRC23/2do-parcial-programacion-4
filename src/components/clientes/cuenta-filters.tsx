"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Cluster } from "@/components/layout/cluster";
import { useFiltrosEnVivo } from "@/hooks/use-filtros-en-vivo";

const CLAVES = ["desde", "hasta"] as const;

export function CuentaFilters({ clienteId }: { clienteId: number }) {
  const { searchParams, pendiente, aplicar } = useFiltrosEnVivo(
    `/clientes/${clienteId}`,
    CLAVES,
  );
  const [desde, setDesde] = useState(searchParams.get("desde") ?? "");
  const [hasta, setHasta] = useState(searchParams.get("hasta") ?? "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    aplicar(params);
  }, [desde, hasta, aplicar]);

  return (
    <div className="mb-4">
      <Cluster className="items-end">
        <div>
          <label
            htmlFor="cuenta-desde"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Desde
          </label>
          <Input
            id="cuenta-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="cuenta-hasta"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Hasta
          </label>
          <Input
            id="cuenta-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        {(desde || hasta) && (
          <button
            type="button"
            className="pb-2 text-xs font-medium text-amber-800 hover:underline"
            onClick={() => {
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar
          </button>
        )}
        <span
          aria-live="polite"
          className="pb-2 text-xs text-slate-500 tabular-nums"
        >
          {pendiente ? "Actualizando…" : ""}
        </span>
      </Cluster>
    </div>
  );
}
