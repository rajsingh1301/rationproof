import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:gap-6">
    <div className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted"><Icon className="size-5 text-muted-foreground" aria-hidden="true" /></div>
    <div className="max-w-md space-y-2"><h3 className="text-base font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{description}</p>{action && <div className="pt-2">{action}</div>}</div>
  </div>;
}
