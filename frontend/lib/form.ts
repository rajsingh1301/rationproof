import { z } from 'zod';
import type { Extraction, Ledger } from './contracts';

const quantity = z.string().refine(value => value === '' || (/^\d+(\.\d{1,3})?$/.test(value) && Number(value) <= 10000), 'Use 0–10,000 kg with up to 3 decimal places.');
const receiptSchema = z.object({
  document_id: z.string().min(1),
  receipt_id: z.string().trim().min(1, 'Enter the receipt number.').max(80, 'Use up to 80 characters.'),
  date: z.string().refine(value => { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T12:00:00Z`); return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value); }, 'Enter a valid receipt date.'),
  confirmed: z.boolean(), source_text: z.string().max(20000),
  preview: z.string().nullable(), warnings: z.array(z.string()),
  items: z.array(z.object({ commodity: z.enum(['rice', 'wheat']), issued_kg: quantity, received_kg: quantity }))
    .min(1).max(2).refine(items => new Set(items.map(item => item.commodity)).size === items.length, 'Use one line per commodity.'),
});
export const ledgerSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Select a month.'),
  rice: quantity, wheat: quantity, entitlement_source: z.string().max(500),
  month_complete: z.boolean(), demo: z.boolean(), receipts: z.array(receiptSchema).max(50),
});
export type FormValues = z.infer<typeof ledgerSchema>;
export type FormReceipt = FormValues['receipts'][number];
export function emptyValues(): FormValues {
  const now = new Date();
  return { month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, rice: '', wheat: '', entitlement_source: '', month_complete: false, demo: false, receipts: [] };
}
export function toFormReceipt(data: Extraction, preview: string | null = null): FormReceipt {
  return { document_id: data.document_id, receipt_id: data.receipt_id, date: data.date, confirmed: false,
    source_text: data.source_text, warnings: data.warnings ?? [], preview,
    items: (data.items.length ? data.items : [{ commodity: 'rice' as const, issued_kg: null, received_kg: null }]).map(item => ({ ...item, issued_kg: item.issued_kg == null ? '' : String(item.issued_kg), received_kg: item.received_kg == null ? '' : String(item.received_kg) })),
  };
}
export function toLedger(values: FormValues): Ledger {
  const qty = (value: string) => value === '' ? null : value;
  return { month: values.month, entitlement: { rice: qty(values.rice), wheat: qty(values.wheat) }, entitlement_source: values.entitlement_source,
    month_complete: values.month_complete, demo: values.demo,
    receipts: values.receipts.map(receipt => ({ document_id: receipt.document_id, receipt_id: receipt.receipt_id, date: receipt.date, confirmed: receipt.confirmed, source_text: receipt.source_text,
      items: receipt.items.map(item => ({ commodity: item.commodity, issued_kg: qty(item.issued_kg), received_kg: qty(item.received_kg) })),
    })),
  };
}
export type SampleKind = 'cancellation' | 'difference' | 'partial' | 'missing';
export function sampleValues(kind: SampleKind): FormValues {
  if (kind === 'cancellation') return {
    month: '2026-11', rice: '20', wheat: '0', entitlement_source: 'Synthetic example entitlement — not an official record', month_complete: true, demo: true,
    receipts: ['5', '15'].map((received, index) => ({
      document_id: `demo-cancellation-${index}`, receipt_id: `DEMO-00${index + 1}`, date: `2026-11-0${index + 3}`, confirmed: true, preview: null, warnings: [],
      source_text: `SYNTHETIC DEMO RECEIPT\nReceipt ID: DEMO-00${index + 1}\nDate: 2026-11-0${index + 3}\nRice: 10 kg\nNot an official receipt.`,
      items: [{ commodity: 'rice', issued_kg: '10', received_kg: received }],
    })),
  };
  const issued = kind === 'partial' ? '15' : '25';
  return { month: '2026-11', rice: '25', wheat: '0', entitlement_source: 'Synthetic example entitlement — not an official record', month_complete: true, demo: true,
    receipts: [{ document_id: `demo-${kind}`, receipt_id: 'DEMO-001', date: '2026-11-03', confirmed: true, preview: null, warnings: [],
      source_text: `SYNTHETIC DEMO RECEIPT\nReceipt ID: DEMO-001\nDate: 2026-11-03\nRice: ${issued} kg\nNot an official receipt.`,
      items: [{ commodity: 'rice', issued_kg: issued, received_kg: kind === 'missing' ? '' : kind === 'partial' ? '15' : '20' }],
    }],
  };
}
