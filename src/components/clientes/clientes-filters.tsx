"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cluster } from "@/components/layout/cluster";
import { Card, CardContent } from "@/components/ui/card";

export function ClientesFilters({ basePath = "/clientes" }: { basePath?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (basePath.includes("saldos")) params.set("conDeuda", "true");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={apply}>
          <Cluster className="items-end">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Buscar
              </label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre o documento"
              />
            </div>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </Cluster>
        </form>
      </CardContent>
    </Card>
  );
}
