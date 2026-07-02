-- 0015_enterprise_esourcing_foundation.sql - foundational enterprise eSourcing model
--
-- Adds tenant, supplier, participation, approval, status history, and document
-- workflow tables. This is intentionally additive: the current console keeps
-- using sourcing_events directly until future workflow screens opt in.

-- ---- Core tenant model -----------------------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9][a-z0-9-]*$'),
  status      text not null default 'active' check (status in ('active', 'inactive')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.organizations is
  'Buyer organizations that scope enterprise eSourcing records.';

create table if not exists public.org_memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member' check (role in ('member', 'manager', 'admin')),
  status      text not null default 'active' check (status in ('active', 'invited', 'inactive')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

comment on table public.org_memberships is
  'Memberships that connect app users to buyer organizations.';

-- ---- Supplier master data --------------------------------------------------
create table if not exists public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  legal_name  text,
  status      text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, org_id)
);

comment on table public.suppliers is
  'Supplier master records scoped to a buyer organization.';

create table if not exists public.supplier_contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  supplier_id uuid not null,
  profile_id  uuid references public.profiles(id) on delete set null,
  email       text not null,
  full_name   text,
  title       text,
  status      text not null default 'active' check (status in ('active', 'invited', 'inactive')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (supplier_id, email),
  foreign key (supplier_id, org_id) references public.suppliers(id, org_id) on delete cascade
);

comment on table public.supplier_contacts is
  'Supplier-side contacts. profile_id is nullable until supplier portal accounts exist.';

-- ---- RFx participation and workflow ---------------------------------------
create table if not exists public.supplier_event_participation (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  event_id      text not null references public.sourcing_events(id) on delete cascade,
  supplier_id   uuid not null,
  status        text not null default 'invited'
                check (status in ('invited', 'accepted', 'declined', 'submitted', 'awarded', 'not_awarded', 'withdrawn')),
  invited_at    timestamptz,
  responded_at  timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (event_id, supplier_id),
  unique (id, org_id),
  foreign key (supplier_id, org_id) references public.suppliers(id, org_id) on delete cascade
);

comment on table public.supplier_event_participation is
  'Links suppliers to sourcing events and tracks invitation/response lifecycle.';

