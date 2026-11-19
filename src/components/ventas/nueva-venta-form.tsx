"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { ApiClientError, fetchJson } from "@/lib/api-client";
import { formatMoney } from "@/lib/format";

type Producto = {
  id: number;
  codigo: string;
  descripcion: string;
  precio: number;
  existencia: number;
};

type Cliente = {
  id: number;
  nombre: string;
  tipoDoc: string;
  nroDoc: string;
  cuentaCorriente: boolean;
  saldo: number;
  limiteCredito: number | null;
};

type Item = {
  productoId: number;
  codigo: string;
  descripcion: string;
  precio: number;
  existencia: number;
  cantidad: number;
};

export function NuevaVentaForm() {
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [clienteQ, setClienteQ] = useState("");
  const [clienteResults, setClienteResults] = useState<Cliente[]>([]);
  const [prodQ, setProdQ] = useState("");
  const [prodResults, setProdResults] = useState<Producto[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [forma, setForma] = useState<"contado" | "tarjeta" | "cuenta_corriente">(
    "contado",
  );
  const [montoRecibido, setMontoRecibido] = useState("");
  const [tarjetaTipo, setTarjetaTipo] = useState<"debito" | "credito">("debito");
  const [tarjetaMarca, setTarjetaMarca] = useState("Visa");
  const [tarjetaUltimos4, setTarjetaUltimos4] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    [items],
  );

  async function searchClientes(q: string) {
    setClienteQ(q);
    if (q.trim().length < 2) {
      setClienteResults([]);
      return;
    }
    const res = await fetchJson<{ data: Cliente[] }>(
      `/api/clientes?q=${encodeURIComponent(q)}&pageSize=8`,
    );
    setClienteResults(res.data);
  }

  async function searchProductos(q: string) {
    setProdQ(q);
    if (q.trim().length < 1) {
      setProdResults([]);
      return;
    }
    const res = await fetchJson<{ data: Producto[] }>(
      `/api/productos?q=${encodeURIComponent(q)}&pageSize=8`,
    );
    setProdResults(res.data);
  }

  function addProducto(p: Producto) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productoId === p.id);
      if (existing) {
        if (existing.cantidad + 1 > p.existencia) {
          toast.error("No hay stock suficiente");
          return prev;
        }
        return prev.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      if (p.existencia < 1) {
        toast.error("Sin stock");
        return prev;
      }
      return [
        ...prev,
        {
          productoId: p.id,
          codigo: p.codigo,
          descripcion: p.descripcion,
          precio: p.precio,
          existencia: p.existencia,
          cantidad: 1,
        },
      ];
    });
    setProdQ("");
    setProdResults([]);
  }

  function setCantidad(productoId: number, cantidad: number) {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.productoId !== productoId) return i;
          if (cantidad > i.existencia) {
            toast.error(`Stock disponible: ${i.existencia}`);
            return { ...i, cantidad: i.existencia };
          }
          return { ...i, cantidad: Math.max(0, cantidad) };
        })
        .filter((i) => i.cantidad > 0),
    );
  }

  async function confirmar() {
    setPending(true);
    setError(null);
    try {
      let pago: Record<string, unknown>;
      if (forma === "contado") {
        pago = {
          forma: "contado",
          ...(montoRecibido
            ? { montoRecibido: Math.round(Number(montoRecibido) * 100) }
            : {}),
        };
      } else if (forma === "tarjeta") {
        pago = {
          forma: "tarjeta",
          tarjeta: {
            tipo: tarjetaTipo,
            marca: tarjetaMarca,
            ultimos4: tarjetaUltimos4,
          },
        };
      } else {
        pago = { forma: "cuenta_corriente" };
      }

      const factura = await fetchJson<{ id: number; numeroFormateado: string }>(
        "/api/facturas",
        {
          method: "POST",
          body: JSON.stringify({
            clienteId: cliente?.id ?? null,
            items: items.map((i) => ({
              productoId: i.productoId,
              cantidad: i.cantidad,
            })),
            pago,
          }),
        },
      );
      toast.success(`Factura ${factura.numeroFormateado} emitida`);
      router.push(`/ventas/${factura.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  const vuelto =
    forma === "contado" && montoRecibido
      ? Math.round(Number(montoRecibido) * 100) - total
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Ítems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Label htmlFor="prod">Buscar producto (código o descripción)</Label>
            <Input
              id="prod"
              value={prodQ}
              onChange={(e) => searchProductos(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (prodResults[0]) addProducto(prodResults[0]);
                }
              }}
              placeholder="Escribí y Enter para agregar"
              autoFocus
            />
            {prodResults.length > 0 ? (
              <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
                {prodResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => addProducto(p)}
                  >
                    <span>
                      <strong>{p.codigo}</strong> · {p.descripcion}
                    </span>
                    <span className="text-slate-500">
                      {formatMoney(p.precio)} · stock {p.existencia}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="w-24">Cant.</TableHead>
                <TableHead className="text-right">P. unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.productoId}>
                  <TableCell>
                    <div className="font-medium">{i.descripcion}</div>
                    <div className="text-xs text-slate-500">
                      {i.codigo} · disp. {i.existencia}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      max={i.existencia}
                      value={i.cantidad}
                      onChange={(e) =>
                        setCantidad(i.productoId, Number(e.target.value))
                      }
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(i.precio)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(i.precio * i.cantidad)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setItems((prev) =>
                          prev.filter((x) => x.productoId !== i.productoId),
                        )
                      }
                    >
                      Quitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">Agregá productos a la venta.</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comprador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={!cliente ? "default" : "outline"}
              className="w-full"
              onClick={() => {
                setCliente(null);
                setClienteQ("");
                setClienteResults([]);
                if (forma === "cuenta_corriente") setForma("contado");
              }}
            >
              Consumidor final
            </Button>
            <div className="relative">
              <Input
                value={clienteQ}
                onChange={(e) => searchClientes(e.target.value)}
                placeholder="Buscar cliente…"
              />
              {clienteResults.length > 0 ? (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
                  {clienteResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setCliente(c);
                        setClienteQ(c.nombre);
                        setClienteResults([]);
                      }}
                    >
                      {c.nombre} · {c.tipoDoc} {c.nroDoc}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <ClienteFormDialog
              triggerLabel="Alta rápida"
              redirectOnCreate={false}
              onCreated={(c) => {
                setCliente({
                  id: c.id,
                  nombre: c.nombre,
                  tipoDoc: c.tipoDoc,
                  nroDoc: c.nroDoc,
                  cuentaCorriente: c.cuentaCorriente,
                  saldo: c.saldo ?? 0,
                  limiteCredito: c.limiteCredito,
                });
                setClienteQ(c.nombre);
                if (!c.cuentaCorriente && forma === "cuenta_corriente") {
                  setForma("contado");
                }
              }}
            />
            {cliente ? (
              <p className="rounded-lg bg-slate-50 p-2 text-sm">
                <strong>{cliente.nombre}</strong>
                <br />
                {cliente.tipoDoc} {cliente.nroDoc}
                <br />
                Saldo: {formatMoney(cliente.saldo)}
                {cliente.cuentaCorriente
                  ? " · Cta. cte. habilitada"
                  : " · Sin cta. cte."}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["contado", "tarjeta", "cuenta_corriente"] as const).map((f) => {
                const ctaDisabled =
                  f === "cuenta_corriente" &&
                  (!cliente || !cliente.cuentaCorriente);
                return (
                  <Button
                    key={f}
                    type="button"
                    size="sm"
                    variant={forma === f ? "default" : "outline"}
                    disabled={ctaDisabled}
                    title={
                      ctaDisabled
                        ? "Requiere cliente con cuenta corriente habilitada"
                        : undefined
                    }
                    onClick={() => setForma(f)}
                  >
                    {f === "cuenta_corriente" ? "Cta. cte." : f}
                  </Button>
                );
              })}
            </div>
            {forma === "cuenta_corriente" &&
            cliente &&
            !cliente.cuentaCorriente ? (
              <p className="text-xs text-amber-700">
                Este cliente no tiene cuenta corriente habilitada.
              </p>
            ) : null}
            {forma === "contado" ? (
              <div className="space-y-1">
                <Label>Monto recibido ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  placeholder={(total / 100).toFixed(2)}
                />
                {vuelto != null ? (
                  <p className="text-sm">
                    Vuelto: <strong>{formatMoney(vuelto)}</strong>
                  </p>
                ) : null}
              </div>
            ) : null}
            {forma === "tarjeta" ? (
              <div className="space-y-2">
                <select
                  className="h-8 w-full rounded-lg border px-2 text-sm"
                  value={tarjetaTipo}
                  onChange={(e) =>
                    setTarjetaTipo(e.target.value as "debito" | "credito")
                  }
                >
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </select>
                <Input
                  value={tarjetaMarca}
                  onChange={(e) => setTarjetaMarca(e.target.value)}
                  placeholder="Marca"
                />
                <Input
                  value={tarjetaUltimos4}
                  onChange={(e) =>
                    setTarjetaUltimos4(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="Últimos 4"
                  maxLength={4}
                />
              </div>
            ) : null}
            <div className="border-t pt-3 text-right">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-semibold">{formatMoney(total)}</p>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button
              className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
              disabled={pending || items.length === 0}
              onClick={confirmar}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void confirmar();
                }
              }}
            >
              {pending ? "Confirmando…" : "Confirmar venta (Ctrl+Enter)"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
