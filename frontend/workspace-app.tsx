import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';
import type { Extraction, Health, Ledger, Report } from '@/lib/contracts';
import { api, errorMessage, jsonOptions } from '@/lib/api';
import { emptyValues, FormValues, type SampleKind, ledgerSchema, sampleValues, toFormReceipt, toLedger } from '@/lib/form';
import { RequestLane } from '@/lib/requests';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  return <div className="space-y-2"><div className="flex flex-wrap items-center gap-3"><p className="text-xs text-muted-foreground">{number} /</p>{count !== undefined && <Badge>{count} {Number(count) === 1 ? 'receipt' : 'receipts'}</Badge>}</div><div className="space-y-1"><h2 tabIndex={-1} className="text-xl font-semibold tracking-tight" id={`${title.toLowerCase().replaceAll(' ', '-')}-heading`}>{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div></div>;
}

export function WorkspaceApp() {
  const form = useForm<FormValues>({ resolver: zodResolver(ledgerSchema), defaultValues: emptyValues(), mode: 'onTouched', reValidateMode: 'onChange' });
  const formWatch = form.watch;
  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'receipts' });
  const currentMonth = form.watch('month');
  const isDemo = form.watch('demo');
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingSample, setPendingSample] = useState<SampleKind | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const uploads = useRef(new RequestLane());
  const comparisons = useRef(new RequestLane());
  const previews = useRef(new Set<string>());
  const reduced = useReducedMotion();

  const resetReport = useCallback(() => {
    comparisons.current.cancel(); setReport(null); setLedger(null); setReportError(null); setLoadingReport(false);
  }, []);
  const cancelUploads = () => { uploads.current.cancel(); setUploading(false); setUploadError(null); };
  const clearPreviews = () => { for (const preview of previews.current) URL.revokeObjectURL(preview); previews.current.clear(); };
  const resetRecord = () => {
    cancelUploads(); resetReport(); clearPreviews(); form.reset(emptyValues()); replace([]);
    toast.success('Monthly record cleared.');
  };
  const checkHealth = useCallback(async () => {
    try { const result = await api<Health>('/api/health'); setHealth(result); setHealthError(null); }
    catch (error) { setHealth(null); setHealthError(errorMessage(error)); }
  }, []);
  useEffect(() => { void checkHealth(); const interval = window.setInterval(() => { void checkHealth(); }, 30000); return () => window.clearInterval(interval); }, [checkHealth]);
  useEffect(() => { const urls = previews.current; const uploadLane = uploads.current; const compareLane = comparisons.current; return () => { uploadLane.cancel(); compareLane.cancel(); for (const url of urls) URL.revokeObjectURL(url); urls.clear(); }; }, []);
  useEffect(() => { const subscription = formWatch(() => { resetReport(); }); return () => subscription.unsubscribe(); }, [formWatch, resetReport]);

  const addExtraction = (data: Extraction, preview: string | null) => {
    const current = form.getValues('receipts');
    if (current.length >= 50) { if (preview) URL.revokeObjectURL(preview); throw new Error('A monthly record can include up to 50 receipts.'); }
    if (current.some(receipt => receipt.document_id === data.document_id)) { if (preview) URL.revokeObjectURL(preview); throw new Error('This exact receipt is already in the monthly record.'); }
    if (preview) previews.current.add(preview);
    if (data.source_text.includes('SYNTHETIC DEMO RECEIPT')) form.setValue('demo', true);
    append(toFormReceipt(data, preview)); resetReport(); setUploadError(null);
  };
  const extract = async (path: string, options: RequestInit, file?: File): Promise<boolean> => {
    const request = uploads.current.start(); setUploadError(null); setUploading(true);
    try {
      const data = await api<Extraction>(path, { ...options, signal: request.signal });
      if (!uploads.current.current(request)) return false;
      const preview = file?.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      addExtraction(data, preview);
      toast.success('Receipt added', { description: 'Check the fields against the original.' });
      return true;
    } catch (error) {
      if (uploads.current.current(request)) setUploadError(errorMessage(error));
      return false;
    } finally {
      if (uploads.current.current(request)) { uploads.current.finish(request); setUploading(false); void checkHealth(); }
    }
  };
  const onFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) { setUploadError('Choose a file smaller than 8 MB.'); return; }
    const body = new FormData(); body.append('file', file);
    void extract('/api/extract', { method: 'POST', body }, file);
  };
  const onText = (text: string) => extract('/api/extract-text', jsonOptions({ text }));
  const onManual = () => {
    try {
      const index = form.getValues('receipts').length;
      addExtraction({ document_id: crypto.randomUUID(), receipt_id: '', date: '', confirmed: false, items: [], source_text: 'Manual entry.', warnings: [] }, null);
      requestAnimationFrame(() => document.getElementById(`rid-${index}`)?.focus());
    } catch (error) { setUploadError(errorMessage(error)); }
  };
  const compareValues = async (values: FormValues) => {
    if (!values.receipts.length) { toast.error('Add a receipt before comparing.'); return; }
    const request = comparisons.current.start(); setReportError(null); setReport(null); setLedger(null); setLoadingReport(true);
    try {
      const nextLedger = toLedger(values);
      const nextReport = await api<Report>('/api/reconcile', { ...jsonOptions(nextLedger), signal: request.signal });
      if (!comparisons.current.current(request)) return;
      setReport(nextReport); setLedger(nextLedger); toast.success('Comparison ready');
      requestAnimationFrame(() => { document.getElementById('comparison-heading')?.focus(); });
    } catch (error) {
      if (comparisons.current.current(request)) setReportError(errorMessage(error));
    } finally {
      if (comparisons.current.current(request)) { comparisons.current.finish(request); setLoadingReport(false); }
    }
  };
  const compare = form.handleSubmit(compareValues, () => {
    resetReport(); document.querySelector<HTMLElement>('[aria-invalid=true]')?.focus(); toast.error('Review the highlighted fields.');
  });
  const onCompare = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void compare(event); };
  const loadSample = (kind: SampleKind) => {
    cancelUploads(); resetReport(); clearPreviews();
    const values = sampleValues(kind); form.reset(values); replace(values.receipts);
    setPendingSample(null);
    // Compare after field-array subscribers have processed the reset.
    requestAnimationFrame(() => { void compareValues(form.getValues()); });
    toast.message('Synthetic sample loaded');
  };
  const selectSample = (kind: SampleKind) => {
    if (form.getValues('receipts').length || form.formState.isDirty || uploading) setPendingSample(kind);
    else loadSample(kind);
  };
  const removeReceipt = (index: number) => { const receipt = form.getValues(`receipts.${index}`); if (receipt?.preview) { URL.revokeObjectURL(receipt.preview); previews.current.delete(receipt.preview); } remove(index); resetReport(); };

  return <WorkspaceShell hasRecords={fields.length > 0 || uploading || form.formState.isDirty} onReset={resetRecord} onSamples={() => setSamplesOpen(true)}>
    <header className="no-print space-y-4 border-b pb-8"><div className="flex flex-wrap items-center gap-3"><Badge>Monthly record</Badge>{isDemo && <Badge tone="warning">Synthetic sample</Badge>}{health?.ocr && <Badge tone={health.ocr_runtime?.state === 'failed' ? 'warning' : 'neutral'}>{health.ocr_runtime?.state === 'ready' ? 'Last image read succeeded' : health.ocr_runtime?.state === 'failed' ? 'Image reader unavailable · use text' : 'Image reader installed · unverified'}</Badge>}{health && <Badge>On this device</Badge>}</div><div className="space-y-3"><h1 className="text-2xl font-semibold tracking-tight sm:text-2xl">{monthLabel(currentMonth)}</h1><p className="max-w-2xl text-sm text-muted-foreground">Compare your entitlement, what each receipt records, and what you measured receiving.</p></div>{healthError && <ErrorState message={healthError} onRetry={() => { void checkHealth(); }} />}</header>
    <FormProvider {...form}><form noValidate onSubmit={onCompare} className="no-print grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_352px]">
      <section id="receipts" className="space-y-5" aria-labelledby="receipts-heading"><SectionHeader number="01" title="Receipts" description="Add a photo or enter the details yourself. Check every suggested field." count={fields.length} /><ReceiptUpload pending={uploading} error={uploadError} onFile={onFile} onText={onText} onManual={onManual} />
        {fields.length === 0 ? <Card><CardContent><EmptyState icon={ClipboardList} title="No receipts in this record" description="Add a receipt above, or enter its details manually. You can also try a synthetic sample case." action={<Button variant="ghost" size="small" onClick={() => setSamplesOpen(true)}>View sample cases</Button>} /></CardContent></Card> : <div className="space-y-4" aria-label="Receipts for this month">{fields.map((field, index) => <motion.div key={field.id} initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}><ReceiptEditor index={index} onRemove={() => removeReceipt(index)} /></motion.div>)}</div>}
      </section>
      <MonthlyContext busy={loadingReport} disabled={uploading} />
    </form></FormProvider>
    <Comparison report={report} ledger={ledger} pending={loadingReport} error={reportError} onRetry={() => { void compare(); }} />
    <SampleDialog open={samplesOpen} onOpenChange={setSamplesOpen} onSelect={selectSample} />
    <Dialog open={pendingSample !== null} onOpenChange={open => { if (!open) setPendingSample(null); }}><DialogContent title="Replace this record with a sample?" description="Your current entries will be removed. Download your comparison first if you want to keep it."><div className="flex flex-wrap justify-end gap-3"><Button onClick={() => setPendingSample(null)}>Keep my record</Button><Button variant="primary" onClick={() => { if (pendingSample) loadSample(pendingSample); }}>Load sample</Button></div></DialogContent></Dialog>
  </WorkspaceShell>;
}
