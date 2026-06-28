// RLS smoke tests against a real Supabase test project.
//
// These tests are network-bound and skip automatically when the env vars are
// not provided, so local `npm test` keeps working without infrastructure.
//
// Required env (set in CI secrets or .env.test.local):
//   SUPABASE_TEST_URL                Project URL of a throwaway Supabase project
//   SUPABASE_TEST_ANON_KEY           anon public key
//   SUPABASE_TEST_USER_EMAIL         A pre-created non-admin user
//   SUPABASE_TEST_USER_PASSWORD      That user's password
//   SUPABASE_TEST_ADMIN_EMAIL        A pre-created user with profiles.role = 'admin'
//   SUPABASE_TEST_ADMIN_PASSWORD     That user's password
//
// Prepare the test project by running every migration in supabase/migrations
// in order. Insert at least one seeded event so `archived_event_visibility`
// has something to assert against.

import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const TEST_URL = process.env.SUPABASE_TEST_URL;
const TEST_ANON = process.env.SUPABASE_TEST_ANON_KEY;
const USER_EMAIL = process.env.SUPABASE_TEST_USER_EMAIL;
const USER_PASSWORD = process.env.SUPABASE_TEST_USER_PASSWORD;
const ADMIN_EMAIL = process.env.SUPABASE_TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SUPABASE_TEST_ADMIN_PASSWORD;

const isConfigured =
  !!TEST_URL && !!TEST_ANON && !!USER_EMAIL && !!USER_PASSWORD && !!ADMIN_EMAIL && !!ADMIN_PASSWORD;

const skipReason = 'SUPABASE_TEST_* env vars not configured; skipping RLS smoke tests.';

async function clientAs(email: string, password: string): Promise<SupabaseClient> {
  const c = createClient(TEST_URL!, TEST_ANON!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`);
  return c;
}

test('non-admin cannot read audit_log', { skip: !isConfigured ? skipReason : false }, async () => {
  const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
  const { data, error } = await userClient.from('audit_log').select('id').limit(1);
  // RLS denies the select silently: data is empty and error is null. We accept
  // either empty-result or an explicit policy error, but the row count must be 0.
  assert.ok(!data || data.length === 0, `expected no audit_log rows visible to non-admin (got ${data?.length})`);
  if (error) {
    assert.match(error.message, /row-level security|permission|policy/i);
  }
  await userClient.auth.signOut();
});

test('admin can read audit_log', { skip: !isConfigured ? skipReason : false }, async () => {
  const adminClient = await clientAs(ADMIN_EMAIL!, ADMIN_PASSWORD!);
  const { error } = await adminClient.from('audit_log').select('id').limit(1);
  assert.equal(error, null, `admin select on audit_log unexpectedly errored: ${error?.message}`);
  await adminClient.auth.signOut();
});

test(
  'non-admin cannot update an event they do not own',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    // Pick any seeded event (these have no requestor_id, so the user is not owner).
    const { data: events } = await userClient
      .from('sourcing_events')
      .select('id, status')
      .is('request_created_at', null)
      .limit(1);
    if (!events || events.length === 0) {
      // Nothing to assert against; treat as inconclusive rather than passing.
      throw new Error('Seed at least one non-request event in the test project to run this assertion.');
    }
    const target = events[0];
    const { error } = await userClient
      .from('sourcing_events')
      .update({ status: target.status === 'Planned' ? 'Live' : 'Planned' })
      .eq('id', target.id);
    // The update is silently filtered (PostgREST returns success with 0 rows
    // affected) OR errors with an RLS violation. Both are acceptable; what
    // matters is that the row is unchanged.
    const { data: after } = await userClient
      .from('sourcing_events')
      .select('status')
      .eq('id', target.id)
      .single();
    assert.equal(after?.status, target.status, 'non-admin should not be able to mutate a seeded event');
    if (error) {
      assert.match(error.message, /row-level security|permission|policy/i);
    }
    await userClient.auth.signOut();
  },
);

test(
  'non-admin cannot write to spend_baseline',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const { error } = await userClient
      .from('spend_baseline')
      .upsert({ fy: 'FY26', category: 'Resin', region: 'NA', value: 1 });
    // Either a policy error, or a silent no-op. We assert at minimum that no
    // row landed by reading back and not finding our sentinel.
    const { data } = await userClient
      .from('spend_baseline')
      .select('value')
      .eq('fy', 'FY26')
      .eq('category', 'Resin')
      .eq('region', 'NA')
      .maybeSingle();
    assert.notEqual(data?.value, 1, 'non-admin write to spend_baseline should not persist');
    if (error) {
      assert.match(error.message, /row-level security|permission|policy/i);
    }
    await userClient.auth.signOut();
  },
);

test(
  'non-admin cannot insert into client_errors with a forged actor_id',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const { error } = await userClient.from('client_errors').insert({
      source: 'error-boundary',
      message: 'rls-test forged actor',
      actor_id: '00000000-0000-0000-0000-000000000000',
    });
    assert.ok(error, 'inserting client_errors with foreign actor_id should be denied by RLS');
    if (error) {
      assert.match(error.message, /row-level security|permission|policy|violates/i);
    }
    await userClient.auth.signOut();
  },
);
