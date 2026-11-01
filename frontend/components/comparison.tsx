import { lazy, Suspense, useMemo, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { BarChart3, Check, CircleAlert, CircleHelp, Download, FileCheck2, FileText, Printer, ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Ledger, Report, ReportRow } from '@/lib/contracts';
import { cn, kg, commodityNames, monthLabel } from '@/lib/utils';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Dialog, DialogContent } from './ui/dialog';
import { LoadingState } from './ui/skeleton';
import { ErrorState } from './ui/error-state';
import { EmptyState } from './ui/empty-state';

const ComparisonChart = lazy(() => import('./comparison-chart'));
const helper = createColumnHelper<ReportRow>();
const statuses = {
  incomplete: { title: 'More details needed', text: 'Some quantities or confirmations are missing. These results cover the reviewed records only.', tone: 'warning', icon: CircleHelp },
  needs_review: { title: 'A difference needs checking', text: 'Check the individual receipts below. A difference is a question to verify, not proof of wrongdoing.', tone: 'warning', icon: CircleAlert },
  balance_remaining: { title: 'There is a balance to check', text: 'Your recorded and reported amounts match. Some of your entered entitlement remains to check or collect.', tone: 'neutral', icon: FileText },
  records_agree: { title: 'Your reviewed records agree', text: 'The receipts match what you reported receiving. This does not independently verify delivery.', tone: 'success', icon: Check },
} as const;

