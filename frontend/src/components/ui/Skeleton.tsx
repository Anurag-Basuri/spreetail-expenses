import * as React from "react";
import { cn } from "@/lib/utils";

export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("animate-pulse bg-border rounded", className)}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";
