import { NuevaVentaForm } from "@/components/ventas/nueva-venta-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { proximoNumero } from "@/lib/services/facturas";

export default async function NuevaVentaPage() {
  const user = await requireUser();
  const proximo = await proximoNumero(user);

  return (
    <div>
      <PageHeader
        title="Nueva venta"
        description={`Próximo número sugerido: ${proximo.numeroFormateado}`}
      />
      <NuevaVentaForm />
    </div>
  );
}
