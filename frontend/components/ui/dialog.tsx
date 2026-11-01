import * as Primitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export function DialogContent({ title, description, children, className }: { title: string; description: string; children: ReactNode; className?: string }) {
  return <Primitive.Portal>
    <Primitive.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)]" />
    <Primitive.Content className={cn('overlay-shadow fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border bg-surface p-6', className)}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2"><Primitive.Title className="text-lg font-semibold">{title}</Primitive.Title><Primitive.Description className="text-sm text-muted-foreground">{description}</Primitive.Description></div>
        <Primitive.Close asChild><Button variant="ghost" size="icon" aria-label="Close dialog"><X aria-hidden="true" /></Button></Primitive.Close>
      </div>
      {children}
    </Primitive.Content>
  </Primitive.Portal>;
}
