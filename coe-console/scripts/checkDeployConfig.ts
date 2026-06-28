import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

interface HeaderEntry {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

interface RewriteEntry {
  source: string;
  destination: string;
}

interface VercelConfig {
  headers?: HeaderEntry[];
  rewrites?: RewriteEntry[];
}

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as VercelConfig;

const globalHeaders = config.headers?.find((entry) => entry.source === '/(.*)');
assert.ok(globalHeaders, 'vercel.json must define global headers for /(.*).');

const headerMap = new Map(globalHeaders.headers.map((header) => [header.key.toLowerCase(), header.value]));
for (const requiredHeader of [
  'content-security-policy',
  'referrer-policy',
  'x-content-type-options',
  'x-frame-options',
  'permissions-policy',
  'strict-transport-security',
]) {
  assert.ok(headerMap.has(requiredHeader), `Missing required Vercel header: ${requiredHeader}`);
}

const csp = headerMap.get('content-security-policy') ?? '';
assert.match(csp, /default-src 'self'/, 'CSP must keep default-src self.');
assert.match(csp, /connect-src 'self' https:\/\/\*\.supabase\.co wss:\/\/\*\.supabase\.co/, 'CSP must allow Supabase HTTP and websocket endpoints.');
assert.match(csp, /frame-ancestors 'none'/, 'CSP must block framing.');

const hasSpaRewrite = config.rewrites?.some(
  (rewrite) => rewrite.source === '/(.*)' && rewrite.destination === '/index.html',
);
assert.ok(hasSpaRewrite, 'vercel.json must keep the SPA rewrite to /index.html.');

console.log('Deploy config check passed.');
