import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCliente, getCuentaCorriente } from "@/lib/services/clientes";
import { ApiError } from "@/lib/api/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/stack";
import { Cluster } from "@/components/layout/cluster";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { RegistrarPagoDialog } from "@/components/clientes/registrar-pago-dialog";
import { ClienteEditDialog } from "@/components/clientes/cliente-edit-dialog";
import { ClienteBajaButton } from "@/components/clientes/cliente-baja-button";
import { CuentaFilters } from "@/components/clientes/cuenta-filters";
import { Suspense } from "react";

export default async function ClienteDetailPage({
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
  const desde = typeof sp.desde === "string" ? sp.desde : undefined;
  const hasta = typeof sp.hasta === "string" ? sp.hasta : undefined;

  let cliente: Awaited<ReturnType<typeof getCliente>>;
  try {
    cliente = await getCliente(user, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const cuenta = cliente.cuentaCorriente
    ? await getCuentaCorriente(user, id, { desde, hasta })
    : null;

  return (
    <Stack gap="lg">
      <PageHeader
        title={cliente.nombre}
        description={`${cliente.tipoDoc} ${cliente.nroDoc}`}
        actions={
          <Cluster>
            <Button variant="outline" asChild>
              <Link href="/clientes">Volver</Link>
            </Button>
            <ClienteEditDialog cliente={cliente} />
            <ClienteBajaButton clienteId={id} activo={cliente.activo} />
            {cliente.cuentaCorriente && cliente.saldo > 0 ? (
              <RegistrarPagoDialog clienteId={id} saldo={cliente.saldo} />
            ) : null}
          </Cluster>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-600">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold">
              <Money centavos={cliente.saldo} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-600">Límite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold">
              {cliente.limiteCredito == null ? (
                "Sin límite"
              ) : (
                <Money centavos={cliente.limiteCredito} />
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-600">Disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold">
              {cliente.disponible == null ? (
                "—"
              ) : (
                <Money centavos={cliente.disponible} />
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-600">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Cluster gap="sm">
              <StatusBadge status={cliente.activo ? "activo" : "inactivo"} />
              {cliente.cuentaCorriente ? (
                <span className="text-xs text-slate-600">Cta. cte.</span>
              ) : null}
            </Cluster>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ficha">
        <TabsList>
          <TabsTrigger value="ficha">Ficha</TabsTrigger>
          <TabsTrigger value="cuenta" disabled={!cliente.cuentaCorriente}>
            Cuenta corriente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ficha" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Datos de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-slate-500">Domicilio: </span>
                  {cliente.domicilio ?? "—"}
                </p>
                <p>
                  <span className="text-slate-500">Teléfono: </span>
                  {cliente.telefono ?? "—"}
                </p>
                <p>
                  <span className="text-slate-500">Email: </span>
                  {cliente.email ?? "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Últimas facturas</CardTitle>
              </CardHeader>
              <CardContent>
                {cliente.ultimasFacturas.length === 0 ? (
                  <EmptyState
                    title="Sin facturas"
                    description="Este cliente aún no tiene ventas."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cliente.ultimasFacturas.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>
                            <Link
                              href={`/ventas/${f.id}`}
                              className="text-amber-800 hover:underline"
                            >
                              {f.numeroFormateado}
                            </Link>
                          </TableCell>
                          <TableCell>{formatDateTime(f.fecha)}</TableCell>
                          <TableCell className="text-right">
                            <Money centavos={f.total} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cuenta" className="mt-4">
          {!cuenta ? (
            <EmptyState title="Sin cuenta corriente" />
          ) : (
            <Card>
              <CardContent className="pt-4">
                <Suspense fallback={null}>
                  <CuentaFilters clienteId={id} />
                </Suspense>
                {cuenta.saldoAnterior !== 0 ? (
                  <p className="mb-3 text-sm text-slate-500">
                    Saldo anterior al rango:{" "}
                    <Money centavos={cuenta.saldoAnterior} />
                  </p>
                ) : null}
                {cuenta.movimientos.length === 0 ? (
                  <EmptyState title="Sin movimientos en el período" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cuenta.movimientos.map((m, i) => (
                        <TableRow key={`${m.fecha}-${i}`}>
                          <TableCell>{formatDateTime(m.fecha)}</TableCell>
                          <TableCell className="capitalize">{m.tipo}</TableCell>
                          <TableCell>
                            {m.pagoId ? (
                              <Link
                                href={`/pagos/${m.pagoId}`}
                                className="text-amber-800 hover:underline"
                              >
                                {m.descripcion}
                              </Link>
                            ) : m.facturaId ? (
                              <Link
                                href={`/ventas/${m.facturaId}`}
                                className="text-amber-800 hover:underline"
                              >
                                {m.descripcion}
                              </Link>
                            ) : (
                              m.descripcion
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Money
                              centavos={
                                m.tipo === "debito" ? m.importe : -m.importe
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money centavos={m.saldo} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
