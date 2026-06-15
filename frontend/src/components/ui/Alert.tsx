import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "error" | "success";
  title?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    
    const variants = {
      info: "bg-info-bg text-info-text border-l-4 border-info-border",
      warning: "bg-warning-bg text-warning-text border-l-4 border-warning-border",
      error: "bg-negative-bg text-negative-text border-l-4 border-negative-border",
      success: "bg-positive-bg text-positive-text border-l-4 border-positive-border",
    };

    return (
      <div
        ref={ref}
        className={cn("p-4 rounded-r-xl", variants[variant], className)}
        {...props}
      >
        {title && <h3 className="text-sm font-semibold mb-1">{title}</h3>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    );
  }
);
Alert.displayName = "Alert";
