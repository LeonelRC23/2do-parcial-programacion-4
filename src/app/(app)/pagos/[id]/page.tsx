import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getPago } from "@/lib/services/pagos";
import { ApiError } from "@/lib/api/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Money } from "@/components/shared/money";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/shared/print-button";
import { Cluster } from "@/components/layout/cluster";

const MEDIOS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta débito",
};

/** RF-C5 — Recibo de pago imprimible. */
export default async function ReciboPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  let pago: Awaited<ReturnType<typeof getPago>>;
  try {
    pago = await getPago(user, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const comercio = {
    nombre: process.env.COMERCIO_NOMBRE ?? "Comercio",
    domicilio: process.env.COMERCIO_DOMICILIO ?? "",
    cuit: process.env.COMERCIO_CUIT ?? "",
  };

  return (
    <div>
      <PageHeader
        title={`Recibo ${pago.numeroRecibo}`}
        description={formatDateTime(pago.fecha)}
        actions={
          <Cluster className="print:hidden">
            <Button variant="outline" asChild>
              <Link href={`/clientes/${pago.cliente.id}`}>Volver al cliente</Link>
            </Button>
            <PrintButton />
          </Cluster>
        }
      />

      <div className="mx-auto max-w-lg rounded-xl border bg-white p-6 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold">{comercio.nombre}</h2>
          <p className="text-sm text-slate-500">{comercio.domicilio}</p>
          <p className="text-sm text-slate-500">CUIT {comercio.cuit}</p>
          <p className="mt-2 text-xs text-slate-400">
            Recibo de pago · cuenta corriente
          </p>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <dt className="text-slate-500">Número</dt>
            <dd className="font-mono font-medium">{pago.numeroRecibo}</dd>
          </div>
          <div className="flex justify-between border-b pb-2">
            <dt className="text-slate-500">Fecha</dt>
            <dd>{formatDateTime(pago.fecha)}</dd>
          </div>
          <div className="flex justify-between border-b pb-2">
            <dt className="text-slate-500">Cliente</dt>
            <dd className="font-medium">{pago.cliente.nombre}</dd>
          </div>
          <div className="flex justify-between border-b pb-2">
            <dt className="text-slate-500">Importe</dt>
            <dd className="text-lg font-semibold">
              <Money value={pago.importe} />
            </dd>
          </div>
          <div className="flex justify-between border-b pb-2">
            <dt className="text-slate-500">Medio</dt>
            <dd>{MEDIOS[pago.medio] ?? pago.medio}</dd>
          </div>
          {pago.observacion ? (
            <div className="flex justify-between border-b pb-2">
              <dt className="text-slate-500">Observación</dt>
              <dd>{pago.observacion}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-b pb-2">
            <dt className="text-slate-500">Recibido por</dt>
            <dd>{pago.usuario.nombre}</dd>
          </div>
          <div className="flex justify-between pt-2">
            <dt className="text-slate-500">Saldo restante</dt>
            <dd className="font-medium">
              <Money value={pago.saldoCliente} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
