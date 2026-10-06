-- REQ-191 / DEC-068: what the people fiche's answer card reads for each form.
--
-- short_line     one sentence a reader understands without context
-- named_by       who gave the form: a people or an authority, never an author
-- origin_debated drives the « origine débattue » badge
-- used_in        languages in which the form is used today
-- pronunciation  the self-name's respelling, optional consented audio, its source
--
-- All nullable or defaulted, so every existing row stays valid and a fiche
-- without them renders as before. Validated upstream (FR59-answer) before the
-- loader writes them.

alter table public.name_records
  add column if not exists short_line text,
  add column if not exists named_by text,
  add column if not exists origin_debated boolean,
  add column if not exists used_in text[] not null default '{}',
  add column if not exists pronunciation jsonb;

comment on column public.name_records.short_line is
  'One-line answer for the fiche''s answer card (REQ-191), at most 120 characters.';
comment on column public.name_records.pronunciation is
  'Self-name pronunciation (REQ-191): respelling, audio {url, consent} or null, source.';
