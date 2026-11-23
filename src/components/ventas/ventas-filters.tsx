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
import { Cluster } from "@/components/layout/cluster";import { Card, CardContent } from "@/components/ui/card";
import {
  useFiltrosEnVivo,
  useValorRetrasado,
} from "@/hooks/use-filtros-en-vivo";

const TODOS = "todos";
const TODAS = "todas";
const CLAVES = [
  "q",
  "desde",
  "hasta",
  "forma",
  "estado",
  "clienteId",
  "vendedorId",
] as const;

export function VentasFilters({
  clientes,
  vendedores,
  esAdmin = false,
}: {
  clientes: { id: number; nombre: string }[];
  vendedores: { id: number; nombre: string }[];
  esAdmin?: boolean;
}) {
  const { searchParams, pendiente, aplicar } = useFiltrosEnVivo(
    "/ventas",
    CLAVES,
  );
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [desde, setDesde] = useState(searchParams.get("desde") ?? "");
  const [hasta, setHasta] = useState(searchParams.get("hasta") ?? "");
  const [forma, setForma] = useState(searchParams.get("forma") ?? TODAS);
  const [estado, setEstado] = useState(searchParams.get("estado") ?? TODOS);
  const [clienteId, setClienteId] = useState(
    searchParams.get("clienteId") ?? TODOS,
  );
  const [vendedorId, setVendedorId] = useState(
    searchParams.get("vendedorId") ?? TODOS,
  );
  const qRetrasado = useValorRetrasado(q);

  useEffect(() => {
    const params = new URLSearchParams();
    const termino = qRetrasado.trim();
    if (termino) params.set("q", termino);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (forma && forma !== TODAS) params.set("forma", forma);
    if (estado && estado !== TODOS) params.set("estado", estado);
    if (clienteId && clienteId !== TODOS) params.set("clienteId", clienteId);
    if (esAdmin && vendedorId && vendedorId !== TODOS) {
      params.set("vendedorId", vendedorId);
    }
    aplicar(params);
  }, [
    qRetrasado,
    desde,
    hasta,
    forma,
    estado,
    clienteId,
    vendedorId,
    esAdmin,
    aplicar,
  ]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Cluster className="items-end">
          <div className="min-w-[140px] flex-1">
            <label
              htmlFor="venta-buscar"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Buscar
            </label>
            <Input
              id="venta-buscar"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nº o cliente"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="venta-desde"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Desde
            </label>
            <Input
              id="venta-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="venta-hasta"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Hasta
            </label>
            <Input
              id="venta-hasta"
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
                <SelectItem value={TODOS}>Todos</SelectItem>
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
                  <SelectItem value={TODOS}>Todos</SelectItem>
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
                <SelectItem value={TODAS}>Todas</SelectItem>
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
                <SelectItem value={TODOS}>Todos</SelectItem>
                <SelectItem value="emitida">Emitida</SelectItem>
                <SelectItem value="anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-h-9 items-center gap-2">
            <span
              aria-live="polite"
              className="text-xs text-slate-500 tabular-nums"
            >
              {pendiente ? "Actualizando…" : ""}
            </span>
          </div>
        </Cluster>
      </CardContent>
    </Card>
  );
}
