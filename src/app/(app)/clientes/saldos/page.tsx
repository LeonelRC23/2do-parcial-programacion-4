import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { listClientes } from "@/lib/services/clientes";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/stack";
import { Money } from "@/components/shared/money";
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
import { Cluster } from "@/components/layout/cluster";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SaldosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const result = (await listClientes(user, {
    q,
    conDeuda: true,
    page,
    pageSize: 20,
  })) as {
    data: {
      id: number;
      nombre: string;
      tipoDoc: string;
      nroDoc: string;
      saldo: number;
      limiteCredito: number | null;
      disponible: number | null;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalAdeudado?: number;
  };

  return (
    <Stack gap="lg">
      <PageHeader
        title="Clientes con deuda"
        description="Cuentas corrientes con saldo pendiente"
        actions={
          <Button variant="outline" asChild>
            <Link href="/clientes">Todos los clientes</Link>
          </Button>
        }
      />

      <Suspense fallback={<LoadingState />}>
        <ClientesFilters basePath="/clientes/saldos" />
      </Suspense>

      <Cluster className="justify-between text-sm text-slate-600">
        <span>{result.total} clientes</span>
        <span>
          Total adeudado:{" "}
          <Money
            centavos={result.totalAdeudado ?? 0}
            className="font-medium text-slate-900"
          />
        </span>
      </Cluster>

      {result.data.length === 0 ? (
        <EmptyState title="Nadie con deuda" description="No hay saldos pendientes." />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
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
                    <TableCell className="text-right">
                      <Money centavos={c.saldo} className="font-medium text-amber-900" />
                    </TableCell>
                    <TableCell className="text-right">
                      {c.disponible == null ? (
                        "Sin límite"
                      ) : (
                        <Money centavos={c.disponible} />
                      )}
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
