import { Component, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from './ui/button';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="mx-auto max-w-xl space-y-6 px-6 py-16" role="alert">
      <CircleAlert className="size-6 text-danger" aria-hidden="true" />
      <h1 className="text-xl font-semibold">This page could not finish rendering</h1>
      <p className="text-sm text-muted-foreground">Reload to start a fresh record. Entries on this page will be cleared; reports you already downloaded are safe.</p>
      <Button variant="primary" onClick={() => window.location.reload()}>Reload RationProof</Button>
    </main>;
  }
}
