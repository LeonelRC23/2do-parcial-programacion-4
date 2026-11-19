import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Money({
  value,
  centavos,
  className,
}: {
  value?: number;
  /** Alias de value (usado por páginas del agente UI). */
  centavos?: number;
  className?: string;
}) {
  const amount = value ?? centavos ?? 0;
  return (
    <span className={cn("tabular-nums", className)}>{formatMoney(amount)}</span>
  );
}
