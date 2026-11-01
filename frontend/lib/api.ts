export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(path, options); }
  catch { throw new Error('The local server is unavailable. Keep the RationProof Terminal window open, then try again.'); }
  let result;
  try { result = await response.json(); }
  catch { throw new Error('The server returned an unreadable response. Try again.'); }
  if (!response.ok) {
    const detail = result.detail;
    const message = Array.isArray(detail)
      ? detail.map((e: { loc: (string | number)[]; msg: string }) => `${e.loc.slice(1).join(' / ')}: ${e.msg}`).join('; ')
      : typeof detail === 'string' ? detail : 'The request could not finish. Try again.';
    throw new Error(message);
  }
  return result as T;
}
export function jsonOptions(data: unknown): RequestInit { return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }; }
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'This action could not finish. Try again.'; }
