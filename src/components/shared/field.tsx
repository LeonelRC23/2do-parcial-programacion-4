import { Label } from "@/components/ui/label";
import { Stack } from "@/components/layout/stack";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
};

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  required,
}: FieldProps) {
  return (
    <Stack gap="sm" className={cn("w-full", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-amber-700"> *</span> : null}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </Stack>
  );
}
