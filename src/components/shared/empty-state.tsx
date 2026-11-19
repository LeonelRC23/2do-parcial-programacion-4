import { Inbox } from "lucide-react";
import { Stack } from "@/components/layout/stack";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title = "Sin resultados",
  description = "No hay datos para mostrar con los filtros actuales.",
  action,
  className,
}: EmptyStateProps) {
  return (
    <Stack
      gap="md"
      className={cn(
        "items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Inbox className="size-5" />
      </span>
      <Stack gap="sm" className="items-center">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="max-w-sm text-sm text-slate-600">{description}</p>
      </Stack>
      {action}
    </Stack>
  );
}
