import { Badge } from "@/components/ui/badge";

const STYLES: Record<string, string> = {
  default: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  success: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  warning: "bg-amber-100 text-amber-900 hover:bg-amber-100",
  danger: "bg-red-100 text-red-800 hover:bg-red-100",
  muted: "bg-slate-100 text-slate-500 hover:bg-slate-100",
  emitida: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  anulada: "bg-red-100 text-red-800 hover:bg-red-100",
  activo: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  inactivo: "bg-slate-100 text-slate-500 hover:bg-slate-100",
  "bajo-minimo": "bg-amber-100 text-amber-900 hover:bg-amber-100",
};

export function StatusBadge({
  children,
  status,
  variant = "default",
}: {
  children?: React.ReactNode;
  status?: string;
  variant?: keyof typeof STYLES;
}) {
  const key = status ?? variant;
  const label =
    children ??
    (status === "bajo-minimo"
      ? "Bajo mínimo"
      : status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : null);

  return (
    <Badge className={`font-normal ${STYLES[key] ?? STYLES.default}`}>
      {label}
    </Badge>
  );
}

export function EstadoFacturaBadge({ estado }: { estado: string }) {
  return <StatusBadge status={estado} />;
}

export function ActivoBadge({ activo }: { activo: boolean }) {
  return <StatusBadge status={activo ? "activo" : "inactivo"} />;
}

export function BajoMinimoBadge() {
  return <StatusBadge status="bajo-minimo" />;
}
