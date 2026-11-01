export const cspNonce = document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]')?.nonce;
// Radix scroll-lock uses get-nonce's documented global fallback.
Object.assign(globalThis, { __webpack_nonce__: cspNonce });
try {
  const theme = localStorage.getItem('rationproof-theme');
  if (theme === 'dark' || ((!theme || theme === 'system') && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
} catch { /* Theme preference is optional; storage restrictions must not block the app. */ }
