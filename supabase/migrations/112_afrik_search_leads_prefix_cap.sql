-- Migration 112 — a lower-case class prefix of up to eight letters opens a
-- name (REQ-125, DEC-075; ETNI-2092, brief 16)
--
-- Why a new migration: 111 is applied on recette (merged with #1861, commit
-- 7ed4bc738) and an applied migration is never edited. This one, in pull
-- request #1864, re-issues `afrik_search_leads` with the same signature, the
-- same grants, the same SECURITY INVOKER posture and the same search_path.
-- Its body is 111's, line for line, but for one number: q.one_name admits a
-- lower-case class prefix of one to eight letters before the stem's capital,
-- where 111 admitted one to four. 111 stays as it was applied.
--
-- What 111 got wrong (the second review of pull request #1861). Its cap of
-- four letters dropped abakwaManala (PPL_NDEBELE_MANALA) and abakwaNdzundza
-- (PPL_NDEBELE_NDZUNDZA), the names the two Southern Ndebele peoples give
-- themselves (« abakwa- » means « those of the house of »: six lower-case
-- letters before the stem's capital). Both fiches cut cleanly at the slash
-- of « AmaNdebele / abakwaManala », yet the piece was dropped while their
-- exonyms (« Manala Ndebele », « Southern Ndebele ») still scored.
-- « abakwamanala » offered Gwandara first, through « Abakwa Riga », and never
-- the Manala: a name others gave outranked the name the people gives itself
-- (doctrine §1). Migration 110 did not score these two names either.
-- The cap was arbitrary. Over every people piece and every family-name
-- spelling, a cap of six, eight or twelve letters, or none, admits exactly
-- these two pieces and nothing else, so the choice of eight rests on no
-- other name; it keeps a bound, as 111 had one, and costs nothing today.
--
-- The rule, for a people (brief 16, decision 5), as this migration applies
-- it:
--   1. Its filed name, its self-appellation and each exonym are cut into
--      pieces at « , », « ; », the word « ou », and a slash only when it
--      stands between spaces (« Baganda / Ganda »). A slash inside a word is
--      part of a click spelling (« Hai//om », « G//ana ») and never cuts.
--      Nothing inside a bracket cuts, and each piece loses its trailing
--      bracket: « Baganda (sg. Muganda, pl. Abaganda) » is one piece,
--      Baganda.
--   2. A piece is one name when it has three words at most, made of letters
--      of any script with their accents (the combining marks U+0300 to
--      U+036F), hyphens, apostrophes, and the click marks ! | ǀ ǁ ǂ ǃ = / at
--      the start of a word or inside it; and when its first word opens on an
--      upper-case letter, a letter with no case (ǂ ǁ ǃ ǀ, a Ge'ez name),
--      click marks before a letter (« !Kung », « =|Hoa »), a class prefix
--      of one to eight lower-case letters before an upper-case one
--      (« amaXhosa », « isiNdebele », « vaKaranga », « abakwaManala »), or a
--      class prefix of one or two lower-case letters joined by a hyphen to a
--      lower-case one (« a-liyan », « be-liyan »). Anything else, a
--      lower-case word on its own, a digit, « pl. », a lone « = »,
--      guillemets or prose, is not a name and is never scored. The
--      hyphenated prefix stops at a lower-case letter: with any letter after
--      the hyphen it would also admit twelve « al- » spellings of family
--      names (« al-Mahdi »), which brief 16 leaves open.
--   3. Only those pieces are scored, and matched_form is the one that scored
--      best. The filed name is cut like the other fields and never stands in
--      for a piece that did not score.
-- A family name keeps its filed name as filed (« dos Santos », « al-Mahdi »)
-- and scores a recorded spelling only when it is one name: « da Costa » is
-- not. The pattern of rule 2 is written once, as q.one_name, and read by both
-- branches. Both patterns are those of the corpus model
-- (src/lib/search/__fixtures__/corpusNameModel.ts), whose tests run them over
-- every people fiche. Run by PostgreSQL 17's own regular expressions over
-- every people name field and recorded spelling, the two patterns as written
-- here give the model's 5,347 pieces exactly under the en_US.UTF-8, ICU and
-- builtin C.UTF-8 collations, and 264 fewer under C.
--
-- Measured with that model over the 659 people fiches, against 110 (111
-- scored 5,345 pieces; 112 adds abakwaManala and abakwaNdzundza, in two
-- fiches, and loses none):
--   - 3,668 (fiche, form) pairs are scored instead of 3,428: 309 pieces
--     gained in 159 fiches (Mukongo, Izon, Ijo, Dyulanke, Nǀhuki, ʼNǀohan,
--     vaKavango, be-liyan, abakwaManala, abakwaNdzundza, Hai//om scored
--     whole), 69 forms lost in 47. Of the 69, 14 are joined strings now
--     scored piece by piece, 13 are names of other peoples read from inside
--     a bracket of a group fiche (Wolof and Sereer under the Atlantic group,
--     Bété under the Kru group), 38 are prose or glosses, and 4 fail the
--     rule's letter (« Ju–ǂHoan » with an en dash, « Reer Hamar Gibil
--     Madow » and two filed names of four words or more). Every people
--     fiche keeps a scored piece of its filed name or of its
--     self-appellation. Every one that records a self-appellation
--     scores a piece of it, but for seven whose value describes the people
--     or packs a name with its gloss: the Atlantic, Benue-Congo, Gur and Kru
--     groups, the Bantu, Sawa and Harari.
--   - The 3,512 forms that 110 or the rule scores (lower-cased, each counted
--     once), typed as written: a lead is a typed form paired with a fiche,
--     and the three rows the function returns are compared. The rule gains
--     532 leads and loses 511. Of the 511, 376 still reach 0.2 through a
--     form the rule scores and are only pushed out of the three rows; 135 no
--     longer reach 0.2. Another 284 leads keep their fiche among the three
--     rows under another chip.
--   - « abakwamanala » gives the Manala first through abakwaManala (1.00),
--     above Gwandara (0.32); before, Gwandara was first. « abakwandzundza »
--     gives the Ndzundza first through abakwaNdzundza (1.00).
--   - A family name: of the 1,123 recorded spellings in the 776 family-name
--     fiches, 18 fail the rule. Eight were scored by 110 and no longer are:
--     « da Costa », « da Silva », « al Hawary », « al-Hawari »,
--     « al-Khaṭṭābī », « al-Nūbī », « al-Nur » and « rîfî ». Whether an
--     « al- » spelling is one name is not settled here (brief 16, rule 4);
--     these eight stay unscored until the operator decides. The other ten
--     equal their filed name, scored as filed, and lose nothing.
-- What ETNI-2135 covers, and what it does not. It gives each name of a
-- packed name field an entry of its own, moves a qualifier into the fiche's
-- prose, scores a people's spelling aliases under this same rule, and makes
-- the corpus check refuse a field with a slash, a semicolon, a comma or
-- « ou » between names. That rewrites « Gullah/Geechee » and « Drawi/Drawa »
-- (one piece each here, since their slash has no space), the packed glosses
-- (« Habitants du Burundi / peuple du Burundi », « … ; Garifuna au
-- singulier ») and the self-appellations of the seven fiches above. It
-- starts from this migration's body, the latest, under the next free number
-- after 112, and applies q.one_name to each spelling alias. Its check allows
-- four words where this rule allows three; it settles that by raising the
-- limit in its migration to four, so one limit governs both. It moves the
-- colon lists of the group fiches (PPL_SAHARIEN_MACRO: Zaghawa, Teda,
-- Kanembu; PPL_NGUNI: amaXhosa, emaSwati) into prose. This migration still
-- scores those pieces as forms of the group: « zagawa » ranks Peuples
-- Sahariens above Zaghawa, and « amaxosa » Nguni above Xhosa. It does not
-- cover, and no ticket tracks yet:
--   - a gloss that is a whole entry, opens on a capital and has three words
--     or fewer (« Peuples de l'eau », « Gens du Nil », « Omani de retour »,
--     « Central Sudanic languages »): its check allows it, and it passes this
--     rule;
--   - « Ju–ǂHoan » (an en dash) and « Reer Hamar Gibil Madow » (four words):
--     they fail this rule's letter, and its check accepts them as written
--     (with the four-word limit above, only the second would then score);
--   - the two long filed names: filed names are out of its scope;
--   - the Harari self-name in Ge'ez script, ጌ፞ይ ኡሱኣች: its mark U+135E is not
--     among the accents this rule reads, so it fails here even on its own;
--   - the Coptic self-name ⲣⲉⲙⲛ̀ⲭⲏⲙⲓ (PPL_COPTES): Coptic is written in lower
--     case, and a name in a script that has case must open on a capital, or
--     on a class prefix, to pass this rule. The Copts keep Aqbāṭ.
--
-- [[:alpha:]], [[:upper:]] and [[:lower:]] follow the database's character
-- type (ctype). Under a C ctype they know ASCII letters only, and every name
-- with an accent or a click letter (Bété, Fulɓe, ǂHoan) would silently stop
-- scoring. Verification 6 checks it; run it on recette after the merge and
-- on production before the Release.
--
-- Same signature as 084, 094, 110 and 111: CREATE OR REPLACE, no overload for
-- PostgREST to refuse. No table is added. Rollout: recette on merge,
-- production on Release.

CREATE OR REPLACE FUNCTION public.afrik_search_leads(
  p_q     TEXT DEFAULT NULL,
  p_limit INT  DEFAULT 3,
  p_lang  TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
WITH q AS (
  SELECT public.afrik_unaccent(lower(btrim(p_q))) AS exact_key,
         '^(?:(?![[:lower:]])[[:alpha:]]|[!|ǀǁǂǃ=/]+[[:alpha:]]|[[:lower:]]{1,8}[[:upper:]]|[[:lower:]]{1,2}-[[:lower:]])(?:[!|ǀǁǂǃ=/''’-]*[[:alpha:]\u0300-\u036f])*[''’-]*(?: +[!|ǀǁǂǃ=/''’-]*[[:alpha:]\u0300-\u036f](?:[!|ǀǁǂǃ=/''’-]*[[:alpha:]\u0300-\u036f])*[''’-]*){0,2}$'::text AS one_name
),
candidates AS (
  SELECT 'people'::text AS kind, p.id::text AS id, p.name_main AS name,
         (array_agg(form.value ORDER BY extensions.similarity(public.afrik_unaccent(lower(form.value)), q.exact_key) DESC, (form.value = p.name_main) DESC, form.value))[1] AS matched_form,
         max(
           extensions.similarity(
             public.afrik_unaccent(lower(form.value)), q.exact_key)
         ) AS similarity
  FROM public.afrik_peoples p
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT piece.value
    FROM (
      SELECT p.name_main AS value
      UNION ALL
      SELECT p.content #>> '{appellations,selfAppellation}'
      UNION ALL
      SELECT exonym
        FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(p.content #> '{appellations,exonyms}') = 'array'
               THEN p.content #> '{appellations,exonyms}'
               ELSE '[]'::jsonb END
        ) AS exonym
    ) field
    CROSS JOIN LATERAL regexp_split_to_table(field.value, '\s*(?:[,;]|\s/\s|\sou\s)\s*(?![^(]*\))') AS cut(value)
    CROSS JOIN LATERAL (
      SELECT btrim(regexp_replace(cut.value, '\s*\([^)]*\)\s*$', '')) AS value
    ) piece
    WHERE piece.value ~ q.one_name
  ) form
  WHERE length(q.exact_key) >= 3
  GROUP BY p.id, p.name_main

  UNION ALL

  SELECT 'country'::text AS kind, c.id::text AS id, localized.name,
         localized.name AS matched_form,
         extensions.similarity(
           public.afrik_unaccent(lower(localized.name)), q.exact_key) AS similarity
  FROM public.afrik_countries c
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT CASE WHEN p_lang = 'en'
                THEN COALESCE(NULLIF(c.name_en, ''), c.name_fr)
                ELSE c.name_fr END AS name
  ) localized
  WHERE length(q.exact_key) >= 3

  UNION ALL

  SELECT 'family'::text AS kind, lf.id::text AS id, localized.name,
         localized.name AS matched_form,
         extensions.similarity(
           public.afrik_unaccent(lower(localized.name)), q.exact_key) AS similarity
  FROM public.afrik_language_families lf
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT CASE WHEN p_lang = 'en'
                THEN COALESCE(NULLIF(lf.name_en, ''), lf.name_fr)
                ELSE lf.name_fr END AS name
  ) localized
  WHERE length(q.exact_key) >= 3

  UNION ALL

  SELECT 'patronyme'::text AS kind, p.id::text AS id, p.name_main AS name,
         (array_agg(form.value ORDER BY extensions.similarity(public.afrik_unaccent(lower(form.value)), q.exact_key) DESC, (form.value = p.name_main) DESC, form.value))[1] AS matched_form,
         max(
           extensions.similarity(
             public.afrik_unaccent(lower(form.value)), q.exact_key)
         ) AS similarity
  FROM public.afrik_patronymes p
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT recorded.value
    FROM (
      SELECT btrim(regexp_replace(raw.value, '\s*\([^)]*\)\s*$', '')) AS value,
             raw.filed
      FROM (
        SELECT p.name_main AS value, true AS filed
        UNION ALL
        SELECT spelling ->> 'spelling', false
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.content #> '{spellings}') = 'array'
                 THEN p.content #> '{spellings}'
                 ELSE '[]'::jsonb END
          ) AS spelling
      ) raw
    ) recorded
    WHERE recorded.value <> ''
      AND (recorded.filed OR recorded.value ~ q.one_name)
  ) form
  WHERE length(q.exact_key) >= 3
    AND left(public.afrik_unaccent(lower(form.value)), 1) = left(q.exact_key, 1)
  GROUP BY p.id, p.name_main
),
matched AS (
  SELECT * FROM candidates
  WHERE (kind <> 'patronyme' AND similarity >= 0.2)
     OR (kind = 'patronyme' AND similarity >= 0.4)
),
page AS (
  (SELECT * FROM matched
    WHERE kind <> 'patronyme'
    ORDER BY similarity DESC, name ASC, id ASC
    LIMIT COALESCE(p_limit, 3))
  UNION ALL
  (SELECT * FROM matched
    WHERE kind = 'patronyme'
    ORDER BY similarity DESC, name ASC, id ASC
    LIMIT COALESCE(p_limit, 3))
)
SELECT jsonb_build_object(
  'rows', COALESCE(
    (SELECT jsonb_agg(to_jsonb(page) ORDER BY page.similarity DESC,
                       page.name ASC, page.id ASC)
       FROM page),
    '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION public.afrik_search_leads(TEXT, INT, TEXT) IS
  'Near-miss leads (REQ-125). A trigram similarity scan. A people is scored on the pieces of its names that are one name, and on nothing else: its filed name, self-appellation and each exonym (content.appellations) are cut at « , », « ; », the word « ou » and a slash between spaces, never inside a bracket nor at a slash inside a word (« Hai//om » writes a click), and each piece loses its trailing bracket. A piece is one name when it has three words at most, made of letters of any script with their accents, hyphens, apostrophes and click marks, and opens on an upper-case letter, a letter with no case (ǂHoan), click marks before a letter (« !Kung »), a class prefix of up to eight lower-case letters before a capital (« amaXhosa », « abakwaManala ») or a class prefix of one or two lower-case letters joined by a hyphen to a lower-case one (« a-liyan »). « Baganda / Ganda » gives Baganda and Ganda; « pl. Abaganda) » and « suivant Abdoulaye Bathily » are never scored. A people is emitted under its filed name and named by the piece that scored best, never by its filed name in place of a piece; a people none of whose pieces scores is no lead. Countries and families score their name for p_lang (en | fr, default fr); these three kinds keep similarity >= 0.2. A family name (afrik_patronymes) scores the best of its filed name, as filed, and of its recorded spellings (content.spellings[].spelling) that are one name, among the forms that begin with the folded query''s first letter, keeps similarity >= 0.4 and is emitted under its filed name (DEC-075). Every row names matched_form, the form that scored (the filed name on a tie; a country or a family names its name), so a caller can show the form written like the query: « jarra » reaches Diarra through its spelling Jara. Returns {"rows": [{"kind", "id", "name", "matched_form", "similarity"}, ...]}: at most p_limit rows of peoples, countries and families, plus at most p_limit family names, ordered by similarity. A folded query shorter than 3 characters returns no rows. SECURITY INVOKER: reads only tables already published to anon. Migration 112, which supersedes migration 111: the same function, with a class prefix of up to eight lower-case letters where 111 allowed four.';

REVOKE ALL ON FUNCTION public.afrik_search_leads(TEXT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_leads(TEXT, INT, TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification (recette first, then production)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. The family-name branch answers as under 110:
--      SELECT public.afrik_search_leads('tchikaya', 3) -> 'rows';
--      -- expect PAT_TCHICAYA, "matched_form": "Tchicaya", at about 0.5, and
--      -- neither Tchalla nor Tchoumba
--      SELECT public.afrik_search_leads('jarra', 3) -> 'rows';
--      -- expect PAT_DIARRA, "name": "Diarra", "matched_form": "Jara", at about 0.57
--      SELECT public.afrik_search_leads('bukasa', 3) -> 'rows';
--      -- expect no "patronyme" row
--
--    A recorded spelling that is not one name is not scored:
--      SELECT public.afrik_search_leads('da costa', 3) -> 'rows';
--      -- expect no PAT_COSTA row: « da Costa » opens in lower case, and the
--      -- filed name Costa begins with another letter
--
-- 2. A people is scored piece by piece, and named by the piece that scored:
--      SELECT public.afrik_search_leads('pakhalas', 3) -> 'rows';
--      -- expect PPL_KOULANGO at about 0.73, "matched_form": "Pakhallas",
--      -- then PPL_DIOULA at about 0.23, "matched_form": "Dualas"
--      SELECT public.afrik_search_leads('mukongu', 3) -> 'rows';
--      -- expect PPL_KONGO first, at about 0.60, "matched_form": "Mukongo"
--      SELECT public.afrik_search_leads('dyoulanke', 3) -> 'rows';
--      -- expect PPL_DIOULA first, at about 0.58, "matched_form": "Dyulanke"
--      SELECT public.afrik_search_leads('aliyan', 3) -> 'rows';
--      -- expect PPL_BASSARI first, at about 0.50, "matched_form": "a-liyan",
--      -- the name the Bassari give themselves, above Alladian (about 0.33)
--      SELECT public.afrik_search_leads('abakwamanala', 3) -> 'rows';
--      -- expect PPL_NDEBELE_MANALA first, at 1.00, "matched_form":
--      -- "abakwaManala", above Gwandara (about 0.32); under 111 Gwandara
--      -- was first and the Manala was absent
--      SELECT public.afrik_search_leads('abakwandzundza', 3) -> 'rows';
--      -- expect PPL_NDEBELE_NDZUNDZA first, at 1.00, "matched_form":
--      -- "abakwaNdzundza"
--
-- 3. A piece that is not one name is never scored, and nothing cuts a click:
--      SELECT public.afrik_search_leads('bathilly', 3) -> 'rows';
--      -- expect no PPL_DIOULA row: « suivant Abdoulaye Bathily » is prose
--      SELECT public.afrik_search_leads('akokolemou', 3) -> 'rows';
--      -- expect no PPL_KUMAM row: « Kumam (ou Ikokolemu, Akokolemu) » is
--      -- one piece, Kumam
--      SELECT public.afrik_search_leads('zhuhoasi', 3) -> 'rows';
--      SELECT public.afrik_search_leads('haiom', 3) -> 'rows';
--      -- expect no "matched_form" Zhu, Hai or om: « Zhu/'hoasi » and
--      -- « Hai//om » are scored whole
--      SELECT public.afrik_search_leads('juhoansi', 3) -> 'rows';
--      -- expect PPL_JUHOANSI first, "matched_form": "Ju|'hoansi"
--      -- and in no row a "matched_form" holding a bracket, a comma, a
--      -- semicolon or « ou » between two names
--
-- 4. It stays far inside the anon statement timeout:
--      SET ROLE anon; EXPLAIN ANALYZE SELECT public.afrik_search_leads('kassabara', 3); RESET ROLE;
--      -- expect execution time well under 1 s
--
-- 5. A query shorter than 3 characters returns no rows:
--      SELECT public.afrik_search_leads('bt', 3);  -- {"rows": []}
--
-- 6. The letter classes know letters beyond ASCII (the database's ctype is
--    not C), so rule 2 keeps accented and click names:
--      SELECT (SELECT datctype FROM pg_database
--               WHERE datname = current_database()) AS ctype,
--             'Fulɓe' ~ '^[[:upper:]][[:alpha:]]+$',
--             'Ɓaka' ~ '^[[:upper:]][[:alpha:]]+$',
--             'Élé' ~ '^[[:upper:]][[:alpha:]]+$',
--             'Nǀhuki' ~ '^[[:upper:]][[:alpha:]]+$',
--             'ǂHoan' ~ '^(?![[:lower:]])[[:alpha:]]',
--             'amaXhosa' ~ '^(?![[:lower:]])[[:alpha:]]';
--      -- expect true, true, true, true, true, false; the ctype is shown for
--      -- the record, the six answers decide. Under a C ctype all six are
--      -- false: do not release then, the rule would drop names silently.
--      -- Checked before merge on a scratch PostgreSQL 17 with the
--      -- en_US.UTF-8, ICU and builtin C.UTF-8 collations (the expected
--      -- answers), and with C (all false).
