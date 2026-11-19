import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getFactura } from "@/lib/services/facturas";
import { PageHeader } from "@/components/layout/page-header";
import { Money } from "@/components/shared/money";
import { EstadoFacturaBadge } from "@/components/shared/status-badge";
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
import { AnularFacturaDialog } from "@/components/ventas/anular-factura-dialog";
import { ApiError } from "@/lib/api/errors";
import { PrintButton } from "@/components/shared/print-button";

export default async function FacturaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const user = await requireUser();

  let factura: Awaited<ReturnType<typeof getFactura>>;
  try {
    factura = await getFactura(user, id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const comercio = {
    nombre: process.env.COMERCIO_NOMBRE ?? "Comercio",
    domicilio: process.env.COMERCIO_DOMICILIO ?? "",
    cuit: process.env.COMERCIO_CUIT ?? "",
  };

  const pago = factura.pago as Record<string, unknown>;

  return (
    <div>
      <PageHeader
        title={`Factura ${factura.numeroFormateado as string}`}
        description={formatDateTime(factura.fecha as string)}
        actions={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" asChild>
              <Link href="/ventas">Volver</Link>
            </Button>
            <PrintButton />
            {user.rol === "admin" && factura.estado === "emitida" ? (
              <AnularFacturaDialog facturaId={factura.id as number} />
            ) : null}
          </div>
        }
      />

      <div className="mx-auto max-w-3xl rounded-xl border bg-white p-6 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{comercio.nombre}</h2>
            <p className="text-sm text-slate-500">{comercio.domicilio}</p>
            <p className="text-sm text-slate-500">CUIT {comercio.cuit}</p>
            <p className="mt-2 text-xs text-slate-400">
              Comprobante interno — sin validez fiscal
            </p>
          </div>
          <div className="text-right">
            <EstadoFacturaBadge estado={factura.estado as string} />
            <p className="mt-2 font-mono text-sm">
              {factura.numeroFormateado as string}
            </p>
            <p className="text-sm text-slate-500">
              {formatDateTime(factura.fecha as string)}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Comprador</p>
            <p className="font-medium">
              {(factura.cliente as { nombre?: string } | null)?.nombre ??
                "Consumidor final"}
            </p>
            {factura.cliente ? (
              <p className="text-slate-600">
                {(factura.cliente as { tipoDoc: string; nroDoc: string }).tipoDoc}{" "}
                {(factura.cliente as { nroDoc: string }).nroDoc}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-slate-500">Vendedor</p>
            <p className="font-medium">
              {(factura.vendedor as { nombre: string }).nombre}
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">P. unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(
              factura.items as Array<{
                codigo: string;
                descripcion: string;
                cantidad: number;
                precioUnitario: number;
                subtotal: number;
              }>
            ).map((i, idx) => (
              <TableRow key={idx}>
                <TableCell>{i.codigo}</TableCell>
                <TableCell>{i.descripcion}</TableCell>
                <TableCell className="text-right">{i.cantidad}</TableCell>
                <TableCell className="text-right">
                  <Money value={i.precioUnitario} />
                </TableCell>
                <TableCell className="text-right">
                  <Money value={i.subtotal} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-semibold">
              <Money value={factura.total as number} />
            </p>
            <p className="mt-2 text-sm capitalize text-slate-600">
              Forma de pago: {String(pago.forma).replace("_", " ")}
              {pago.vuelto != null ? (
                <> · Vuelto <Money value={pago.vuelto as number} /></>
              ) : null}
              {pago.tarjeta ? (
                <>
                  {" "}
                  ·{" "}
                  {(pago.tarjeta as { tipo: string; marca: string; ultimos4: string }).marca}{" "}
                  ****
                  {(pago.tarjeta as { ultimos4: string }).ultimos4}
                </>
              ) : null}
            </p>
          </div>
        </div>

        {factura.anulacion ? (
          <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            Anulada: {(factura.anulacion as { motivo: string }).motivo}
          </div>
        ) : null}
      </div>
    </div>
  );
}
