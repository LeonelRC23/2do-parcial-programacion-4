import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listCategorias } from "@/lib/services/categorias";
import { PageHeader } from "@/components/layout/page-header";
import { Stack } from "@/components/layout/stack";
import { Button } from "@/components/ui/button";
import { CategoriasManager } from "@/components/productos/categorias-manager";

export default async function CategoriasPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.rol !== "admin") redirect("/productos");

  const categorias = await listCategorias(user);

  return (
    <Stack gap="lg">
      <PageHeader
        title="Categorías"
        description="Administración de categorías de productos"
        actions={
          <Button variant="outline" asChild>
            <Link href="/productos">Volver a productos</Link>
          </Button>
        }
      />
      <CategoriasManager categorias={categorias} />
    </Stack>
  );
}
