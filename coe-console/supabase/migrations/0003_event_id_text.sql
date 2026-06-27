-- ============================================================================
-- 0003_event_id_text.sql — switch sourcing_events.id from uuid to text
--
-- The frontend generates human-readable event IDs like "EVT-FY25-0001" and
-- "FY26-007"; uuid was the wrong choice. Run this in SQL Editor.
-- Safe only while sourcing_events is empty.
-- ============================================================================

alter table public.sourcing_events
  alter column id drop default,
  alter column id type text using id::text;
