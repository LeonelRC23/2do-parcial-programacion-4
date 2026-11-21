"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cluster } from "@/components/layout/cluster";

export function CuentaFilters({ clienteId }: { clienteId: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [desde, setDesde] = useState(sp.get("desde") ?? "");
  const [hasta, setHasta] = useState(sp.get("hasta") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    const qs = params.toString();
    router.push(`/clientes/${clienteId}${qs ? `?${qs}` : ""}`);
  }

  return (
    <form onSubmit={apply} className="mb-4">
      <Cluster className="items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Desde
          </label>
          <Input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Hasta
          </label>
          <Input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Filtrar
        </Button>
      </Cluster>
    </form>
  );
}
