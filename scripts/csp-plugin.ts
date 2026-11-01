import type { Plugin } from 'vite';

/** Attach the response nonce to CSS inserted by the two pinned UI libraries. */
export function nonceStyles(): Plugin {
  return {
    name: 'rationproof-style-nonce', enforce: 'pre',
    transform(code, id) {
      if (!/node_modules\/(sonner|vaul)\/dist\/index\.mjs(?:\?|$)/.test(id)) return;
      const marker = "let style = document.createElement('style')";
      if (!code.includes(marker)) throw new Error(`Review CSP integration for ${id}: style injector changed.`);
      return { code: code.replace(marker, `${marker}\n  const nonce = document.querySelector('meta[property="csp-nonce"]')?.nonce; if (nonce) style.setAttribute('nonce', nonce);`), map: null };
    },
  };
}
