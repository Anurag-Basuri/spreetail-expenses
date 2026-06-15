import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-900 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-canvas border rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-150",
            error ? "border-negative-border focus:ring-negative-text focus:border-negative-text" : "border-border",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-negative-text">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-ink-600">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
