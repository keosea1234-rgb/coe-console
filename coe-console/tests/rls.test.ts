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
import { randomUUID } from 'node:crypto';
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

async function currentUser(client: SupabaseClient): Promise<{ id: string; email: string }> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email) {
    throw new Error(`Unable to load signed-in user: ${error?.message ?? 'missing user'}`);
  }
  return { id: data.user.id, email: data.user.email };
}

function uniqueEventId(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

async function insertOwnRequestEvent(client: SupabaseClient, user: { id: string; email: string }) {
  const eventId = uniqueEventId('RLS-ATTACH');
  const { error } = await client.from('sourcing_events').insert({
    id: eventId,
    name: 'RLS attachment policy test',
    fy: 'FY26',
    category: 'Resins',
    subcategory: 'PE',
    region: 'NA',
    regions: ['NA'],
    type: 'RFQ',
    event_types: ['RFQ'],
    status: 'Planned',
    addressable: 1,
    sourced: 0,
    savings: 0,
    start_date: '2026-03-15',
    requestor: user.email,
    requestor_id: user.id,
    request_created_at: new Date().toISOString(),
  });
  assert.equal(error, null, `creating own request event failed: ${error?.message}`);
  return eventId;
}

async function uploadTextAttachmentObject(client: SupabaseClient, eventId: string) {
  const path = `${eventId}/${randomUUID()}.txt`;
  const { error } = await client.storage
    .from('request-attachments')
    .upload(path, new Blob(['rls attachment test'], { type: 'text/plain' }), {
      contentType: 'text/plain',
      upsert: false,
    });
  assert.equal(error, null, `storage upload failed: ${error?.message}`);
  return path;
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
  'non-admin can attach an owned storage object to their own request event',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const user = await currentUser(userClient);
    const eventId = await insertOwnRequestEvent(userClient, user);
    const storagePath = await uploadTextAttachmentObject(userClient, eventId);

    try {
      const { error } = await userClient.from('event_attachments').insert({
        event_id: eventId,
        doc_type: 'RLS Test',
        file_name: 'rls-attachment.txt',
        storage_path: storagePath,
        content_type: 'text/plain',
        size_bytes: 19,
        uploaded_by: user.id,
      });
      assert.equal(error, null, `own request attachment insert failed: ${error?.message}`);
    } finally {
      await userClient.from('event_attachments').delete().eq('storage_path', storagePath);
      await userClient.storage.from('request-attachments').remove([storagePath]);
      await userClient.from('sourcing_events').delete().eq('id', eventId);
      await userClient.auth.signOut();
    }
  },
);

test(
  'non-admin cannot attach metadata to an event they do not own',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const user = await currentUser(userClient);
    const { data: events, error: selectError } = await userClient
      .from('sourcing_events')
      .select('id')
      .is('request_created_at', null)
      .limit(1);
    assert.equal(selectError, null, `seeded event lookup failed: ${selectError?.message}`);
    if (!events || events.length === 0) {
      throw new Error('Seed at least one non-request event in the test project to run this assertion.');
    }

    const storagePath = await uploadTextAttachmentObject(userClient, `RLS-FORGED-${randomUUID().slice(0, 8)}`);
    try {
      const { error } = await userClient.from('event_attachments').insert({
        event_id: events[0].id,
        doc_type: 'RLS Test',
        file_name: 'forged-event.txt',
        storage_path: storagePath,
        content_type: 'text/plain',
        size_bytes: 19,
        uploaded_by: user.id,
      });
      if (!error) {
        await userClient.from('event_attachments').delete().eq('storage_path', storagePath);
      }
      assert.ok(error, 'inserting attachment metadata for an unowned event should be denied by RLS');
      assert.match(error.message, /row-level security|permission|policy|violates/i);
    } finally {
      await userClient.storage.from('request-attachments').remove([storagePath]);
      await userClient.auth.signOut();
    }
  },
);

test(
  'non-admin cannot attach metadata for a storage object they did not upload',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const user = await currentUser(userClient);
    const eventId = await insertOwnRequestEvent(userClient, user);
    const missingStoragePath = `${eventId}/${randomUUID()}-missing.txt`;

    try {
      const { error } = await userClient.from('event_attachments').insert({
        event_id: eventId,
        doc_type: 'RLS Test',
        file_name: 'missing-object.txt',
        storage_path: missingStoragePath,
        content_type: 'text/plain',
        size_bytes: 19,
        uploaded_by: user.id,
      });
      if (!error) {
        await userClient.from('event_attachments').delete().eq('storage_path', missingStoragePath);
      }
      assert.ok(error, 'inserting attachment metadata without an owned storage object should be denied by RLS');
      assert.match(error.message, /row-level security|permission|policy|violates/i);
    } finally {
      await userClient.from('sourcing_events').delete().eq('id', eventId);
      await userClient.auth.signOut();
    }
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
