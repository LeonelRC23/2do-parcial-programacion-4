import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Stack } from "@/components/layout/stack";

export function PageSkeleton() {
  return (
    <Stack gap="lg" aria-busy="true" aria-label="Cargando página">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 min-w-[180px] flex-1" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-36" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          {Array.from({ length: 8 }).map((_, indice) => (
            <Skeleton key={indice} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    </Stack>
  );
}
