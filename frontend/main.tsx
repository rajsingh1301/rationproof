import { cspNonce } from './theme-init';
import './styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { WorkspaceApp } from './workspace-app';
import { ErrorBoundary } from './components/error-boundary';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary><ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="rationproof-theme" nonce={cspNonce} enableColorScheme={false} scriptProps={{ type: 'application/json' }}>
      <WorkspaceApp />
      <Toaster position="bottom-right" gap={8} duration={5000} closeButton theme="system" richColors />
    </ThemeProvider></ErrorBoundary>
  </React.StrictMode>,
);
