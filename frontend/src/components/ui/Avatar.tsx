import * as React from "react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: "sm" | "md" | "lg";
  inactive?: boolean;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, size = "md", inactive = false, ...props }, ref) => {
    
    const sizes = {
      sm: "w-6 h-6 text-[10px]",
      md: "w-10 h-10 text-sm",
      lg: "w-16 h-16 text-lg",
    };

    const colorClass = getAvatarColor(name);

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full flex items-center justify-center font-bold tracking-wider",
          sizes[size],
          inactive ? "bg-gray-100 text-gray-400 opacity-60" : colorClass,
          className
        )}
        title={name}
        {...props}
      >
        {getInitials(name)}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
