import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { ArrowRight, Info } from 'lucide-react';
import type { FormValues } from '@/lib/form';
import { Card, CardContent, CardHeader } from './ui/card';
import { Field, Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

export function MonthlyContext({ busy }: { busy: boolean }) {
  const { register, control, formState: { errors } } = useFormContext<FormValues>();
  const receipts = useWatch({ control, name: 'receipts' });
  const reviewed = receipts.filter(receipt => receipt.confirmed).length;
  return <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
    <Card><CardHeader><div className="space-y-1"><h2 className="text-base font-semibold">Monthly context</h2><p className="text-xs text-muted-foreground">Set the month and known allowance.</p></div></CardHeader>
      <CardContent className="space-y-6">
        <Field id="month" label="Month" error={errors.month?.message}><Input id="month" type="month" aria-invalid={!!errors.month} aria-describedby={errors.month ? 'month-error' : undefined} {...register('month')} /></Field>
        <div className="space-y-4"><div className="space-y-1"><h3 className="text-sm font-semibold">Monthly entitlement</h3><p className="text-xs text-muted-foreground">From your official record. Leave unknown amounts empty.</p></div>
          <div className="grid grid-cols-2 gap-4">{(['rice', 'wheat'] as const).map(name => <Field key={name} id={name} label={name === 'rice' ? 'Rice (kg)' : 'Wheat (kg)'} error={errors[name]?.message}><Input id={name} inputMode="decimal" placeholder="Unknown" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} {...register(name)} /></Field>)}</div>
        </div>
        <Field id="source" label="Source of entitlement" hint="Optional. Name the record you referred to." error={errors.entitlement_source?.message}><Input id="source" maxLength={500} aria-describedby="source-hint" {...register('entitlement_source')} /></Field>
        <div className="border-t pt-6"><Controller name="month_complete" control={control} render={({ field }) => <div className="flex items-start gap-3"><Checkbox id="month-complete" checked={field.value} onCheckedChange={checked => field.onChange(checked === true)} /><label htmlFor="month-complete" className="min-h-10 cursor-pointer text-xs leading-5">I have added all receipts for this month so far.</label></div>} /></div>
        <div className="space-y-3"><Button id="compare" type="submit" variant="primary" loading={busy} disabled={!receipts.length} className="w-full">{busy ? 'Comparing records' : 'Compare records'}{!busy && <ArrowRight aria-hidden="true" />}</Button><p className="text-center text-xs text-muted-foreground">{receipts.length ? `${reviewed} of ${receipts.length} receipts reviewed` : 'Add a receipt to begin.'}</p></div>
      </CardContent>
    </Card>
    <div className="flex items-start gap-3 px-1 py-2 text-xs text-muted-foreground"><Info className="size-4" aria-hidden="true" /><p>A balance is ration left to check or collect. It is separate from a difference between your receipt and your measured amount.</p></div>
  </aside>;
}