function ComparisonTable({ rows }: { rows: ReportRow[] }) {
  const columns = useMemo(() => [
    helper.accessor('commodity', { header: 'Commodity', cell: info => commodityNames[info.getValue()].split(' / ')[0] }),
    helper.accessor('entitlement_kg', { header: 'Entitlement', cell: info => kg(info.getValue()) }),
    helper.accessor('issued_kg', { header: 'On receipts', cell: info => kg(info.getValue()) }),
    helper.accessor('received_kg', { header: 'You received', cell: info => kg(info.getValue()) }),
    helper.accessor('difference_kg', { header: 'Net difference', cell: info => <span className={cn(info.row.original.has_differences && 'font-semibold text-warning')}>{kg(info.getValue())}</span> }),
    helper.accessor('remaining_kg', { header: 'Balance', cell: info => kg(info.getValue()) }),
  ], []);
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  return <>
    <div className="hidden md:block"><Table><caption className="sr-only">Monthly comparison in kilograms. Net difference is recorded minus user reported; balance is entered entitlement minus recorded.</caption><TableHead>{table.getHeaderGroups().map(group => <TableRow key={group.id}>{group.headers.map(header => <th key={header.id} scope="col" className="break-words px-4 py-4 font-semibold">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</TableRow>)}</TableHead><TableBody>{table.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id} className="tabular-nums">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div>
    <div className="divide-y md:hidden">{rows.map(row => <article key={row.commodity} className="space-y-4 py-4"><h3 className="text-base font-semibold">{commodityNames[row.commodity]}</h3><dl className="space-y-3">{[['Entitlement', row.entitlement_kg], ['On receipts', row.issued_kg], ['You received', row.received_kg], ['Net difference', row.difference_kg], ['Balance', row.remaining_kg]].map(([label, value]) => <div key={String(label)} className="flex items-start justify-between gap-4 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right tabular-nums">{kg(value)}</dd></div>)}</dl></article>)}</div>
  </>;
}

export function Comparison({ report, ledger, pending, error, onRetry }: { report: Report | null; ledger: Ledger | null; pending: boolean; error: string | null; onRetry: () => void }) {
  const [chartOpen, setChartOpen] = useState(false);
  const reduced = useReducedMotion();
  const download = () => {
    if (!report || !ledger) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ report, reviewed_inputs: ledger }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `rationproof-${report.month}${report.demo ? '-DEMO' : ''}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const print = () => {
    const details = [...document.querySelectorAll<HTMLDetailsElement>('#comparison details')];
    const previous = details.map(detail => detail.open); details.forEach(detail => { detail.open = true; });
    window.print(); details.forEach((detail, i) => { detail.open = previous[i]; });
  };
  const summary = report ? statuses[report.status] : null;
  const Icon = summary?.icon ?? FileCheck2;
  return <section id="comparison" aria-labelledby="comparison-heading">
    <Card><CardHeader><div className="space-y-1"><p className="text-xs text-muted-foreground">02 / Comparison</p><h2 id="comparison-heading" className="text-lg font-semibold">Your monthly report</h2></div>
      {report && <div className="no-print flex flex-wrap gap-2"><Button size="small" onClick={() => setChartOpen(true)} disabled={!report.rows.some(row => row.issued_kg !== null && row.received_kg !== null)}><BarChart3 aria-hidden="true" />Chart</Button><Button size="small" id="export-json" onClick={download}><Download aria-hidden="true" />Download</Button><Button size="small" id="print" onClick={print}><Printer aria-hidden="true" />Print</Button></div>}
    </CardHeader><CardContent>
      {pending ? <LoadingState label="Comparing your reviewed records…" /> : error ? <ErrorState message={error} onRetry={onRetry} /> : !report || !summary ? <EmptyState icon={FileCheck2} title="No comparison yet" description="Add a receipt, review its fields, and select Compare records. Your report will appear here." /> : <motion.div id="report" key={report.created_at} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="space-y-6" aria-live="polite">
        <div className={cn('flex items-start gap-3 rounded-md border p-4', summary.tone === 'warning' ? 'border-warning/25 bg-warning-soft text-warning' : summary.tone === 'success' ? 'border-success/25 bg-success-soft text-success' : 'bg-muted')}><Icon className="size-5" aria-hidden="true" /><div className="space-y-2"><h3 className="text-base font-semibold">{summary.title}</h3><p className="text-sm">{summary.text}</p></div></div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>{monthLabel(report.month)}</span><span>{report.accepted_receipts} of {report.submitted_receipts} receipts included</span>{report.demo && <Badge tone="warning">Synthetic sample</Badge>}</div>
        {report.issues.length > 0 && <ul className="list-disc space-y-2 rounded-md border border-warning/25 bg-warning-soft py-4 pl-8 pr-4 text-xs text-warning">{report.issues.map((issue, i) => <li key={i}><strong>{issue.receipt_id}:</strong> {issue.message}</li>)}</ul>}
        <ComparisonTable rows={report.rows} />
        <p className="text-xs text-muted-foreground">Net difference = recorded minus user-reported amount. Balance = entered entitlement minus recorded amount. Unknown values are never treated as zero.</p>
        <div className="space-y-4 border-t pt-6"><h3 className="text-sm font-semibold">Receipt-level evidence</h3>{report.rows.map(row => <div key={row.commodity} className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{commodityNames[row.commodity]}</p>{row.remaining_kg !== null && <span className="text-xs text-muted-foreground">{Number(row.remaining_kg) < 0 ? 'Recorded total exceeds entered entitlement' : `${kg(row.remaining_kg)} balance`}</span>}</div>{row.has_differences && <p className="text-xs text-warning">Check each receipt. Opposite differences can cancel in the monthly total.</p>}{!row.evidence.length && <p className="text-xs text-muted-foreground">No reviewed receipt for this commodity.</p>}{row.evidence.map((evidence, i) => <details className="group rounded-md border px-4" key={`${evidence.receipt_id}-${i}`}><summary className="flex min-h-12 list-none items-center justify-between gap-4 py-3"><span className="min-w-0 space-y-1"><span className="block break-words text-sm font-semibold">{evidence.receipt_id}</span><span className="block text-xs text-muted-foreground">{evidence.date} · {evidence.difference_kg === null ? 'Quantity missing' : Number(evidence.difference_kg) === 0 ? 'Amounts match' : `${kg(evidence.difference_kg)} recorded minus received`}</span></span><ChevronDown className="size-4 text-muted-foreground group-open:rotate-180" aria-hidden="true" /></summary><div className="space-y-3 border-t py-4"><p className="text-xs">Recorded: {kg(evidence.issued_kg)} · User reported: {kg(evidence.received_kg)}</p><pre className="rounded-md bg-muted p-4 text-xs leading-5">{evidence.source_text || 'Manual entry. Refer to the original receipt.'}</pre></div></details>)}</div>)}</div>
        <div className="space-y-2 border-t pt-4 text-xs text-muted-foreground"><p>{report.note}</p>{report.entitlement_source && <p>Entitlement source: {report.entitlement_source}</p>}<p>Created {new Date(report.created_at).toLocaleString('en-IN')}.</p></div>
      </motion.div>}
    </CardContent></Card>
    <Dialog open={chartOpen && !!report} onOpenChange={setChartOpen}><DialogContent title="Recorded and received" description="A visual comparison of the quantities in this report."><Suspense fallback={<LoadingState label="Loading chart…" />}>{chartOpen && report && <ComparisonChart rows={report.rows} />}</Suspense></DialogContent></Dialog>
  </section>;
}
