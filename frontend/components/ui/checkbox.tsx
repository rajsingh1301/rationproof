import * as Primitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
export function Checkbox(props: ComponentPropsWithoutRef<typeof Primitive.Root>) {
  return <Primitive.Root {...props} className="feedback flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-surface data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground disabled:opacity-50">
    <Primitive.Indicator><Check className="size-5" aria-hidden="true" /></Primitive.Indicator>
  </Primitive.Root>;
}
