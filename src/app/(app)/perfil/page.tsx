import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { ChangePasswordForm } from "@/components/usuarios/change-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PerfilPage() {
  const user = await requireUser();

  return (
    <div className="max-w-lg">
      <PageHeader title="Mi perfil" description={user.email} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
