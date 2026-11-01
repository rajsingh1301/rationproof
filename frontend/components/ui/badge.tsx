import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
const variants = cva('inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-normal', {
  variants: { tone: {
    neutral: 'border-border bg-muted text-muted-foreground',
    accent: 'border-accent/25 bg-accent-soft text-accent',
    success: 'border-success/25 bg-success-soft text-success',
    warning: 'border-warning/25 bg-warning-soft text-warning',
    danger: 'border-danger/25 bg-danger-soft text-danger',
  } }, defaultVariants: { tone: 'neutral' },
});
export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof variants>) {
  return <span className={cn(variants({ tone }), className)} {...props} />;
}
