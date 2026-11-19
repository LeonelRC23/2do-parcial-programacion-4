import type { SessionUser } from "@/lib/auth/session";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AppSidebar user={user} />
      <div className="lg:pl-60">
        <AppTopbar user={user} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
