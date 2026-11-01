import { cn } from '@/lib/utils';
export function Skeleton({ className }: { className?: string }) { return <div aria-hidden="true" className={cn('rounded-md bg-muted', className)} />; }
export function LoadingState({ label }: { label: string }) {
  return <div role="status" aria-live="polite" className="space-y-4 py-4"><p className="text-sm text-muted-foreground">{label}</p><Skeleton className="h-5 w-1/3" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
}