create table if not exists public.sourcing_event_status_history (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  event_id    text not null references public.sourcing_events(id) on delete cascade,
  old_status  text,
  new_status  text not null check (
    new_status in ('draft', 'pending_approval', 'approved', 'published', 'live', 'evaluation', 'awarded', 'cancelled', 'closed')
  ),
  note        text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.sourcing_event_status_history is
  'Append-friendly RFx lifecycle history for future workflow states.';

create table if not exists public.approval_requests (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  event_id      text references public.sourcing_events(id) on delete cascade,
  request_type  text not null check (request_type in ('event_launch', 'award', 'document_exception', 'other')),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  requester_id  uuid references public.profiles(id) on delete set null,
  approver_id   uuid references public.profiles(id) on delete set null,
  due_at        timestamptz,
  decided_at    timestamptz,
  decision_note text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.approval_requests is
  'Approval workflow requests for event launches, awards, and document exceptions.';

-- ---- Compliance documents --------------------------------------------------
create table if not exists public.document_requirements (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  event_id      text not null references public.sourcing_events(id) on delete cascade,
  supplier_id   uuid,
  name          text not null,
  description   text,
  required      boolean not null default true,
  status        text not null default 'open' check (status in ('open', 'waived', 'closed')),
  due_at        timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, org_id),
  foreign key (supplier_id, org_id) references public.suppliers(id, org_id) on delete cascade
);

comment on table public.document_requirements is
  'Event-level or supplier-specific document requirements for RFx compliance.';

create table if not exists public.document_submissions (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references public.organizations(id) on delete cascade,
  requirement_id           uuid not null,
  participation_id         uuid not null,
  supplier_id              uuid not null,
  submitted_by_contact_id  uuid references public.supplier_contacts(id) on delete set null,
  status                   text not null default 'submitted'
                           check (status in ('submitted', 'accepted', 'rejected', 'superseded')),
  file_name                text not null,
  storage_path             text not null unique,
  content_type             text,
  size_bytes               bigint not null check (size_bytes >= 0),
  reviewed_by              uuid references public.profiles(id) on delete set null,
  reviewed_at              timestamptz,
  reviewer_note            text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  foreign key (requirement_id, org_id) references public.document_requirements(id, org_id) on delete cascade,
  foreign key (participation_id, org_id) references public.supplier_event_participation(id, org_id) on delete cascade,
  foreign key (supplier_id, org_id) references public.suppliers(id, org_id) on delete cascade
);

comment on table public.document_submissions is
  'Supplier document submission metadata. Binary storage wiring can be added by the portal.';

-- ---- Indexes ---------------------------------------------------------------
create index if not exists org_memberships_org_idx
  on public.org_memberships (org_id, status);
create index if not exists org_memberships_user_idx
  on public.org_memberships (user_id, status);

create index if not exists suppliers_org_status_idx
  on public.suppliers (org_id, status);
create index if not exists suppliers_name_idx
  on public.suppliers (name);

create index if not exists supplier_contacts_supplier_idx
  on public.supplier_contacts (supplier_id, status);
create index if not exists supplier_contacts_profile_idx
  on public.supplier_contacts (profile_id)
  where profile_id is not null;
create index if not exists supplier_contacts_email_idx
  on public.supplier_contacts (email);

create index if not exists supplier_event_participation_event_idx
  on public.supplier_event_participation (event_id, status);
create index if not exists supplier_event_participation_supplier_idx
  on public.supplier_event_participation (supplier_id, status);
create index if not exists supplier_event_participation_org_idx
  on public.supplier_event_participation (org_id, status);

create index if not exists sourcing_event_status_history_event_idx
  on public.sourcing_event_status_history (event_id, created_at desc);
create index if not exists sourcing_event_status_history_org_idx
  on public.sourcing_event_status_history (org_id, created_at desc);

create index if not exists approval_requests_org_status_idx
  on public.approval_requests (org_id, status);
create index if not exists approval_requests_event_idx
  on public.approval_requests (event_id);
create index if not exists approval_requests_approver_idx
  on public.approval_requests (approver_id, status);

create index if not exists document_requirements_event_idx
  on public.document_requirements (event_id, status);
create index if not exists document_requirements_supplier_idx
  on public.document_requirements (supplier_id, status)
  where supplier_id is not null;

create index if not exists document_submissions_requirement_idx
  on public.document_submissions (requirement_id, created_at desc);
create index if not exists document_submissions_participation_idx
  on public.document_submissions (participation_id, status);
create index if not exists document_submissions_supplier_idx
  on public.document_submissions (supplier_id, status);

-- ---- updated_at triggers ---------------------------------------------------
drop trigger if exists organizations_touch_updated_at on public.organizations;
create trigger organizations_touch_updated_at
  before update on public.organizations
  for each row execute function public.touch_updated_at();

drop trigger if exists org_memberships_touch_updated_at on public.org_memberships;
create trigger org_memberships_touch_updated_at
  before update on public.org_memberships
  for each row execute function public.touch_updated_at();

drop trigger if exists suppliers_touch_updated_at on public.suppliers;
create trigger suppliers_touch_updated_at
  before update on public.suppliers
  for each row execute function public.touch_updated_at();

drop trigger if exists supplier_contacts_touch_updated_at on public.supplier_contacts;
create trigger supplier_contacts_touch_updated_at
  before update on public.supplier_contacts
  for each row execute function public.touch_updated_at();

drop trigger if exists supplier_event_participation_touch_updated_at on public.supplier_event_participation;
create trigger supplier_event_participation_touch_updated_at
  before update on public.supplier_event_participation
  for each row execute function public.touch_updated_at();

drop trigger if exists sourcing_event_status_history_touch_updated_at on public.sourcing_event_status_history;
create trigger sourcing_event_status_history_touch_updated_at
  before update on public.sourcing_event_status_history
  for each row execute function public.touch_updated_at();

drop trigger if exists approval_requests_touch_updated_at on public.approval_requests;
create trigger approval_requests_touch_updated_at
  before update on public.approval_requests
  for each row execute function public.touch_updated_at();

drop trigger if exists document_requirements_touch_updated_at on public.document_requirements;
create trigger document_requirements_touch_updated_at
  before update on public.document_requirements
  for each row execute function public.touch_updated_at();

drop trigger if exists document_submissions_touch_updated_at on public.document_submissions;
create trigger document_submissions_touch_updated_at
  before update on public.document_submissions
  for each row execute function public.touch_updated_at();

-- ---- RLS helper functions --------------------------------------------------
create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_memberships m
    where m.org_id = target_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_supplier_contact(target_supplier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.supplier_contacts c
    where c.supplier_id = target_supplier_id
      and c.profile_id = auth.uid()
      and c.status = 'active'
  );
$$;

create or replace function public.can_read_document_requirement(target_requirement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.document_requirements r
    where r.id = target_requirement_id
      and (
        (r.supplier_id is not null and public.is_supplier_contact(r.supplier_id))
        or exists (
          select 1
          from public.supplier_event_participation p
          where p.org_id = r.org_id
            and p.event_id = r.event_id
            and public.is_supplier_contact(p.supplier_id)
        )
      )
  );
$$;

create or replace function public.can_submit_document(
  target_requirement_id uuid,
  target_participation_id uuid,
  target_supplier_id uuid,
  target_contact_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.supplier_contacts c
    join public.supplier_event_participation p
      on p.supplier_id = c.supplier_id
    join public.document_requirements r
      on r.org_id = p.org_id
     and r.event_id = p.event_id
    where c.id = target_contact_id
      and c.supplier_id = target_supplier_id
      and c.profile_id = auth.uid()
      and c.status = 'active'
      and p.id = target_participation_id
      and p.supplier_id = target_supplier_id
      and p.status in ('invited', 'accepted', 'submitted')
      and r.id = target_requirement_id
      and r.status = 'open'
      and (r.supplier_id is null or r.supplier_id = target_supplier_id)
  );
$$;

create or replace function public.can_read_document_submission(target_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.document_submissions s
    where s.id = target_submission_id
      and public.is_supplier_contact(s.supplier_id)
  );
$$;

-- ---- Enable RLS ------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.org_memberships enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_contacts enable row level security;
alter table public.supplier_event_participation enable row level security;
alter table public.sourcing_event_status_history enable row level security;
alter table public.approval_requests enable row level security;
alter table public.document_requirements enable row level security;
alter table public.document_submissions enable row level security;

-- ---- Policies --------------------------------------------------------------
drop policy if exists "organizations_read_scoped" on public.organizations;
create policy "organizations_read_scoped"
  on public.organizations for select
  to authenticated
  using (public.is_admin() or public.is_org_member(id));

drop policy if exists "organizations_manage_admin" on public.organizations;
create policy "organizations_manage_admin"
  on public.organizations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "org_memberships_read_scoped" on public.org_memberships;
create policy "org_memberships_read_scoped"
  on public.org_memberships for select
  to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.is_org_member(org_id)
  );

