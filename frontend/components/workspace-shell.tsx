import { useEffect, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Command } from 'cmdk';
import { Drawer } from 'vaul';
import { ArrowUpRight, BookOpen, Check, ClipboardList, FileCheck2, FlaskConical, Menu, Moon, ReceiptText, Search, ShieldCheck, Sun, X, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogClose, DialogContent } from './ui/dialog';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface Props { children: ReactNode; onSamples: () => void; onReset: () => void; hasRecords: boolean }
export function WorkspaceShell({ children, onSamples, onReset, hasRecords }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [active, setActive] = useState('receipts');
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandsOpen(value => !value); } };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, []);
  const goTo = (id: string) => { setActive(id); setMenuOpen(false); setCommandsOpen(false); document.getElementById(id)?.scrollIntoView(); document.getElementById(`${id}-heading`)?.focus({ preventScroll: true }); };
  const themeToggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  const brand = <a href="#workspace" className="inline-flex min-h-10 items-center gap-3 text-base font-semibold"><ReceiptText className="size-6 text-accent" aria-hidden="true" />RationProof</a>;
  const navigation = <nav aria-label="Workspace" className="space-y-1">
    <p className="px-3 pb-3 text-xs text-muted-foreground">Your records</p>
    {[{ id: 'receipts', label: 'Monthly record', icon: ClipboardList }, { id: 'comparison', label: 'Comparison', icon: FileCheck2 }].map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => goTo(id)} aria-current={active === id ? 'page' : undefined} className={cn('feedback flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-3 text-sm', active === id ? 'bg-accent-soft font-semibold text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><Icon className="size-4" aria-hidden="true" />{label}</button>)}
    <div className="pb-4 pt-8"><p className="px-3 pb-3 text-xs text-muted-foreground">Tools</p><button type="button" className="feedback flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-muted" onClick={() => { setMenuOpen(false); onSamples(); }}><FlaskConical className="size-4" aria-hidden="true" />Sample cases</button><button type="button" className="feedback flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-muted" onClick={() => { setMenuOpen(false); setHelpOpen(true); }}><BookOpen className="size-4" aria-hidden="true" />How to read your report</button></div>
  </nav>;
  return <>
    <a href="#workspace" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-md bg-accent px-4 py-3 text-accent-foreground focus:translate-y-0">Skip to workspace</a>
    <aside className="no-print fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-surface px-4 py-6 lg:flex"><div className="mb-10 px-3">{brand}<p className="mt-2 pl-9 text-xs text-muted-foreground">Aapke ration ka hisaab</p></div>{navigation}<div className="mt-auto space-y-3 border-t px-3 pt-6"><ShieldCheck className="size-5 text-muted-foreground" aria-hidden="true" /><p className="text-xs text-muted-foreground">Your records stay on this device. Entries clear on refresh.</p><Badge>Local prototype</Badge></div></aside>
    <div className="print-content min-w-0 lg:ml-60">
      <header className="no-print sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b bg-surface px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu aria-hidden="true" /></Button><div className="lg:hidden">{brand}</div><div className="hidden items-center gap-3 text-xs lg:flex"><span className="text-muted-foreground">Workspace</span><span className="text-muted-foreground" aria-hidden="true">/</span><span>Monthly record</span></div></div>
        <div className="flex items-center gap-1"><Button variant="ghost" size="icon" aria-label="Search actions" onClick={() => setCommandsOpen(true)}><Search aria-hidden="true" /></Button><Button variant="ghost" size="icon" aria-label={resolvedTheme === 'dark' ? 'Use light theme' : 'Use dark theme'} onClick={themeToggle}>{resolvedTheme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</Button></div>
      </header>
      <main id="workspace" className="print-content mx-auto min-w-0 max-w-[1440px] space-y-8 px-4 py-8 sm:px-8 lg:py-10">{children}<footer className="no-print flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground"><p>A comparison of records. Not an official entitlement decision.</p><Button variant="ghost" size="small" disabled={!hasRecords} onClick={() => setResetOpen(true)}><Trash2 aria-hidden="true" />Clear this record</Button></footer></main>
    </div>
    <Drawer.Root open={menuOpen} onOpenChange={setMenuOpen} shouldScaleBackground={false} direction="left"><Drawer.Portal><Drawer.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)]" /><Drawer.Content className="overlay-shadow fixed inset-y-0 left-0 z-50 flex w-[min(320px,calc(100%-32px))] flex-col overflow-y-auto rounded-md border-r bg-surface p-6"><div className="mb-8 flex items-center justify-between gap-4"><Drawer.Title className="text-base font-semibold">RationProof</Drawer.Title><Drawer.Close asChild><Button variant="ghost" size="icon" aria-label="Close navigation"><X aria-hidden="true" /></Button></Drawer.Close></div><Drawer.Description className="sr-only">Navigate your monthly record and comparison.</Drawer.Description>{navigation}</Drawer.Content></Drawer.Portal></Drawer.Root>
    <Dialog open={commandsOpen} onOpenChange={setCommandsOpen}><DialogContent title="Find an action" description="Search this workspace. Open with Control or Command K."><Command className="min-w-0"><Command.Input autoFocus className="field mb-4" placeholder="Search actions…" aria-label="Search actions" /><Command.List className="max-h-80 overflow-y-auto"><Command.Empty className="py-8 text-sm text-muted-foreground">No matching actions.</Command.Empty>{[
      { name: 'Review receipts', icon: ClipboardList, action: () => goTo('receipts') },
      { name: 'View comparison', icon: FileCheck2, action: () => goTo('comparison') },
      { name: 'Try a synthetic sample', icon: FlaskConical, action: () => { setCommandsOpen(false); onSamples(); } },
      { name: 'Switch light or dark theme', icon: Sun, action: () => { themeToggle(); setCommandsOpen(false); } },
      { name: 'Understand this report', icon: BookOpen, action: () => { setCommandsOpen(false); setHelpOpen(true); } },
    ].map(({ name, icon: Icon, action }) => <Command.Item key={name} value={name} onSelect={action} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm data-[selected=true]:bg-muted"><Icon className="size-4 text-muted-foreground" aria-hidden="true" />{name}<ArrowUpRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" /></Command.Item>)}</Command.List></Command></DialogContent></Dialog>
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}><DialogContent title="Read the numbers with context" description="RationProof compares the records you review. It does not verify physical delivery."><div className="space-y-6">{[
      ['Entitlement', 'The allowance you entered from your official record. Leave it blank if you do not know it.'],
      ['Recorded and received', 'Recorded is what the receipt says. Received is the amount you personally measured.'],
      ['Net difference', 'Recorded minus received. Check individual receipts even when opposite differences cancel in the total.'],
      ['Balance', 'Entitlement minus recorded. A remaining balance can mean you have more to collect; it is not automatically a shortage.'],
    ].map(([title, text]) => <div key={title} className="space-y-2"><h3 className="text-sm font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{text}</p></div>)}<p className="flex items-start gap-3 border-t pt-4 text-xs text-muted-foreground"><Check className="size-4" aria-hidden="true" />Every receipt needs your review. Image reading can make mistakes; text and manual entry are also available.</p></div></DialogContent></Dialog>
    <Dialog open={resetOpen} onOpenChange={setResetOpen}><DialogContent title="Clear this monthly record?" description="This removes the receipts and comparison currently open on this device. You cannot undo this."><div className="flex flex-wrap justify-end gap-3"><DialogClose asChild><Button>Keep this record</Button></DialogClose><Button variant="danger" onClick={() => { onReset(); setResetOpen(false); }}>Clear monthly record</Button></div></DialogContent></Dialog>
  </>;
}
