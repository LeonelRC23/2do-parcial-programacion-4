import { AlertTriangle } from "lucide-react";
import { Stack } from "@/components/layout/stack";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  message?: string;
  className?: string;
};

export function ErrorState({
  title = "No se pudo cargar",
  message = "Ocurrió un error al obtener los datos.",
  className,
}: ErrorStateProps) {
  return (
    <Alert
      variant="destructive"
      className={cn("border-red-200 bg-red-50 text-red-900", className)}
    >
      <AlertTriangle className="size-4" />
      <Stack gap="sm">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Stack>
    </Alert>
  );
}
