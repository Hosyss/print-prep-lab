// Keep browser DOM types separate from the Worker runtime's DOM declarations.
type D1Database = import('@cloudflare/workers-types').D1Database;
type D1Result<T = unknown> = import('@cloudflare/workers-types').D1Result<T>;
interface Fetcher { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>; }
declare module 'cloudflare:workers' {
  export const env: { DB?: D1Database };
}
