import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'feedback inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
  { variants: {
    variant: {
      primary: 'border border-accent bg-accent text-accent-foreground hover:opacity-90',
      secondary: 'border border-border bg-surface text-foreground hover:bg-muted',
      ghost: 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
      danger: 'border border-danger bg-danger-soft text-danger hover:bg-danger hover:text-surface',
    },
    size: { default: '', icon: 'size-10 p-0', small: 'px-3 text-xs' },
  }, defaultVariants: { variant: 'secondary', size: 'default' } },
);
type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean };
export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ className, variant, size, asChild, loading, disabled, children, ...props }, ref) {
  const Component = asChild ? Slot : 'button';
  return <Component ref={ref} type={asChild ? undefined : 'button'} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {asChild ? children : <>{loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}{children}</>}
  </Component>;
});
