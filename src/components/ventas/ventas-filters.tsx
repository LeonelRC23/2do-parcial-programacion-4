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

export function VentasFilters({
  clientes,
  vendedores,
  esAdmin = false,
}: {
  clientes: { id: number; nombre: string }[];
  vendedores: { id: number; nombre: string }[];
  esAdmin?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [desde, setDesde] = useState(sp.get("desde") ?? "");
  const [hasta, setHasta] = useState(sp.get("hasta") ?? "");
  const [forma, setForma] = useState(sp.get("forma") ?? "todas");
  const [estado, setEstado] = useState(sp.get("estado") ?? "todos");
  const [clienteId, setClienteId] = useState(sp.get("clienteId") ?? "todos");
  const [vendedorId, setVendedorId] = useState(
    sp.get("vendedorId") ?? "todos",
  );

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (forma && forma !== "todas") params.set("forma", forma);
    if (estado && estado !== "todos") params.set("estado", estado);
    if (clienteId && clienteId !== "todos") params.set("clienteId", clienteId);
    if (esAdmin && vendedorId && vendedorId !== "todos") {
      params.set("vendedorId", vendedorId);
    }
    router.push(`/ventas?${params.toString()}`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={apply}>
          <Cluster className="items-end">
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Buscar
              </label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nº o cliente"
              />
            </div>
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
            <div className="w-44">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Cliente
              </label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {esAdmin ? (
              <div className="w-40">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Vendedor
                </label>
                <Select value={vendedorId} onValueChange={setVendedorId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="w-36">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Forma
              </label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="cuenta_corriente">Cta. cte.</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Estado
              </label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="anulada">Anulada</SelectItem>
                </SelectContent>
              </Select>
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
