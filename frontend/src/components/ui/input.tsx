import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-input bg-subtle px-3.5 text-base text-fg transition-[color,box-shadow,border-color] outline-none selection:bg-mint/40 placeholder:text-fg-muted/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        "focus-visible:border-mint focus-visible:ring-[3px] focus-visible:ring-mint/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
