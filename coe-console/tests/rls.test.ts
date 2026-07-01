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
// in order. The tests create and clean up their own policy assertion rows.

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

async function insertAdminEvent(client: SupabaseClient) {
  const eventId = uniqueEventId('RLS-ADMIN-EVENT');
  const { error } = await client.from('sourcing_events').insert({
    id: eventId,
    name: 'RLS admin-owned policy test',
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
  });
  assert.equal(error, null, `creating admin event failed: ${error?.message}`);
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

async function insertAttachmentMetadata(
  client: SupabaseClient,
  eventId: string,
  storagePath: string,
  uploader: { id: string },
) {
  const { data, error } = await client
    .from('event_attachments')
    .insert({
      event_id: eventId,
      doc_type: 'RLS Test',
      file_name: 'rls-attachment.txt',
      storage_path: storagePath,
      content_type: 'text/plain',
      size_bytes: 19,
      uploaded_by: uploader.id,
    })
    .select('id')
    .single();
  assert.equal(error, null, `attachment metadata insert failed: ${error?.message}`);
  return data.id as string;
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

test('non-admin can read only their own profile', { skip: !isConfigured ? skipReason : false }, async () => {
  const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
  const user = await currentUser(userClient);
  const { data, error } = await userClient.from('profiles').select('id, email, role');

  assert.equal(error, null, `non-admin profile select errored: ${error?.message}`);
  assert.ok(data?.some((profile) => profile.id === user.id), 'user should see their own profile');
  assert.ok(
    data?.every((profile) => profile.id === user.id),
    `non-admin should not see other profiles (got ${data?.map((profile) => profile.email).join(', ')})`,
  );

  await userClient.auth.signOut();
});

test('admin can read profiles for operations', { skip: !isConfigured ? skipReason : false }, async () => {
  const adminClient = await clientAs(ADMIN_EMAIL!, ADMIN_PASSWORD!);
  const { data, error } = await adminClient
    .from('profiles')
    .select('email')
    .in('email', [USER_EMAIL!, ADMIN_EMAIL!]);

  assert.equal(error, null, `admin profile select errored: ${error?.message}`);
  assert.ok(data?.some((profile) => profile.email === USER_EMAIL), 'admin should see user profile');
  assert.ok(data?.some((profile) => profile.email === ADMIN_EMAIL), 'admin should see admin profile');

  await adminClient.auth.signOut();
});

test(
  'non-admin cannot read events they do not own',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const adminClient = await clientAs(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const eventId = await insertAdminEvent(adminClient);

    try {
      const { data, error } = await userClient.from('sourcing_events').select('id').eq('id', eventId);
      assert.equal(error, null, `non-admin event select errored: ${error?.message}`);
      assert.equal(data?.length ?? 0, 0, 'non-admin should not see admin/seeded events');
    } finally {
      await adminClient.from('sourcing_events').delete().eq('id', eventId);
      await userClient.auth.signOut();
      await adminClient.auth.signOut();
    }
  },
);

test(
  'non-admin cannot update an event they do not own',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const adminClient = await clientAs(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const eventId = await insertAdminEvent(adminClient);

    try {
      const { error } = await userClient
        .from('sourcing_events')
        .update({ status: 'Live' })
        .eq('id', eventId);
      // The update is silently filtered (PostgREST returns success with 0 rows
      // affected) OR errors with an RLS violation. Both are acceptable; what
      // matters is that the row is unchanged.
      const { data: after, error: readBackError } = await adminClient
        .from('sourcing_events')
        .select('status')
        .eq('id', eventId)
        .single();
      assert.equal(readBackError, null, `admin readback failed: ${readBackError?.message}`);
      assert.equal(after?.status, 'Planned', 'non-admin should not be able to mutate an admin event');
      if (error) {
        assert.match(error.message, /row-level security|permission|policy/i);
      }
    } finally {
      await adminClient.from('sourcing_events').delete().eq('id', eventId);
      await userClient.auth.signOut();
      await adminClient.auth.signOut();
    }
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
  'non-admin cannot read attachment metadata for an event they do not own',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const adminClient = await clientAs(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const admin = await currentUser(adminClient);
    const eventId = await insertAdminEvent(adminClient);
    const storagePath = await uploadTextAttachmentObject(adminClient, eventId);

    try {
      await insertAttachmentMetadata(adminClient, eventId, storagePath, admin);

      const { data, error } = await userClient
        .from('event_attachments')
        .select('id')
        .eq('storage_path', storagePath);
      assert.equal(error, null, `non-admin attachment metadata select errored: ${error?.message}`);
      assert.equal(data?.length ?? 0, 0, 'non-admin should not see unrelated attachment metadata');
    } finally {
      await adminClient.from('event_attachments').delete().eq('storage_path', storagePath);
      await adminClient.storage.from('request-attachments').remove([storagePath]);
      await adminClient.from('sourcing_events').delete().eq('id', eventId);
      await userClient.auth.signOut();
      await adminClient.auth.signOut();
    }
  },
);

test(
  'admin can read attachment metadata for operations',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const adminClient = await clientAs(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    const admin = await currentUser(adminClient);
    const eventId = await insertAdminEvent(adminClient);
    const storagePath = await uploadTextAttachmentObject(adminClient, eventId);

    try {
      const attachmentId = await insertAttachmentMetadata(adminClient, eventId, storagePath, admin);
      const { data, error } = await adminClient
        .from('event_attachments')
        .select('id')
        .eq('id', attachmentId)
        .single();

      assert.equal(error, null, `admin attachment metadata select errored: ${error?.message}`);
      assert.equal(data?.id, attachmentId);
    } finally {
      await adminClient.from('event_attachments').delete().eq('storage_path', storagePath);
      await adminClient.storage.from('request-attachments').remove([storagePath]);
      await adminClient.from('sourcing_events').delete().eq('id', eventId);
      await adminClient.auth.signOut();
    }
  },
);

test(
  'requestor can read metadata and storage object for their event',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const adminClient = await clientAs(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const admin = await currentUser(adminClient);
    const user = await currentUser(userClient);
    const eventId = await insertOwnRequestEvent(userClient, user);
    const storagePath = await uploadTextAttachmentObject(adminClient, eventId);

    try {
      const attachmentId = await insertAttachmentMetadata(adminClient, eventId, storagePath, admin);

      const { data: attachment, error: metadataError } = await userClient
        .from('event_attachments')
        .select('id')
        .eq('id', attachmentId)
        .single();
      assert.equal(metadataError, null, `requestor metadata select errored: ${metadataError?.message}`);
      assert.equal(attachment?.id, attachmentId);

      const { data: signedUrl, error: signedUrlError } = await userClient.storage
        .from('request-attachments')
        .createSignedUrl(storagePath, 60);
      assert.equal(signedUrlError, null, `requestor signed URL failed: ${signedUrlError?.message}`);
      assert.ok(signedUrl?.signedUrl, 'requestor should receive a signed attachment URL');
    } finally {
      await adminClient.from('event_attachments').delete().eq('storage_path', storagePath);
      await adminClient.storage.from('request-attachments').remove([storagePath]);
      await adminClient.from('sourcing_events').delete().eq('id', eventId);
      await userClient.auth.signOut();
      await adminClient.auth.signOut();
    }
  },
);

test(
  'non-admin cannot attach metadata to an event they do not own',
  { skip: !isConfigured ? skipReason : false },
  async () => {
    const adminClient = await clientAs(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    const userClient = await clientAs(USER_EMAIL!, USER_PASSWORD!);
    const user = await currentUser(userClient);
    const eventId = await insertAdminEvent(adminClient);

    const storagePath = await uploadTextAttachmentObject(userClient, eventId);
    try {
      const { error } = await userClient.from('event_attachments').insert({
        event_id: eventId,
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
      await adminClient.from('sourcing_events').delete().eq('id', eventId);
      await userClient.auth.signOut();
      await adminClient.auth.signOut();
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
