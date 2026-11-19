import { cn } from "@/lib/utils";

type StackProps = React.ComponentProps<"div"> & {
  gap?: "sm" | "md" | "lg";
};

const gapClass = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
} as const;

export function Stack({
  className,
  gap = "md",
  ...props
}: StackProps) {
  return (
    <div
      data-slot="stack"
      className={cn("flex flex-col", gapClass[gap], className)}
      {...props}
    />
  );
}
