export type Commodity = 'rice' | 'wheat';
export type Quantity = string | number | null;
export interface ReceiptItem { commodity: Commodity; issued_kg: Quantity; received_kg: Quantity }
export interface Receipt {
  document_id: string; receipt_id: string; date: string; confirmed: boolean;
  source_text: string; items: ReceiptItem[];
}
export interface Extraction extends Receipt { warnings: string[]; engine?: string; review_required?: boolean }
export interface Ledger {
  month: string; entitlement: { rice: Quantity; wheat: Quantity }; entitlement_source: string;
  month_complete: boolean; demo: boolean; receipts: Receipt[];
}
export interface Evidence { receipt_id: string; date: string; issued_kg: Quantity; received_kg: Quantity; difference_kg: Quantity; source_text: string }
export interface ReportRow {
  commodity: Commodity; entitlement_kg: Quantity; issued_kg: Quantity; received_kg: Quantity;
  difference_kg: Quantity; remaining_kg: Quantity; status: string; has_differences: boolean; evidence: Evidence[];
}
export interface Report {
  month: string; demo: boolean; status: 'incomplete' | 'needs_review' | 'balance_remaining' | 'records_agree';
  accepted_receipts: number; submitted_receipts: number; month_complete: boolean;
  entitlement_source: string; rows: ReportRow[];
  issues: { kind: string; receipt_id: string; message: string }[]; note: string; created_at: string;
}
export interface Health { status: string; ocr: string | null; storage: string; version: string }