drop policy if exists "org_memberships_manage_admin" on public.org_memberships;
create policy "org_memberships_manage_admin"
  on public.org_memberships for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "suppliers_read_scoped" on public.suppliers;
create policy "suppliers_read_scoped"
  on public.suppliers for select
  to authenticated
  using (
    public.is_admin()
    or public.is_org_member(org_id)
    or public.is_supplier_contact(id)
  );

drop policy if exists "suppliers_manage_admin" on public.suppliers;
create policy "suppliers_manage_admin"
  on public.suppliers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "supplier_contacts_read_scoped" on public.supplier_contacts;
create policy "supplier_contacts_read_scoped"
  on public.supplier_contacts for select
  to authenticated
  using (
    public.is_admin()
    or public.is_org_member(org_id)
    or profile_id = auth.uid()
  );

drop policy if exists "supplier_contacts_manage_admin" on public.supplier_contacts;
create policy "supplier_contacts_manage_admin"
  on public.supplier_contacts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "supplier_event_participation_read_scoped" on public.supplier_event_participation;
create policy "supplier_event_participation_read_scoped"
  on public.supplier_event_participation for select
  to authenticated
  using (
    public.is_admin()
    or public.is_org_member(org_id)
    or public.is_supplier_contact(supplier_id)
  );

