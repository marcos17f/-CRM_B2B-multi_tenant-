import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', {
  variants: {
    variant: {
      default: 'bg-surface-hover text-text-muted border border-border',
      accent: 'bg-accent/15 text-accent border border-accent/30',
      blue: 'bg-accent-2/15 text-accent-2 border border-accent-2/30',
      warning: 'bg-warning/15 text-warning border border-warning/30',
      danger: 'bg-danger/15 text-danger border border-danger/30',
      outline: 'border border-border text-text-muted',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
