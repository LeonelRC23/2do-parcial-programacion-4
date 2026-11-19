import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  getProducto,
  listMovimientosProducto,
} from "@/lib/services/productos";
import { ApiError } from "@/lib/api/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/stack";
import { Cluster } from "@/components/layout/cluster";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { StockMovimientoDialog } from "@/components/productos/stock-movimiento-dialog";
import { ProductoEditDialog } from "@/components/productos/producto-edit-dialog";
import { ProductoBajaButton } from "@/components/productos/producto-baja-button";
import { listCategorias } from "@/lib/services/categorias";

export default async function ProductoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  let producto: Awaited<ReturnType<typeof getProducto>>;
  try {
    producto = await getProducto(user, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [movimientos, categorias] = await Promise.all([
    listMovimientosProducto(user, id, { page, pageSize: 15 }),
    user.rol === "admin" ? listCategorias(user) : Promise.resolve([]),
  ]);

  return (
    <Stack gap="lg">
      <PageHeader
        title={producto.descripcion}
        description={`Código ${producto.codigo}`}
        actions={
          <Cluster className="no-print">
            <Button variant="outline" asChild>
              <Link href="/productos">Volver</Link>
            </Button>
            {user.rol === "admin" ? (
              <>
                <ProductoEditDialog
                  producto={producto}
                  categorias={categorias}
                />
                <ProductoBajaButton
                  productoId={id}
                  activo={producto.activo}
                />
                <StockMovimientoDialog productoId={id} tipo="ingreso" />
                <StockMovimientoDialog productoId={id} tipo="egreso" />
              </>
            ) : null}
          </Cluster>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-600">Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold">
              <Money centavos={producto.precio} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-600">Existencia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold tabular-nums">
              {producto.existencia}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-600">Stock mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold tabular-nums">
              {producto.stockMinimo}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-600">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Cluster gap="sm">
              {producto.bajoMinimo ? (
                <StatusBadge status="bajo_minimo" />
              ) : null}
              <StatusBadge status={producto.activo ? "activo" : "inactivo"} />
            </Cluster>
            <p className="mt-2 text-sm text-slate-600">
              {producto.categoria.nombre}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos de stock</CardTitle>
        </CardHeader>
        <CardContent>
          {movimientos.data.length === 0 ? (
            <EmptyState
              title="Sin movimientos"
              description="Todavía no hay ingresos ni egresos."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Resultante</TableHead>
                    <TableHead>Motivo / Ref.</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.data.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{formatDateTime(m.fecha)}</TableCell>
                      <TableCell className="capitalize">{m.tipo}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.cantidad}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.existenciaResultante}
                      </TableCell>
                      <TableCell>
                        {m.motivo ??
                          (m.referencia
                            ? `Factura ${m.referencia.numero}`
                            : "—")}
                      </TableCell>
                      <TableCell>{m.usuario.nombre}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Pagination
                  page={movimientos.page}
                  pageSize={movimientos.pageSize}
                  total={movimientos.total}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
