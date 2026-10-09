-- REQ-196 / ARCH-028 / ETNI-2023: the name index reads the fiches, and
-- name_records retires.
--
-- After the noms/ records were folded into their fiches' nameHistory
-- (ETNI-2021), a fresh database no longer loaded them into name_records, so
-- forms only those records held (Futankooɓe, Fellata, Union Ibo) dropped out
-- of /v2/names and the Appellations nomenclature.
--
-- name_records had two writers left: the names derived from each people
-- fiche's appellations prose, and the family-name spellings. Both readers of
-- the index now read one projection instead:
--
--   afrik_peoples.name_index   jsonb array written by the people loader in
--                              the same upsert as name_history
--                              (src/lib/afrik/peopleNameIndex.ts): the
--                              block's names first, then the derived names
--                              the block does not already tell.
--   afrik_people_names         a view unpacking it one row per name, with the
--                              columns name_records exposed, so the forms,
--                              the type counts and the hub presence views
--                              keep their shape.
--
-- The name type and imposition are derived in TypeScript, once, rather than
-- re-derived here from the nameHistory jsonb: two derivations of the same
-- rule would drift.
--
-- RLS: no new table. afrik_peoples already has RLS with a public read policy
-- (019), which the column inherits; every view is security_invoker so the
-- reader's own RLS applies.

alter table public.afrik_peoples
  add column if not exists name_index jsonb;

comment on column public.afrik_peoples.name_index is
  'Name index of the people fiche: its nameHistory names, then the names derived from its appellations (REQ-196, ARCH-028). Written by the loader; null until the next load.';

create or replace view public.afrik_people_names
with (security_invoker = true) as
select
  p.id || ':name:' || (entry.position - 1) as id,
  p.id as entity_id,
  entry.name ->> 'nameText' as name_text,
  entry.name ->> 'nameType' as name_type,
  entry.name ->> 'origin' as origin,
  entry.name ->> 'languageOfOrigin' as language_of_origin,
  entry.name ->> 'meaning' as meaning,
  entry.name ->> 'periodLabel' as period_label,
  entry.name ->> 'imposedBy' as imposed_by,
  entry.name ->> 'impositionPeriod' as imposition_period,
  entry.name ->> 'whyProblematic' as why_problematic,
  entry.name ->> 'contemporaryUsage' as contemporary_usage,
  (entry.name ->> 'sortRank')::int as sort_rank,
  -- The expression name_records generated (migration 029), so a query
  -- matches the same names it used to.
  to_tsvector(
    'french',
    coalesce(entry.name ->> 'nameText', '') || ' ' ||
      coalesce(entry.name ->> 'meaning', '')
  ) as search_vector
from public.afrik_peoples p
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(p.name_index) = 'array' then p.name_index else '[]'::jsonb end
) with ordinality as entry(name, position);

comment on view public.afrik_people_names is
  'One row per name of a people, unpacked from afrik_peoples.name_index. Replaces name_records as the name index (REQ-196). See migration 101.';

grant select on public.afrik_people_names to anon, authenticated;

-- Same columns as migration 071; only the relation they read changes. Dropped
-- and recreated rather than replaced: language_of_origin was varchar(3) on
-- name_records and is text here, a type change `create or replace` refuses.
drop view if exists public.afrik_name_forms;
drop view if exists public.afrik_name_type_counts;

create view public.afrik_name_forms
with (security_invoker = true) as
select
  lower(afrik_unaccent(nr.name_text)) as form_key,
  mode() within group (order by nr.name_text) as display_name,
  array_agg(distinct nr.name_text order by nr.name_text) as spellings,
  array_agg(distinct nr.name_type::text) as name_types,
  count(distinct nr.entity_id)::int as bearer_count,
  jsonb_agg(distinct jsonb_build_object('id', p.id, 'name', p.name_main))
    filter (where p.id is not null) as bearers,
  bool_or(nr.imposed_by is not null) as has_imposed,
  max(nr.why_problematic) as why_problematic,
  min(nr.language_of_origin) as language_of_origin
from public.afrik_people_names nr
left join public.afrik_peoples p on p.id = nr.entity_id
group by lower(afrik_unaccent(nr.name_text));

comment on view public.afrik_name_forms is
  'One row per distinct name form (accent- and case-folded) across afrik_people_names, with the peoples bearing it. Backs the Appellations nomenclature; see migrations 071 and 101.';

grant select on public.afrik_name_forms to anon, authenticated;

create view public.afrik_name_type_counts
with (security_invoker = true) as
select
  nr.name_type::text as name_type,
  count(*)::int as record_count,
  count(*) filter (where nr.imposed_by is not null)::int as imposed_count
from public.afrik_people_names nr
group by nr.name_type;

comment on view public.afrik_name_type_counts is
  'Name counts per name_type, so the Appellations filter row can drop a chip the corpus cannot fill. See migrations 071 and 101.';

grant select on public.afrik_name_type_counts to anon, authenticated;

create or replace view public.hub_module_corpus_presence
with (security_invoker = true) as
select 'afrik_peoples'::text as data_source,
       exists (select 1 from afrik_peoples) as has_rows
union all
select 'afrik_countries',
       exists (select 1 from afrik_countries)
union all
select 'afrik_language_families',
       exists (select 1 from afrik_language_families)
union all
select 'afrik_languages',
       exists (select 1 from afrik_languages)
union all
select 'afrik_patronymes',
       exists (select 1 from afrik_patronymes)
union all
-- The names the Appellations atlas renders, as `names.ts#listNames` reads them.
select 'afrik_people_names',
       exists (select 1 from afrik_people_names)
union all
select 'migration_events',
       exists (select 1 from migration_events)
union all
select 'afrik_people_relations',
       exists (select 1 from afrik_people_relations)
union all
select 'quiz_questions',
       exists (select 1 from quiz_questions);

-- No CASCADE: a dependent this migration has not moved must fail the replay
-- rather than vanish with the table. Its policies, trigger and indexes go
-- with it; the trigger function and the enum are dropped explicitly.
drop table if exists public.name_records;
drop function if exists public.enforce_name_record_sources();
drop type if exists public.name_record_type;
