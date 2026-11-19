import { cn } from "@/lib/utils";

type ClusterProps = React.ComponentProps<"div"> & {
  gap?: "sm" | "md" | "lg";
};

const gapClass = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
} as const;

export function Cluster({
  className,
  gap = "md",
  ...props
}: ClusterProps) {
  return (
    <div
      data-slot="cluster"
      className={cn(
        "flex flex-wrap items-center",
        gapClass[gap],
        className,
      )}
      {...props}
    />
  );
}
