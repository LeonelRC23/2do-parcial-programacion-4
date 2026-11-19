"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth/session";
import { Cluster } from "./cluster";

export function AppTopbar({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("No se pudo cerrar sesión.");
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm lg:px-6">
      <Cluster className="ml-12 lg:ml-0">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{user.nombre}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        <Badge
          variant="secondary"
          className="capitalize bg-amber-50 text-amber-900 ring-1 ring-amber-200/80"
        >
          {user.rol}
        </Badge>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/perfil">
            <User className="size-4" />
            Perfil
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          Salir
        </Button>
      </Cluster>
    </header>
  );
}
