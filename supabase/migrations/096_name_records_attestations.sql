-- REQ-189 / DEC-067: a name form carries its history — every time it was
-- written down, by whom, and the source at a printed page.
--
-- One jsonb array per form rather than a child table: the attestations are
-- read only with their form, on one fiche at a time, and they are validated
-- upstream (FR58-attestation refuses an attestation without a page) before
-- the loader writes them. A child table would add a join and an RLS policy
-- for a list nothing ever queries on its own.
--
-- Defaulting to an empty array keeps every existing row valid and lets the
-- API answer "no history yet" rather than "unknown".

alter table public.name_records
  add column if not exists attestations jsonb not null default '[]'::jsonb;

comment on column public.name_records.attestations is
  'Dated attestations of this form (REQ-189): formAsWritten, year, periodLabel, attestedBy, source{title, author, year, url, tier, page}.';
