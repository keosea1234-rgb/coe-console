import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

async function insertChunks<T>(table: string, rows: T[], size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
    console.log(`Inserted ${Math.min(i + chunk.length, rows.length)} / ${rows.length} into ${table}`);
  }
}

loadLocalEnv();

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Add both to .env.local or export them before running npm run seed.');
  process.exit(1);
}

process.env.VITE_SUPABASE_URL ??= url;
process.env.VITE_SUPABASE_ANON_KEY ??= serviceRoleKey;

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const [
    { generateEvents, baselineAddr },
    { eventToInsert },
    { CATEGORIES },
    { FYS, REGIONS },
  ] = await Promise.all([
    import('../src/domain/generateEvents'),
    import('../src/domain/repository'),
    import('../src/domain/categories'),
    import('../src/domain/constants'),
  ]);

  console.log('Clearing existing demo events...');
  const { error: deleteEventsError } = await supabase
    .from('sourcing_events')
    .delete()
    .not('id', 'is', null);
  if (deleteEventsError) throw deleteEventsError;

  const events = generateEvents().map((event) => eventToInsert(event, null));
  console.log(`Seeding ${events.length} sourcing events...`);
  await insertChunks('sourcing_events', events);

  console.log('Clearing existing spend baseline...');
  const { error: deleteBaselineError } = await supabase
    .from('spend_baseline')
    .delete()
    .not('fy', 'is', null);
  if (deleteBaselineError) throw deleteBaselineError;

  const baselineRows = FYS.flatMap((fy) =>
    CATEGORIES.flatMap((category) =>
      REGIONS.map((region) => ({
        fy,
        category: category.name,
        region,
        value: Math.round(baselineAddr(fy, category, region)),
      })),
    ),
  );
  console.log(`Seeding ${baselineRows.length} spend baseline cells...`);
  await insertChunks('spend_baseline', baselineRows);

  console.log('Seed complete.');
}

main().catch((err) => {
  console.error('Seed failed.');
  console.error(err);
  process.exit(1);
});
