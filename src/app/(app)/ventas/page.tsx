import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { listFacturas } from "@/lib/services/facturas";
import { listClientes } from "@/lib/services/clientes";
import { listUsuarios } from "@/lib/services/usuarios";
import { PageHeader } from "@/components/layout/page-header";
import { Money } from "@/components/shared/money";
import { EstadoFacturaBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VentasFilters } from "@/components/ventas/ventas-filters";
import { Stack } from "@/components/layout/stack";

/** RF-V8 — Listado de facturas con filtros completos. */
export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const page = Number(sp.page ?? 1) || 1;
  const clienteId = sp.clienteId ? Number(sp.clienteId) : undefined;
  const vendedorId = sp.vendedorId ? Number(sp.vendedorId) : undefined;

  const [result, clientes, vendedores] = await Promise.all([
    listFacturas(user, {
      q: sp.q,
      desde: sp.desde,
      hasta: sp.hasta,
      forma: sp.forma,
      estado: sp.estado,
      clienteId: Number.isFinite(clienteId) ? clienteId : undefined,
      vendedorId: Number.isFinite(vendedorId) ? vendedorId : undefined,
      page,
      pageSize: 20,
    }),
    listClientes(user, { page: 1, pageSize: 100 }),
    user.rol === "admin"
      ? listUsuarios(user, { page: 1, pageSize: 50 })
      : Promise.resolve({ data: [] as { id: number; nombre: string }[] }),
  ]);

  return (
    <Stack gap="lg">
      <PageHeader
        title="Ventas"
        description="Facturas emitidas"
        actions={
          <Button
            asChild
            className="bg-amber-500 text-slate-950 hover:bg-amber-400"
          >
            <Link href="/ventas/nueva">Nueva venta</Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <VentasFilters
          clientes={result.data.length >= 0 ? (clientes.data as { id: number; nombre: string }[]) : []}
          vendedores={vendedores.data.map((v) => ({
            id: v.id,
            nombre: v.nombre,
          }))}
          esAdmin={user.rol === "admin"}
        />
      </Suspense>

      <p className="text-sm text-slate-500">
        Total emitido (filtro): <Money value={result.totalEmitido} />
      </p>

      {result.data.length === 0 ? (
        <EmptyState
          title="Sin facturas"
          description="No hay comprobantes para los filtros elegidos."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    {f.numeroFormateado}
                  </TableCell>
                  <TableCell>{formatDateTime(f.fecha)}</TableCell>
                  <TableCell>
                    {f.cliente?.nombre ?? "Consumidor final"}
                  </TableCell>
                  <TableCell>{f.vendedor.nombre}</TableCell>
                  <TableCell className="capitalize">
                    {f.formaPago.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money value={f.total} />
                  </TableCell>
                  <TableCell>
                    <EstadoFacturaBadge estado={f.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/ventas/${f.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/ventas"
        searchParams={sp}
      />
    </Stack>
  );
}
