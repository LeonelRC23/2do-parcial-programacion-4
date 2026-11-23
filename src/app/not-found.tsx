import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-amber-700">Error 404</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          La ruta que buscás no existe o el recurso fue dado de baja.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">
            <Home className="size-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
