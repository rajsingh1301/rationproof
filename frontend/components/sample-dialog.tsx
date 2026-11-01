import { FlaskConical, ArrowRight, Scale, CircleHelp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent } from './ui/dialog';

const samples = [
  { id: 'difference' as const, icon: Scale, title: 'A 5 kg difference', text: 'The receipt says 25 kg. The household reports measuring 20 kg.', action: 'Load difference case' },
  { id: 'partial' as const, icon: ArrowRight, title: 'Partial collection', text: 'The receipt and measured amount are 15 kg. A 10 kg balance remains against the example entitlement.', action: 'Load balance case' },
  { id: 'missing' as const, icon: CircleHelp, title: 'Missing measurement', text: 'The receipt quantity is present, but the amount received is unknown.', action: 'Load incomplete case' },
];
export function SampleDialog({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (open: boolean) => void; onSelect: (kind: 'difference' | 'partial' | 'missing') => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent title="Use a sample case" description="These sample receipts are made up. They do not describe a real household or ration transaction."><div className="space-y-3">{samples.map(({ id, icon: Icon, title, text, action }) => <Card key={id} className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center"><Icon className="size-5 text-muted-foreground" aria-hidden="true" /><div className="min-w-0 flex-1 space-y-2"><h3 className="text-sm font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{text}</p></div><Button variant="secondary" size="small" onClick={() => { onSelect(id); onOpenChange(false); }}>{action}<ArrowRight aria-hidden="true" /></Button></Card>)}</div><p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><FlaskConical className="size-4" aria-hidden="true" />Every loaded case is marked as a synthetic sample.</p></DialogContent></Dialog>;
}
