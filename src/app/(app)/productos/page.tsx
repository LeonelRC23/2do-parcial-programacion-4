import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { listProductos } from "@/lib/services/productos";
import { listCategorias } from "@/lib/services/categorias";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/stack";
import { Cluster } from "@/components/layout/cluster";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductosFilters } from "@/components/productos/productos-filters";
import { ProductoFormDialog } from "@/components/productos/producto-form-dialog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const categoriaId =
    typeof sp.categoriaId === "string" ? Number(sp.categoriaId) : undefined;
  const bajoMinimo = sp.bajoMinimo === "true";
  const activo = typeof sp.activo === "string" ? sp.activo : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [categorias, result] = await Promise.all([
    listCategorias(user),
    listProductos(user, {
      q,
      categoriaId: Number.isFinite(categoriaId) ? categoriaId : undefined,
      bajoMinimo,
      activo,
      page,
      pageSize: 20,
    }),
  ]);

  return (
    <Stack gap="lg">
      <PageHeader
        title="Productos"
        description="Catálogo y stock"
        actions={
          <Cluster>
            {user.rol === "admin" ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/productos/categorias">Categorías</Link>
                </Button>
                <ProductoFormDialog
                  categorias={categorias}
                  abrirInicial={sp.nuevo === "1"}
                />
              </>
            ) : null}
          </Cluster>
        }
      />

      <Suspense fallback={<LoadingState label="Cargando filtros…" />}>
        <ProductosFilters
          categorias={categorias}
          esAdmin={user.rol === "admin"}
        />
      </Suspense>

      {result.data.length === 0 ? (
        <EmptyState title="Sin productos" description="No hay ítems con esos filtros." />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/productos/${p.id}`}
                        className="font-medium text-amber-800 hover:underline"
                      >
                        {p.codigo}
                      </Link>
                    </TableCell>
                    <TableCell>{p.descripcion}</TableCell>
                    <TableCell>{p.categoria.nombre}</TableCell>
                    <TableCell className="text-right">
                      <Money centavos={p.precio} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.existencia}
                    </TableCell>
                    <TableCell>
                      <Cluster gap="sm">
                        {p.bajoMinimo ? (
                          <StatusBadge status="bajo_minimo" />
                        ) : null}
                        <StatusBadge
                          status={p.activo ? "activo" : "inactivo"}
                        />
                      </Cluster>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Pagination
                page={result.page}
                pageSize={result.pageSize}
                total={result.total}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
