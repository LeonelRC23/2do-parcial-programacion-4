"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/shared/field";
import { Stack } from "@/components/layout/stack";
import { fetchJson } from "@/lib/api-client";
import { useFormAction } from "@/hooks/use-form-action";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { fieldErrors, formError, pending, run } = useFormAction();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const next = searchParams.get("next") || "/";
      router.push(next);
      router.refresh();
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.05_75)_0%,_transparent_55%),linear-gradient(180deg,_oklch(0.97_0.01_250),_oklch(0.93_0.01_250))]"
      />
      <Card className="relative z-10 w-full max-w-md shadow-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-amber-600 text-white">
            <Wrench className="size-5" />
          </span>
          <CardTitle className="font-heading text-xl">
            Gestión Comercial
          </CardTitle>
          <p className="text-sm text-slate-600">
            Iniciá sesión para continuar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Stack gap="md">
              <Field
                label="Email"
                htmlFor="email"
                error={fieldErrors.email}
                required
              >
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field
                label="Contraseña"
                htmlFor="password"
                error={fieldErrors.password}
                required
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              {formError ? (
                <p className="text-sm text-red-700" role="alert">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Ingresando…" : "Ingresar"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
