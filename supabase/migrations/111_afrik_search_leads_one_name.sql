-- Migration 111 — a people lead is scored only on the pieces of its names
-- that are one name (REQ-125, DEC-075; ETNI-2092, brief 16)
--
-- Why a new migration: 110 is applied on recette (merged with #1835) and an
-- applied migration is never edited. This one re-issues `afrik_search_leads`
-- with the same signature, the same grants and the same SECURITY INVOKER
-- posture. Its people branch replaces 110's; its family-name branch tests a
-- recorded spelling by the same rule; the country and language-family
-- branches are 110's, line for line.
--
-- What 110's people branch got wrong (brief 16, ninth and tenth reviews). It
-- decided « one name » with a list of marks, over forms cut at commas only,
-- and it always scored the filed name.
--   - A self-name joined to another by a slash left the scan whole while the
--     filed name stayed: « Izon / Ijo », « Bakongo (pluriel) / Mukongo
--     (singulier) ». « mukongu » offered Tongu and Musgu, never Kongo. The
--     filed name was ranked above the name a people gives itself.
--   - A list of exonyms with no mark scored as one string and became a chip
--     (« Diula, Djula, Doula, Dualas, Dyoula, Dyulanke »), and prose cut from
--     a self-appellation scored too: « bathilly » reached the Dioula fiche
--     through « suivant Abdoulaye Bathily », a historian's name.
-- A first draft of the rule, never merged, cut at every slash and wanted an
-- upper-case first letter. That cut click names apart (« Hai//om » gave Hai,
-- « Zhu/'hoasi » Zhu, and « zhuhoasi » would have printed « La fiche
-- Ju|'hoansi donne le nom Zhu. ») and dropped the names peoples give
-- themselves in clicks (ǂHoan, Ju|'hoansi, ǃXoon), which left the ǂHoan and
-- the Ju|'hoansi reachable through exonyms only. The rule below keeps both.
-- The first version of this migration still dropped a-liyan and be-liyan,
-- the names the Bassari give themselves: under it « aliyan » offered
-- Alladian first and Bassari only through the exonym Biyan. Rule 2's last
-- opening, a hyphenated class prefix, keeps them.
--
-- The rule, for a people (brief 16, decision 5):
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
--      of one to four lower-case letters before an upper-case one
--      (« amaXhosa », « isiNdebele », « vaKaranga »), or a class prefix of
--      one or two lower-case letters joined by a hyphen to a lower-case one
--      (« a-liyan », « be-liyan »). Anything else, a lower-case word on its
--      own, a digit, « pl. », a lone « = », guillemets or prose, is not a
--      name and is never scored. The hyphenated prefix stops at a lower-case
--      letter: with any letter after the hyphen it would also admit twelve
--      « al- » spellings of family names (« al-Mahdi »), which brief 16
--      leaves open.
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
-- here give the model's 5,345 pieces exactly under the en_US.UTF-8, ICU and
-- builtin C.UTF-8 collations, and 264 fewer under C.
--
-- Measured with that model over the 659 people fiches, against 110:
--   - 3,666 (fiche, form) pairs are scored instead of 3,428: 307 pieces
--     gained in 159 fiches (Mukongo, Izon, Ijo, Dyulanke, Nǀhuki, ʼNǀohan,
--     vaKavango, be-liyan, Hai//om scored whole), 69 forms lost in 47. Of
--     the 69, 14 are joined strings now scored piece by piece, 13 are names
--     of other peoples read from inside a bracket of a group fiche (Wolof
--     and Sereer under the Atlantic group, Bété under the Kru group), 38 are
--     prose or glosses, and 4 fail the rule's letter (« Ju–ǂHoan » with an
--     en dash, « Reer Hamar Gibil Madow » and two filed names of four words
--     or more). Every people fiche keeps a scored piece of its filed name or
--     of its self-appellation. Every one that records a self-appellation
--     scores a piece of it, but for seven whose value describes the people
--     or packs a name with its gloss: the Atlantic, Benue-Congo, Gur and Kru
--     groups, the Bantu, Sawa and Harari.
--   - Over 3,511 forms typed as written, the top three rows gain 526 leads
--     and lose 506, 371 of them only pushed out by a newly scored, stronger
--     one; 285 leads keep their fiche under another chip.
-- What ETNI-2135 covers, and what it does not. It gives each name of a
-- packed name field an entry of its own, moves a qualifier into the fiche's
-- prose, scores a people's spelling aliases under this same rule, and makes
-- the corpus check refuse a field with a slash, a semicolon, a comma or
-- « ou » between names. That rewrites « Gullah/Geechee » and « Drawi/Drawa »
-- (one piece each here, since their slash has no space), the packed glosses
-- (« Habitants du Burundi / peuple du Burundi », « … ; Garifuna au
-- singulier ») and the self-appellations of the seven fiches above. It does
-- not cover, and no ticket tracks yet:
--   - a gloss that is a whole entry, opens on a capital and has three words
--     or fewer (« Peuples de l'eau », « Gens du Nil », « Omani de retour »,
--     « Central Sudanic languages »): its check allows it, and it passes this
--     rule;
--   - « Ju–ǂHoan » (an en dash) and « Reer Hamar Gibil Madow » (four words):
--     they fail this rule's letter, and its check accepts them as written;
--   - the two long filed names: filed names are out of its scope;
--   - the Harari self-name in Ge'ez script, ጌ፞ይ ኡሱኣች: its mark U+135E is not
--     among the accents this rule reads, so it fails here even on its own.
--
-- [[:alpha:]], [[:upper:]] and [[:lower:]] follow the database's character
-- type (ctype). Under a C ctype they know ASCII letters only, and every name
-- with an accent or a click letter (Bété, Fulɓe, ǂHoan) would silently stop
-- scoring. Verification 6 checks it; run it on recette after the merge and
-- on production before the Release.
--
-- Same signature as 084, 094 and 110: CREATE OR REPLACE, no overload for
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
         '^(?:(?![[:lower:]])[[:alpha:]]|[!|ǀǁǂǃ=/]+[[:alpha:]]|[[:lower:]]{1,4}[[:upper:]]|[[:lower:]]{1,2}-[[:lower:]])(?:[!|ǀǁǂǃ=/''’-]*[[:alpha:]\u0300-\u036f])*[''’-]*(?: +[!|ǀǁǂǃ=/''’-]*[[:alpha:]\u0300-\u036f](?:[!|ǀǁǂǃ=/''’-]*[[:alpha:]\u0300-\u036f])*[''’-]*){0,2}$'::text AS one_name
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
  'Near-miss leads (REQ-125). A trigram similarity scan. A people is scored on the pieces of its names that are one name, and on nothing else: its filed name, self-appellation and each exonym (content.appellations) are cut at « , », « ; », the word « ou » and a slash between spaces, never inside a bracket nor at a slash inside a word (« Hai//om » writes a click), and each piece loses its trailing bracket. A piece is one name when it has three words at most, made of letters of any script with their accents, hyphens, apostrophes and click marks, and opens on an upper-case letter, a letter with no case (ǂHoan), click marks before a letter (« !Kung »), a class prefix before a capital (« amaXhosa ») or a class prefix of one or two lower-case letters joined by a hyphen to a lower-case one (« a-liyan »). « Baganda / Ganda » gives Baganda and Ganda; « pl. Abaganda) » and « suivant Abdoulaye Bathily » are never scored. A people is emitted under its filed name and named by the piece that scored best, never by its filed name in place of a piece; a people none of whose pieces scores is no lead. Countries and families score their name for p_lang (en | fr, default fr); these three kinds keep similarity >= 0.2. A family name (afrik_patronymes) scores the best of its filed name, as filed, and of its recorded spellings (content.spellings[].spelling) that are one name, among the forms that begin with the folded query''s first letter, keeps similarity >= 0.4 and is emitted under its filed name (DEC-075). Every row names matched_form, the form that scored (the filed name on a tie; a country or a family names its name), so a caller can show the form written like the query: « jarra » reaches Diarra through its spelling Jara. Returns {"rows": [{"kind", "id", "name", "matched_form", "similarity"}, ...]}: at most p_limit rows of peoples, countries and families, plus at most p_limit family names, ordered by similarity. A folded query shorter than 3 characters returns no rows. SECURITY INVOKER: reads only tables already published to anon. Migration 111, which supersedes the people branch of 110.';

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
