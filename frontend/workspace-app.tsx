import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { ClipboardList, FileText, Info } from 'lucide-react';
import type { Extraction, Health, Ledger, Report } from '@/lib/contracts';
import { api, errorMessage, jsonOptions } from '@/lib/api';
import { emptyValues, FormValues, ledgerSchema, sampleValues, toFormReceipt, toLedger } from '@/lib/form';
import { monthLabel } from '@/lib/utils';
import { WorkspaceShell } from '@/components/workspace-shell';
import { ReceiptUpload } from '@/components/receipt-upload';
import { ReceiptEditor } from '@/components/receipt-editor';
import { MonthlyContext } from '@/components/monthly-context';
import { Comparison } from '@/components/comparison';
import { SampleDialog } from '@/components/sample-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

function SectionHeader({ number, title, description, count }: { number: string; title: string; description: string; count?: string | number }) {
  return <div className="space-y-2"><div className="flex flex-wrap items-center gap-3"><p className="text-xs text-muted-foreground">{number} /</p>{count !== undefined && <Badge>{count} {Number(count) === 1 ? 'receipt' : 'receipts'}</Badge>}</div><div className="space-y-1"><h2 className="text-xl font-semibold tracking-tight" id={`${title.toLowerCase().replaceAll(' ', '-')}-heading`}>{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div></div>;
}

export function WorkspaceApp() {
  const form = useForm<FormValues>({ resolver: zodResolver(ledgerSchema), defaultValues: emptyValues(), mode: 'onBlur', reValidateMode: 'onChange' });
  const formWatch = form.watch;
  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'receipts' });
  const currentMonth = form.watch('month');
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const revision = useRef(0);
  const previews = useRef(new Set<string>());
  const reduced = useReducedMotion();

  const resetReport = useCallback(() => { revision.current += 1; setReport(null); setLedger(null); setReportError(null); setBusy(false); setLoadingReport(false); }, []);
  const resetRecord = useCallback(() => {
    resetReport(); for (const preview of previews.current) URL.revokeObjectURL(preview); previews.current.clear();
    form.reset(emptyValues()); replace([]); setUploadError(null); toast.success('Monthly record cleared.');
  }, [form, replace, resetReport]);
  const checkHealth = useCallback(async () => {
    try { const result = await api<Health>('/api/health'); setHealth(result); setHealthError(null); }
    catch (error) { setHealth(null); setHealthError(errorMessage(error)); }
  }, []);
  useEffect(() => { void checkHealth(); const interval = window.setInterval(() => { void checkHealth(); }, 30000); return () => window.clearInterval(interval); }, [checkHealth]);
  useEffect(() => () => { for (const preview of previews.current) URL.revokeObjectURL(preview); previews.current.clear(); }, []);
  useEffect(() => { const subscription = formWatch(() => { resetReport(); }); return () => subscription.unsubscribe(); }, [formWatch, resetReport]);

  const addExtraction = (data: Extraction, preview: string | null) => {
    const current = form.getValues('receipts');
    if (current.length >= 50) { if (preview) URL.revokeObjectURL(preview); throw new Error('A monthly record can include up to 50 receipts.'); }
    if (current.some(receipt => receipt.document_id === data.document_id)) { if (preview) URL.revokeObjectURL(preview); throw new Error('This exact receipt is already in the monthly record.'); }
    if (preview) previews.current.add(preview);
    append(toFormReceipt(data, preview)); resetReport(); setUploadError(null);
  };
  const onFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) { setUploadError('Choose a file smaller than 8 MB.'); return; }
    setUploadError(null); setBusy(true);
    try {
      let extracted: Extraction;
      if (file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
        const text = await file.text(); extracted = await api<Extraction>('/api/extract-text', jsonOptions({ text }));
      } else {
        const body = new FormData(); body.append('file', file); extracted = await api<Extraction>('/api/extract', { method: 'POST', body });
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      addExtraction(extracted, preview); toast.success('Receipt added', { description: 'Check the extracted fields against the original.' });
    } catch (error) { const message = errorMessage(error); setUploadError(message); toast.error('Could not add this receipt', { description: message }); }
    finally { setBusy(false); }
  };
  const onText = async (text: string) => {
    setBusy(true); setUploadError(null);
    try { addExtraction(await api<Extraction>('/api/extract-text', jsonOptions({ text })), null); toast.success('Receipt text added', { description: 'Check the suggested fields against the original.' }); return true; }
    catch (error) { const message = errorMessage(error); setUploadError(message); toast.error('Could not read receipt text', { description: message }); return false; }
    finally { setBusy(false); }
  };
  const onManual = () => { addExtraction({ document_id: crypto.randomUUID(), receipt_id: '', date: '', confirmed: false, items: [], source_text: 'Manual entry.', warnings: [] }, null); toast.success('Receipt form added'); document.getElementById(`rid-${fields.length}`)?.focus(); };
  const onCompare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setReportError(null); setReport(null);
    const valid = await form.trigger();
    if (!valid) { document.querySelector<HTMLElement>('[aria-invalid=true]')?.focus(); toast.error('Review the highlighted fields.'); return; }
    const values = form.getValues();
    if (!values.receipts.length) { toast.error('Add a receipt before comparing.'); return; }
    const version = ++revision.current; setBusy(true); setLoadingReport(true);
    try { const nextLedger = toLedger(values); const nextReport = await api<Report>('/api/reconcile', jsonOptions(nextLedger)); if (version !== revision.current) return; setReport(nextReport); setLedger(nextLedger); toast.success('Comparison ready'); }
    catch (error) { if (version === revision.current) { const message = errorMessage(error); setReportError(message); toast.error('Could not compare these records', { description: message }); } }
    finally { if (version === revision.current) { setBusy(false); setLoadingReport(false); } }
  };
  const loadSample = (kind: 'difference' | 'partial' | 'missing') => {
    for (const preview of previews.current) URL.revokeObjectURL(preview); previews.current.clear();
    const values = sampleValues(kind); revision.current += 1; form.reset(values); setReport(null); setLedger(null); setReportError(null); setUploadError(null); replace(values.receipts); setTimeout(() => { void form.handleSubmit(async valid => {
      const version = revision.current; setBusy(true); setLoadingReport(true);
      try { const sampleLedger = toLedger(valid); const sampleReport = await api<Report>('/api/reconcile', jsonOptions(sampleLedger)); if (version === revision.current) { setLedger(sampleLedger); setReport(sampleReport); } }
      catch (error) { if (version === revision.current) setReportError(errorMessage(error)); }
      finally { if (version === revision.current) { setBusy(false); setLoadingReport(false); } }
    })(); }, 0); toast.message('Synthetic sample loaded', { description: 'This example does not describe a real household.' });
  };
  const removeReceipt = (index: number) => { const receipt = form.getValues(`receipts.${index}`); if (receipt?.preview) { URL.revokeObjectURL(receipt.preview); previews.current.delete(receipt.preview); } remove(index); resetReport(); };

  return <WorkspaceShell hasRecords={fields.length > 0} onReset={resetRecord} onSamples={() => setSamplesOpen(true)}>
    <header className="space-y-4 border-b pb-8"><div className="flex flex-wrap items-center gap-3"><Badge>Monthly record</Badge>{health?.ocr && <Badge tone="success">Local image reader installed</Badge>}{health && <Badge>On this device</Badge>}</div><div className="space-y-3"><h1 className="text-2xl font-semibold tracking-tight sm:text-2xl">{monthLabel(currentMonth)}</h1><p className="max-w-2xl text-sm text-muted-foreground">Compare your entitlement, what each receipt records, and what you measured receiving.</p></div>{healthError && <ErrorState message={healthError} onRetry={() => { void checkHealth(); }} />}</header>
    <FormProvider {...form}><form noValidate onSubmit={onCompare} className="space-y-10">
      <section id="receipts" className="space-y-5" aria-labelledby="receipts-heading"><SectionHeader number="01" title="Receipts" description="Add a photo or enter the details yourself. Check every suggested field." count={fields.length} /><ReceiptUpload pending={busy} error={uploadError} onFile={file => { void onFile(file); }} onText={onText} onManual={onManual} />
        {fields.length === 0 ? <Card><CardContent><EmptyState icon={ClipboardList} title="No receipts in this record" description="Add a receipt above, or enter its details manually. You can also try a synthetic sample case." action={<Button variant="ghost" size="small" onClick={() => setSamplesOpen(true)}>View sample cases</Button>} /></CardContent></Card> : <div className="space-y-4" aria-label="Receipts for this month">{fields.map((field, index) => <motion.div key={field.id} initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}><ReceiptEditor index={index} onRemove={() => removeReceipt(index)} /></motion.div>)}</div>}
      </section>
      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_352px]"><section aria-label="Monthly comparison" className="min-w-0 space-y-4"><div className="flex items-start gap-3 rounded-md border bg-muted p-4"><Info className="size-4 mt-0.5" aria-hidden="true" /><p className="text-xs text-muted-foreground">A receipt amount is not a measurement. Enter the amount you actually received only after weighing it.</p></div><p className="flex items-center gap-3 text-xs text-muted-foreground"><FileText className="size-4" aria-hidden="true" />Your entries clear on refresh. Only a report you download is kept.</p></section><MonthlyContext busy={busy} /></div>
    </form></FormProvider>
    <div className="space-y-4 pt-2"><SectionHeader number="02" title="Comparison" description="Review the numbers with the receipt evidence and your measured amounts." /><Comparison report={report} ledger={ledger} pending={loadingReport} error={reportError} onRetry={() => { void form.handleSubmit(async values => { const version = ++revision.current; setLoadingReport(true); try { const nextLedger = toLedger(values); const nextReport = await api<Report>('/api/reconcile', jsonOptions(nextLedger)); if (version === revision.current) { setReport(nextReport); setLedger(nextLedger); setReportError(null); } } catch (error) { setReportError(errorMessage(error)); } finally { setLoadingReport(false); } })(); }} /></div>
    <SampleDialog open={samplesOpen} onOpenChange={setSamplesOpen} onSelect={loadSample} />
  </WorkspaceShell>;
}
