import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingState } from "@/components/shared/loading-state";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <LoadingState label="Cargando…" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
