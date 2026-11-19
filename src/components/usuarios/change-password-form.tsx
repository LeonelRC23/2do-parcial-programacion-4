"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError, fetchJson } from "@/lib/api-client";

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await fetchJson("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          actual: String(fd.get("actual")),
          nueva: String(fd.get("nueva")),
        }),
      });
      toast.success("Contraseña actualizada");
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="actual">Contraseña actual</Label>
        <Input id="actual" name="actual" type="password" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="nueva">Nueva contraseña</Label>
        <Input id="nueva" name="nueva" type="password" minLength={8} required />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Cambiar"}
      </Button>
    </form>
  );
}
