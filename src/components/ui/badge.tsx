import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-xl border font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap min-w-16 text-center",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover border-transparent shadow-sm hover:shadow-md px-3 py-1.5 text-xs",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover border-transparent shadow-sm hover:shadow-md px-3 py-1.5 text-xs",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent shadow-sm hover:shadow-md px-3 py-1.5 text-xs",
        success:
          "bg-success text-success-foreground hover:bg-success/90 border-transparent shadow-sm hover:shadow-md px-3 py-1.5 text-xs",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 border-transparent shadow-sm hover:shadow-md px-3 py-1.5 text-xs",
        outline: 
          "text-foreground border-border bg-background hover:bg-accent hover:text-accent-foreground px-3 py-1.5 text-xs",
        glass:
          "bg-glass-bg border-glass-border backdrop-blur-sm text-foreground hover:bg-accent hover:text-accent-foreground px-3 py-1.5 text-xs",
        elegant:
          "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground border-transparent shadow-md hover:shadow-lg hover:scale-105 px-3 py-1.5 text-xs",
      },
      size: {
        sm: "px-2 py-1 text-xs min-w-12 h-6",
        default: "px-3 py-1.5 text-xs min-w-16 h-7",
        lg: "px-4 py-2 text-sm min-w-20 h-8",
        xl: "px-5 py-2.5 text-sm min-w-24 h-9 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
