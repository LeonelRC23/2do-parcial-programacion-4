import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { listClientes } from "@/lib/services/clientes";
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
import { ClientesFilters } from "@/components/clientes/clientes-filters";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const result = await listClientes(user, {
    q,
    page,
    pageSize: 20,
  });

  return (
    <Stack gap="lg">
      <PageHeader
        title="Clientes"
        description="Agenda y saldos"
        actions={
          <Cluster>
            <Button variant="outline" asChild>
              <Link href="/clientes/saldos">Con deuda</Link>
            </Button>
            <ClienteFormDialog />
          </Cluster>
        }
      />

      <Suspense fallback={<LoadingState />}>
        <ClientesFilters />
      </Suspense>

      {result.data.length === 0 ? (
        <EmptyState title="Sin clientes" />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-amber-800 hover:underline"
                      >
                        {c.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {c.tipoDoc} {c.nroDoc}
                    </TableCell>
                    <TableCell>{c.telefono ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Money
                        centavos={c.saldo}
                        className={
                          c.saldo > 0 ? "font-medium text-amber-900" : undefined
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.activo ? "activo" : "inactivo"} />
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
