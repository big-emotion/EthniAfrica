-- REQ-196 / ARCH-028: project each fiche's shared nameHistory block.
--
-- One nullable jsonb column per named-subject table, written by
-- scripts/migrateAfrikToDatabase.ts from the block every fiche loader has
-- already parsed through the one shared schema
-- (src/lib/afrik/parsers/nameHistoryParser.ts). Null means the fiche declares
-- no block yet, which is the ordinary state while enrichment proceeds subject
-- by subject.
--
-- A sibling column rather than a key inside `content`: the block is the same
-- shape on every table, while `content` differs per table.
--
-- RLS: no new table. All five tables already have RLS enabled with a public
-- read policy and no anon write policy (019 for the afrik_* tables, 053 for
-- afrik_patronymes); a column added here inherits them, so anon reads the
-- block and cannot write it.
--
-- Places (dataset/source/afrik/lieux) have no table yet, so they get no
-- column here.

alter table public.afrik_peoples
  add column if not exists name_history jsonb;
alter table public.afrik_languages
  add column if not exists name_history jsonb;
alter table public.afrik_language_families
  add column if not exists name_history jsonb;
alter table public.afrik_countries
  add column if not exists name_history jsonb;
alter table public.afrik_patronymes
  add column if not exists name_history jsonb;

comment on column public.afrik_peoples.name_history is
  'Shared nameHistory block of the people fiche (REQ-196, ARCH-028); null when the fiche declares none.';
comment on column public.afrik_languages.name_history is
  'Shared nameHistory block of the language fiche (REQ-196, ARCH-028); null when the fiche declares none.';
comment on column public.afrik_language_families.name_history is
  'Shared nameHistory block of the language family fiche (REQ-196, ARCH-028); null when the fiche declares none.';
comment on column public.afrik_countries.name_history is
  'Shared nameHistory block of the country fiche (REQ-196, ARCH-028); null when the fiche declares none.';
comment on column public.afrik_patronymes.name_history is
  'Shared nameHistory block of the family-name fiche (REQ-196, ARCH-028); null when the fiche declares none.';
