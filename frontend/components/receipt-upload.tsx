import { useRef, useState } from 'react';
import { Upload, TextCursorInput, Plus, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent } from './ui/dialog';
import { Field, Textarea } from './ui/input';
import { LoadingState } from './ui/skeleton';
import { ErrorState } from './ui/error-state';
import { cn } from '@/lib/utils';

const schema = z.object({ text: z.string().trim().min(1, 'Paste the text from your receipt.').max(20000, 'Use up to 20,000 characters.') });
export function ReceiptUpload({ pending, error, onFile, onText, onManual }: { pending: boolean; error: string | null; onFile: (file: File) => void; onText: (text: string) => Promise<boolean>; onManual: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const lastFile = useRef<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { text: '' } });
  const submitText = form.handleSubmit(async values => { if (await onText(values.text)) { form.reset(); setTextOpen(false); } });
  const addFile = (file?: File) => { if (file && !pending) { lastFile.current = file; onFile(file); } };
  return <>
    <Card><CardContent>
      {pending ? <LoadingState label="Reading your receipt. Keep this page open." /> : <div className={cn('rounded-md border border-dashed border-input p-4 sm:p-6', dragging && 'border-accent bg-accent-soft')}
        onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); addFile(event.dataTransfer.files[0]); }}>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"><div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted"><Upload className="size-5 text-muted-foreground" aria-hidden="true" /></div><div className="min-w-0 flex-1 space-y-1"><h3 className="text-sm font-semibold">Add a receipt</h3><p className="text-xs text-muted-foreground">Drop a photo here, or choose a file.</p><p className="text-xs text-muted-foreground">PNG, JPG, WebP or TXT. Up to 8 MB.</p></div><Button onClick={() => input.current?.click()}>Choose file<Upload aria-hidden="true" /></Button></div>
      </div>}
      <input ref={input} id="file" className="sr-only" type="file" tabIndex={-1} aria-label="Receipt file" accept="image/png,image/jpeg,image/webp,.txt" disabled={pending} onChange={event => { addFile(event.target.files?.[0]); event.target.value = ''; }} />
      <div className="mt-4 flex flex-wrap items-center gap-2"><Button variant="ghost" size="small" disabled={pending} onClick={() => setTextOpen(true)}><TextCursorInput aria-hidden="true" />Paste text</Button><Button id="add-manual" variant="ghost" size="small" disabled={pending} onClick={onManual}><Plus aria-hidden="true" />Enter manually</Button><span className="ml-auto text-xs text-muted-foreground">Files stay on this device.</span></div>
      <p className="mt-3 text-xs text-muted-foreground">Try a labelled sample: <a className="inline-flex min-h-10 items-center px-2 text-accent underline underline-offset-4" href="/static/demo-receipt.txt" download>Receipt text</a><a className="inline-flex min-h-10 items-center px-2 text-accent underline underline-offset-4" href="/static/demo-receipt.png" download>Receipt image</a></p>
      {error && <div className="mt-4"><ErrorState message={error} onRetry={lastFile.current ? () => addFile(lastFile.current ?? undefined) : undefined} /></div>}
    </CardContent></Card>
    <Dialog open={textOpen} onOpenChange={setTextOpen}><DialogContent title="Paste receipt text" description="Copy the text from your original receipt. You will review the extracted fields next.">
      <form onSubmit={event => { event.stopPropagation(); void submitText(event); }} className="space-y-6" noValidate>
        <Field id="receipt-text" label="Receipt text" error={form.formState.errors.text?.message}><Textarea id="receipt-text" rows={8} aria-invalid={!!form.formState.errors.text} aria-describedby={form.formState.errors.text ? 'receipt-text-error' : undefined} {...form.register('text')} /></Field>
        {error && <ErrorState message={error} />}
        <Button type="submit" variant="primary" loading={pending}><FileText aria-hidden="true" />Read receipt text</Button>
      </form>
    </DialogContent></Dialog>
  </>;
}
