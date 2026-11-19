import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getTablero } from "@/lib/services/tablero";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/stack";
import { Money } from "@/components/shared/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FormaPagoChart,
  VentasDiariasChart,
} from "@/components/dashboard/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const tablero = await getTablero(user);

  const kpis = [
    {
      label: "Ventas de hoy",
      value: <Money centavos={tablero.hoy.importe} />,
      hint: `${tablero.hoy.cantidad} comprobantes`,
    },
    {
      label: "Ventas del mes",
      value: <Money centavos={tablero.mes.importe} />,
      hint: `${tablero.mes.cantidad} · ticket prom. `,
      extra: <Money centavos={tablero.mes.ticketPromedio} />,
    },
    {
      label: "Cuentas corrientes",
      value: <Money centavos={tablero.cuentasCorrientes.totalAdeudado} />,
      hint: `${tablero.cuentasCorrientes.clientesConSaldo} clientes con saldo`,
      href: "/clientes/saldos",
    },
    {
      label: "Stock bajo mínimo",
      value: String(tablero.bajoMinimo.cantidad),
      hint: "Productos a reponer",
      href: "/productos?bajoMinimo=true",
    },
  ];

  return (
    <Stack gap="lg">
      <PageHeader
        title="Inicio"
        description="Resumen operativo del negocio"
        actions={
          <Button asChild>
            <Link href="/ventas/nueva">Nueva venta</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const card = (
            <Card className="h-full">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-semibold text-slate-900">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {kpi.hint}
                  {"extra" in kpi ? kpi.extra : null}
                </p>
              </CardContent>
            </Card>
          );
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={kpi.label}>{card}</div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <VentasDiariasChart data={tablero.ventasDiarias} />
        <FormaPagoChart data={tablero.porFormaDePago} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Más vendidos del mes</CardTitle>
        </CardHeader>
        <CardContent>
          {tablero.masVendidos.length === 0 ? (
            <EmptyState
              title="Sin ventas este mes"
              description="Cuando emitas facturas, acá vas a ver el ranking."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablero.masVendidos.map((p) => (
                  <TableRow key={p.productoId}>
                    <TableCell>
                      <Link
                        href={`/productos/${p.productoId}`}
                        className="font-medium text-amber-800 hover:underline"
                      >
                        {p.codigo}
                      </Link>
                    </TableCell>
                    <TableCell>{p.descripcion}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.unidades}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money centavos={p.importe} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