drop policy if exists "supplier_event_participation_manage_admin" on public.supplier_event_participation;
create policy "supplier_event_participation_manage_admin"
  on public.supplier_event_participation for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "sourcing_event_status_history_read_scoped" on public.sourcing_event_status_history;
create policy "sourcing_event_status_history_read_scoped"
  on public.sourcing_event_status_history for select
  to authenticated
  using (public.is_admin() or public.is_org_member(org_id));

drop policy if exists "sourcing_event_status_history_manage_admin" on public.sourcing_event_status_history;
create policy "sourcing_event_status_history_manage_admin"
  on public.sourcing_event_status_history for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "approval_requests_read_scoped" on public.approval_requests;
create policy "approval_requests_read_scoped"
  on public.approval_requests for select
  to authenticated
  using (
    public.is_admin()
    or requester_id = auth.uid()
    or approver_id = auth.uid()
    or public.is_org_member(org_id)
  );

drop policy if exists "approval_requests_manage_admin" on public.approval_requests;
create policy "approval_requests_manage_admin"
  on public.approval_requests for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "document_requirements_read_scoped" on public.document_requirements;
create policy "document_requirements_read_scoped"
  on public.document_requirements for select
  to authenticated
  using (
    public.is_admin()
    or public.is_org_member(org_id)
    or public.can_read_document_requirement(id)
  );

drop policy if exists "document_requirements_manage_admin" on public.document_requirements;
create policy "document_requirements_manage_admin"
  on public.document_requirements for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "document_submissions_read_scoped" on public.document_submissions;
create policy "document_submissions_read_scoped"
  on public.document_submissions for select
  to authenticated
  using (
    public.is_admin()
    or public.is_org_member(org_id)
    or public.can_read_document_submission(id)
  );

drop policy if exists "document_submissions_insert_supplier_contact" on public.document_submissions;
create policy "document_submissions_insert_supplier_contact"
  on public.document_submissions for insert
  to authenticated
  with check (
    public.is_admin()
    or public.can_submit_document(requirement_id, participation_id, supplier_id, submitted_by_contact_id)
  );

drop policy if exists "document_submissions_manage_admin" on public.document_submissions;
create policy "document_submissions_manage_admin"
  on public.document_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "document_submissions_delete_admin" on public.document_submissions;
create policy "document_submissions_delete_admin"
  on public.document_submissions for delete
  to authenticated
  using (public.is_admin());

-- ---- Audit triggers --------------------------------------------------------
drop trigger if exists organizations_audit_log on public.organizations;
create trigger organizations_audit_log
  after insert or update or delete on public.organizations
  for each row execute function public.write_audit_log();

drop trigger if exists org_memberships_audit_log on public.org_memberships;
create trigger org_memberships_audit_log
  after insert or update or delete on public.org_memberships
  for each row execute function public.write_audit_log();

drop trigger if exists suppliers_audit_log on public.suppliers;
create trigger suppliers_audit_log
  after insert or update or delete on public.suppliers
  for each row execute function public.write_audit_log();

drop trigger if exists supplier_contacts_audit_log on public.supplier_contacts;
create trigger supplier_contacts_audit_log
  after insert or update or delete on public.supplier_contacts
  for each row execute function public.write_audit_log();

drop trigger if exists supplier_event_participation_audit_log on public.supplier_event_participation;
create trigger supplier_event_participation_audit_log
  after insert or update or delete on public.supplier_event_participation
  for each row execute function public.write_audit_log();

drop trigger if exists sourcing_event_status_history_audit_log on public.sourcing_event_status_history;
create trigger sourcing_event_status_history_audit_log
  after insert or update or delete on public.sourcing_event_status_history
  for each row execute function public.write_audit_log();

drop trigger if exists approval_requests_audit_log on public.approval_requests;
create trigger approval_requests_audit_log
  after insert or update or delete on public.approval_requests
  for each row execute function public.write_audit_log();

drop trigger if exists document_requirements_audit_log on public.document_requirements;
create trigger document_requirements_audit_log
  after insert or update or delete on public.document_requirements
  for each row execute function public.write_audit_log();

drop trigger if exists document_submissions_audit_log on public.document_submissions;
create trigger document_submissions_audit_log
  after insert or update or delete on public.document_submissions
  for each row execute function public.write_audit_log();
