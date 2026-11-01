import { CircleAlert } from 'lucide-react';
import { Button } from './button';
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="flex items-start gap-3 rounded-md border border-danger/25 bg-danger-soft p-4 text-danger"><CircleAlert className="mt-0 size-5" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="break-words text-sm">{message}</p>{onRetry && <Button variant="ghost" className="mt-2 text-danger" onClick={onRetry}>Try again</Button>}</div></div>;
}
