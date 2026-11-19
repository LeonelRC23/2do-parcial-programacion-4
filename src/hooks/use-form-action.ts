"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { ClientApiError } from "@/lib/api-client";

type FieldErrors = Record<string, string>;

type Options = {
  successMessage?: string;
  onSuccess?: () => void;
};

export function useFormAction(options: Options = {}) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    (action: () => Promise<void>) => {
      setFieldErrors({});
      setFormError(null);
      startTransition(async () => {
        try {
          await action();
          if (options.successMessage) {
            toast.success(options.successMessage);
          }
          options.onSuccess?.();
        } catch (err) {
          if (err instanceof ClientApiError) {
            const details = err.details;
            if (Array.isArray(details)) {
              const next: FieldErrors = {};
              for (const d of details) {
                if (
                  d &&
                  typeof d === "object" &&
                  "campo" in d &&
                  "mensaje" in d &&
                  typeof (d as { campo?: unknown }).campo === "string" &&
                  typeof (d as { mensaje?: unknown }).mensaje === "string"
                ) {
                  next[(d as { campo: string }).campo] = (
                    d as { mensaje: string }
                  ).mensaje;
                }
              }
              if (Object.keys(next).length) {
                setFieldErrors(next);
              }
            }
            setFormError(err.message);
            toast.error(err.message);
            return;
          }
          const message =
            err instanceof Error ? err.message : "Ocurrió un error.";
          setFormError(message);
          toast.error(message);
        }
      });
    },
    [options],
  );

  return {
    fieldErrors,
    formError,
    pending,
    run,
    setFieldErrors,
    setFormError,
  };
}
