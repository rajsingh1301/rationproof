import { z } from 'zod';

// The page CSP forbids eval. Without this, zod probes `new Function("")` when an
// object schema is created, which the browser reports as a CSP violation.
// Import `z` from here (not 'zod') so this runs before any schema is defined.
z.config({ jitless: true });

export { z };
