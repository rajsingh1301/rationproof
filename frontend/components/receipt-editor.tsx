import { useFieldArray, useFormContext, useWatch, Controller } from 'react-hook-form';
import { FileText, Plus, Trash2, ChevronDown, Check } from 'lucide-react';
import type { FormValues } from '@/lib/form';
import { commodityNames } from '@/lib/utils';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Field, Input, Select } from './ui/input';
import { Checkbox } from './ui/checkbox';

export function ReceiptEditor({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control, setValue, formState: { errors } } = useFormContext<FormValues>();
  const receipt = useWatch({ control, name: `receipts.${index}` });
  const { fields, append, remove } = useFieldArray({ control, name: `receipts.${index}.items` });
  const error = errors.receipts?.[index];
  const unconfirm = () => setValue(`receipts.${index}.confirmed`, false, { shouldDirty: true });
  return <Card className="receipt-card">
    <CardHeader>
      <div className="flex flex-wrap items-center gap-3"><FileText className="size-4 text-muted-foreground" aria-hidden="true" /><h3 className="text-sm font-semibold">Receipt {String(index + 1).padStart(2, '0')}</h3><Badge tone={receipt.confirmed ? 'success' : 'warning'}>{receipt.confirmed && <Check className="size-3" aria-hidden="true" />}{receipt.confirmed ? 'Reviewed' : 'Needs review'}</Badge></div>
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove receipt ${index + 1}`}><Trash2 aria-hidden="true" /></Button>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`rid-${index}`} label="Receipt / transaction number" error={error?.receipt_id?.message}><Input id={`rid-${index}`} maxLength={80} autoComplete="off" aria-invalid={!!error?.receipt_id} aria-describedby={error?.receipt_id ? `rid-${index}-error` : undefined} {...register(`receipts.${index}.receipt_id`, { onChange: unconfirm })} /></Field>
        <Field id={`date-${index}`} label="Receipt date" error={error?.date?.message}><Input id={`date-${index}`} type="date" aria-invalid={!!error?.date} aria-describedby={error?.date ? `date-${index}-error` : undefined} {...register(`receipts.${index}.date`, { onChange: unconfirm })} /></Field>
      </div>
      <div className="space-y-4">
        {fields.map((field, itemIndex) => {
          const itemError = error?.items?.[itemIndex];
          return <fieldset key={field.id} className="grid min-w-0 grid-cols-2 gap-4 rounded-md border bg-background p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px]">
            <legend className="sr-only">Commodity line {itemIndex + 1}</legend>
            <div className="col-span-2 lg:col-span-1"><Field id={`commodity-${index}-${itemIndex}`} label="Commodity"><Select id={`commodity-${index}-${itemIndex}`} {...register(`receipts.${index}.items.${itemIndex}.commodity`, { onChange: unconfirm })}>{Object.entries(commodityNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</Select></Field></div>
            <Field id={`issued-${index}-${itemIndex}`} label="Receipt says (kg)" error={itemError?.issued_kg?.message}><Input id={`issued-${index}-${itemIndex}`} inputMode="decimal" placeholder="Unknown" aria-invalid={!!itemError?.issued_kg} aria-describedby={itemError?.issued_kg ? `issued-${index}-${itemIndex}-error` : undefined} {...register(`receipts.${index}.items.${itemIndex}.issued_kg`, { onChange: unconfirm })} /></Field>
            <Field id={`received-${index}-${itemIndex}`} label="You received (kg)" error={itemError?.received_kg?.message}><Input id={`received-${index}-${itemIndex}`} inputMode="decimal" placeholder="Weigh & enter" aria-invalid={!!itemError?.received_kg} aria-describedby={itemError?.received_kg ? `received-${index}-${itemIndex}-error` : undefined} {...register(`receipts.${index}.items.${itemIndex}.received_kg`, { onChange: unconfirm })} /></Field>
            <Button variant="ghost" size="icon" className="self-end" disabled={fields.length <= 1} aria-label={`Remove commodity line ${itemIndex + 1} from receipt ${index + 1}`} onClick={() => { unconfirm(); remove(itemIndex); }}><Trash2 aria-hidden="true" /></Button>
          </fieldset>;
        })}
        {(error?.items?.root?.message || error?.items?.message) && <p className="text-xs text-danger" role="alert">{error.items.root?.message || error.items.message}</p>}
        {fields.length < 2 && <Button variant="ghost" size="small" onClick={() => { unconfirm(); append({ commodity: receipt.items[0]?.commodity === 'rice' ? 'wheat' : 'rice', issued_kg: '', received_kg: '' }); }}><Plus aria-hidden="true" />Add commodity</Button>}
      </div>
      {receipt.warnings.length > 0 && <div className="space-y-2 rounded-md border border-warning/25 bg-warning-soft p-4 text-xs text-warning"><p className="font-semibold">Check these fields against your receipt</p><ul className="list-disc space-y-2 pl-4">{receipt.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></div>}
      <details className="group border-y">
        <summary className="flex min-h-12 list-none items-center justify-between gap-4 py-3 text-sm"><span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" aria-hidden="true" />Original evidence</span><ChevronDown className="size-4 group-open:rotate-180" aria-hidden="true" /></summary>
        <div className="space-y-4 pb-4">{receipt.preview && <img src={receipt.preview} alt={`Original image for receipt ${index + 1}`} className="max-h-80 max-w-full rounded-md border object-contain" />}<pre className="max-h-64 overflow-y-auto rounded-md bg-muted p-4 text-xs leading-5">{receipt.source_text || 'Manual entry. Check these fields against your original receipt.'}</pre></div>
      </details>
      <Controller name={`receipts.${index}.confirmed`} control={control} render={({ field }) => <div className="flex items-start gap-3"><Checkbox id={`confirmed-${index}`} checked={field.value} onCheckedChange={checked => field.onChange(checked === true)} /><label htmlFor={`confirmed-${index}`} className="min-h-10 cursor-pointer text-sm leading-5"><span className="block font-semibold">I checked this receipt</span><span className="mt-1 block text-xs text-muted-foreground">These fields match the original. The received quantity is my own measurement.</span></label></div>} />
    </CardContent>
  </Card>;
}
