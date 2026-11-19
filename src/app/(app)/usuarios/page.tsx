import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listUsuarios } from "@/lib/services/usuarios";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/stack";
import { UsuariosManager } from "@/components/usuarios/usuarios-manager";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.rol !== "admin") redirect("/");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const result = await listUsuarios(user, {
    q,
    page,
    pageSize: 50,
  });

  return (
    <Stack gap="lg">
      <PageHeader
        title="Usuarios"
        description="Administración de accesos al sistema"
      />
      <UsuariosManager usuarios={result.data} />
    </Stack>
  );
}
