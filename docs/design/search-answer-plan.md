# Plan — the answer page: six blocks, optional fiche fields, frozen mockup v11

> Versioned on 2026-10-06 (lot 0) so sessions that only read the repository can follow it. Written in French, as validated by the operator; the frozen mockup it refers to is in `docs/design/mockups/search-answer/`, the contract types in `src/lib/search/answer.ts`.

## Contexte

EthniAfrica répond à une question : **d'où vient ce nom ?** La page de résultats actuelle empile jusqu'à 16 blocs (8 800 px pour « peul »), son verdict ne répond pas (« Nous documentons ce nom »), le badge « Référencée · voir les sources » est répété après chaque phrase, et la répartition géographique n'arrive pas à la page. L'opérateur a validé le 2026-10-06 une maquette (https://claude.ai/artifact/53thPpv2nKxPXRb1VXyM7m, 7 réponses + 1 filtre actif) et ces règles :

- Filtres en onglets **sous le champ de recherche** : « Tout » = la réponse ; Shorts / Récits / Images / Jeux / Fiches **dynamiques** (affichés seulement s'il y a du contenu, avec leur nombre, jamais 0).
- « Tout » = six blocs dans l'ordre : **Ce que c'est · D'où vient le nom · Ses noms · Où (graphe) · Et maintenant · Sources (une ligne)**, puis bouton fiche, puis invitation à corriger.
- **Rien en dur** : chaque information vient de sa source (fiche via l'API, registre des productions, endpoint companions) ; tout texte d'interface vient des dictionnaires de copy FR+EN.
- Un bloc sans donnée ne s'affiche pas ; seule exception, un manque utile dit en une ligne (patronyme sans chiffres).
- Origine affichée automatiquement (coupée à 2–3 phrases + « Lire la suite »), **sauf quand l'origine est débattue** (voir règle ci-dessous). Une réponse relue (`nameAnswers`) prime toujours sur l'affichage automatique. Bantou traité en mythe à défaire, ton léger.
- Accueil : sous-titre « Votre nom de famille, celui d'un peuple, d'une langue ou d'un pays : d'où il vient, comment on l'appelle ailleurs, et où il vit aujourd'hui. »

**Accroche et question de rebond (décision opérateur 2026-10-06, option b)** : la maquette porte des phrases rédigées (« Une langue née du commerce sur le fleuve Congo… », « Comment une langue de marché est-elle devenue celle de deux capitales ? », l'encadré Bantou « Autrement dit… »). Un modèle de phrase ne les reproduit pas. Donc deux **champs facultatifs dans la fiche** — `content.searchAnswer.lead` (≤ 220 caractères) et `content.searchAnswer.followUp` (≤ 120 caractères, finit par « ? ») — affichés quand ils existent, **avec le modèle de phrase (copy) en repli** quand ils sont absents. Pas de texte en dur : il vit dans la fiche, soumis aux règles de registre comme toute prose lue par le lecteur.

**Référence visuelle** : la maquette est publique (https://claude.ai/artifact/53thPpv2nKxPXRb1VXyM7m) mais elle bouge ; les agents travaillent sur la **copie figée v11 versionnée dans le dépôt au lot 0** (`docs/design/mockups/search-answer/`), seule lisible par la CI, les tests de charte et les agents hors session.

**Règle de coupe (revue 2026-10-06, bloquant éditorial)** : couper un texte qui expose d'abord une lecture puis sa contestation présenterait la première comme acquise (ex. `dataset/source/afrik/langues/lin.json`, `whyProblematic` ouvre sur Meeuwis). Donc : quand l'origine porte plusieurs récits (`accounts.length > 1`) ou un statut débattu (`claimStatus` contested/debated, `originDebated`, `classification_status` contested), **chaque récit est montré par sa première phrase, côte à côte, avant « Lire la suite »** ; jamais un seul récit coupé. La coupe à 2–3 phrases ne s'applique qu'à une origine à récit unique non débattue.

Méthode : TDD, KISS, **mobile d'abord à 320 et 430 px, puis tablette 768–1199 px, puis desktop ≥ 1200 px**, un worktree + une PR vers `recette` par lot.

## Architecture (5 lignes)

1. Nouvelle fonction pure `readAnswer(type, content, root, extras)` dans `src/lib/search/answer.ts`, qui étend `readNaming` (`src/lib/search/naming.ts:456`) et produit un `SearchAnswer` à six blocs par sujet.
2. Appelée côté serveur dans `projectRows` (`src/api/v2/services/searchService.ts:34`), à côté de `readNaming` ; les agrégats (répartition langue/famille via les peuples, nombre de peuples d'un pays, `short_line`) viennent d'une requête en plus.
3. L'API ajoute un champ **optionnel** `answer` sur chaque ligne (non cassant pour `openapi:diff`) ; pour un mot publié, le handler ajoute `data.wordAnswers` depuis le registre des productions — **au niveau de l'enveloppe, pas des lignes**, car « pharaon » peut n'avoir aucune ligne de résultat.
4. `mapSearchEnvelope` (`src/lib/search/searchEnvelope.ts:309`) porte `answer` dans `SearchResult.answer` **et décode `wordAnswers`** ; `RecherchePageContent.tsx` le garde dans un état à côté de `nameAnswers` (`:135`, `:215`) et le passe à `SearchFeed` (`:736`). Une recherche sans aucune fiche mais avec un mot publié rend la page « mot », pas l'aveu « Nous ne connaissons pas ce nom ».
5. `SearchFeed` affiche les onglets en haut ; « Tout » rend les six blocs.

## Source de chaque bloc

| Bloc              | Peuple                                                                                            | Pays                                                                              | Langue                                                                                                                                                                             | Famille                                                                                                                               | Patronyme                                    | Mot publié                              |
| ----------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| Ce que c'est      | `content.searchAnswer.lead` si présent, sinon modèle de phrase (copy)                             | idem                                                                              | idem                                                                                                                                                                               | idem                                                                                                                                  | idem                                         | `answer.lead` du registre, sinon modèle |
| D'où vient le nom | `appellations.originOfExonyms`                                                                    | `etymology`                                                                       | `whyProblematic` (3/39)                                                                                                                                                            | `decolonialHeader.originOfHistoricalTerm`                                                                                             | `origin.*` (4 collections, plusieurs récits) | nouveau `answer` du registre            |
| Ses noms          | autonyme + `exonyms` + `shortLine` (`noms/`)                                                      | `historicalNames.formerNames` (datés)                                             | `alternateNames`                                                                                                                                                                   | `selfAppellation` + `historicalAppellations`                                                                                          | `spellings`                                  | `answer.path` (formes par langue)       |
| Où                | `demography.distributionByCountry` (population)                                                   | `demographics.peoples[].percentageInCountry` + nb peuples + part « non répartie » | **estimation de locuteurs par pays**, déclarée telle quelle (nouveau champ `speakers.byCountry` de la fiche langue ; aujourd'hui dans `PPL_LINGALA`) — jamais une somme de peuples | **estimation de locuteurs par pays**, déclarée telle quelle (`speakers.byCountry` de la fiche famille ; aujourd'hui dans `PPL_BANTU`) | `countries[]` (pastilles, manque dit)        | —                                       |
| Et maintenant     | `content.searchAnswer.followUp` si présent, sinon modèle (répartition, `origins.migrationRoutes`) | idem, sinon modèle (anciens noms)                                                 | idem, sinon modèle (pays)                                                                                                                                                          | idem, sinon modèle (zone)                                                                                                             | idem, sinon modèle (pays)                    | lien publication                        |
| Sources           | preuves par récit (`SearchEvidence`) + total                                                      | idem                                                                              | idem                                                                                                                                                                               | idem                                                                                                                                  | idem                                         | sources du registre                     |

**Règle de la géographie des langues et familles (décision opérateur, 2026-10-06, après la revue)** : ce qui intéresse le lecteur, c'est **combien de personnes parlent la langue aujourd'hui**, par pays. Un « nombre de peuples de notre base » est trompeur (« 2 peuples parlent lingala » est faux pour le lecteur), et additionner les populations des peuples l'est aussi, la relation peuple–langue étant plusieurs-à-plusieurs (`supabase/migrations/054_afrik_people_languages.sql`). Donc : le graphe montre une **estimation de locuteurs en millions**, **déclarée telle quelle** dans la fiche (jamais calculée), avec la mention « Estimations du nombre de locuteurs, à lire comme des ordres de grandeur ». L'opérateur assume ce choix éditorial. Source : un champ `speakers.byCountry[]` ({country, speakers, source}) sur les fiches langue et famille (modèles `public/modele-langue.json` / famille + validateur), rempli en phase 2 à partir des chiffres déjà présents dans les fiches « locuteurs » (`PPL_LINGALA`, `PPL_BANTU`). Sans ce champ rempli, le bloc « Où » d'une langue ne s'affiche pas. `unit: "presence"` reste réservé aux patronymes (pas de chiffres).

## Contrat partagé (`src/lib/search/answer.ts`, lot 0)

```ts
export type AnswerKind =
  "people" | "country" | "language" | "languageFamily" | "patronyme" | "word";
import type { SearchEvidence } from "@/lib/search/evidence"; // existant : affirmation + sources + statut
export interface AnswerAccount {
  text: string;
  attribution?: "oral" | "written" | "linguistic" | "synthesis";
  claimStatus?: NamingClaimStatus;
  evidence: SearchEvidence[];
} // provenance par récit, pas un simple compteur
export interface AnswerName {
  form: string;
  selfGiven: boolean | null;
  shortLine?: string;
  period?: string;
  attestedIn?: string[];
}
export interface AnswerWhere {
  unit: "population" | "speakers" | "percent" | "presence";
  estimate: boolean;
  rows: Array<{ countryId: string; value: number | null }>;
  unsplitPercent?: number;
  documentedPeopleCount?: number;
} // "speakers" = langue/famille, estimation déclarée ; "presence" = patronyme, value = null
export type AnswerNext =
  | { question: string } // rédigée, depuis content.searchAnswer.followUp
  | {
      template: "migration" | "formerName" | "distributionGap";
      params: Record<string, string | number>;
    }; // repli : la copy écrit la phrase
export interface SearchAnswer {
  kind: AnswerKind;
  title: string;
  what: {
    lead?: string; // rédigée, depuis content.searchAnswer.lead ; absente → modèle de phrase côté copy
    facts: {
      population?: number;
      countryCount?: number;
      familyId?: string;
      peopleCount?: number;
    };
  };
  origin?: { accounts: AnswerAccount[]; debated: boolean };
  names: AnswerName[];
  where?: AnswerWhere;
  next?: AnswerNext;
  sources: { count: number }; // = nombre de sources distinctes sur l'ensemble des evidence ; la ligne « Sources » ouvre la feuille existante groupée par récit
  publications?: Array<{ network: string; url: string }>;
  path?: Array<{ form: string; language: string; period?: string }>;
}
export interface WordAnswer extends SearchAnswer {
  kind: "word";
  queries: string[];
} // porté par data.wordAnswers (enveloppe), pas par une ligne
```

Forme cherchée, surtitre au pluriel et lien fiche : calculés côté client (lot B). La feuille de sources existante (`SourceChainSheet`) est réutilisée, ouverte depuis `SourcesLine`, avec les sources groupées par récit.

## Lots (parallélisables) — chacun : worktree, tests d'abord, PR vers `recette`

**Lot 0 — Contrat + référence** (≈1–2 h, fusionné en premier).

- `src/lib/search/answer.ts` (types), `src/lib/search/__fixtures__/answerFixtures.ts` (9 cas : peul, nzebi, bassa, lingala, bantou, CIV, congo, camara, pharaon). Test : type-test.
- **Plan versionné** : copier ce plan dans `docs/design/search-answer-plan.md` (lié depuis `docs/design/search-result-charter.md` pour `check:orphan-docs`) — les sessions hors poste (Claude Cloud, Codex) ne lisent que le dépôt.
- **Schéma des nouveaux champs (déplacé depuis A pour débloquer le lot I)** : `content.searchAnswer { lead?, followUp? }` et `speakers.byCountry[]` dans les modèles stricts (`public/modele-*.json`) + `scripts/validateAfrikData.ts` (longueurs, « ? », registre lecteur, sources taguées) + classe de traduction ; tests du validateur d'abord. A ne fait plus que les lire.
- **Maquette figée v11** : copier les 8 écrans `.dc.html` (lus avec l'outil Artifact sur l'URL publique) dans `docs/design/mockups/search-answer/`, avec un `README.md` (date, version v11, URL, décisions : accroche/rebond en champ, estimations de locuteurs, filtres dynamiques) et **une capture par écran à 320, 430, 768 et 1280 px** (`captures/`). C'est la référence que **chaque lot lit avant de coder** ; les fixtures reprennent le texte de la maquette pour l'accroche et la question des 7 cas.

**Lot E — Accueil, chartes, Plausible** (indépendant, fusionnable ce soir).

- `src/lib/i18n/copy/homeHero.ts` (description FR+EN).
- `docs/design/brand-charter.md` §8.3 : texte aligné sur la page (contribuer en dernier).
- `src/components/pages/RecherchePageContent.tsx:249` : émettre `search:submit` après `selectNameSubject` (`:270`) avec `type` ∈ people/country/language/languageFamily/patronyme/word/multiple/none.
- Tests : `homeOrientation.test.tsx`, `e2e/home-search-first.spec.ts`, test `trackEvent` (@req REQ-113, REQ-145, REQ-046). Puis déclarer `type` dans Plausible › Custom properties.

**Lot A — Projection + API** (après 0, en parallèle de C).

- `src/lib/search/answer.ts` (`readAnswer`) ; `src/lib/search/naming.ts` : lire les 4 collections `origin.*` des patronymes (aujourd'hui `:236-243` n'en lit que 2 → 155 au lieu de 397) et `shortLine` dans `SearchNameRecord`.
- `src/lib/supabase/queries/afrik/searchNaming.ts:174` (+ `short_line`) ; nouvelle `src/lib/supabase/queries/afrik/searchAnswer.ts` (répartition par famille et par langue via les peuples, nb peuples par pays via `afrik_people_countries`).
- `searchService.ts`, `searchEnvelope.ts`, `src/types/afrik-frontend.ts` (`SearchResult.answer`), `src/lib/api/openapiV2.ts` (`SearchAnswerV2` près de `SearchNamingPresentationV2:697`).
- **Champs fiche (option b)** : `content.searchAnswer { lead?, followUp? }` ajouté aux modèles stricts (`public/modele-peuple.json`, `modele-pays.json`, `modele-langue.json`, `modele-linguistique.json`, `modele-nom-patronyme.json`) et à `scripts/validateAfrikData.ts` (longueurs, « ? » final, registre lecteur via `INTERNAL_REGISTER_PATTERNS`, pas d'identifiant `PPL_`/`FLG_`) ; classe de traduction déclarée (`docs/editorial/translation-classes.md`, skill `afrik-translator`) ; `readAnswer` lit le champ, sinon renvoie le gabarit. Même ajout `speakers.byCountry[]` ({country, speakers, source}) sur langue et famille.
- Tests additionnels : un cas avec `lead`/`followUp` remplis, un cas sans (repli sur modèle), un refus du validateur (question sans « ? », trop longue, jargon interne).
- Tests : `answer.test.ts` par type (@req REQ-044, REQ-180, REQ-170), compléments `naming`, `searchEnvelope`, `openapiV2`, test de route `src/app/api/v2/__tests__`.
- Acceptation : PPL_FULA → `where.rows` = `distributionByCountry`, `origin.accounts[0]` = `originOfExonyms` ; AGO → `unsplitPercent` 63 ; patronyme n'ayant que `historicalSyntheses` → ≥1 récit, aucun couronné ; bloc sans donnée → clé absente ; **chaque `AnswerAccount` porte ses `evidence` (affirmation ↔ sources), réutilisant le chargement existant de `evidence.ts`** ; **langue `lin` → `where.unit = "speakers"`, `estimate = true`, lignes lues dans `speakers.byCountry` de la fiche langue ; sans ce champ, pas de clé `where` ; aucune somme de populations de peuples** ; lingala → `origin.debated = true`.

**Lot C — Composants purs + Storybook** (après 0, en parallèle de A, aucun recouvrement).

- `src/components/search/answer/{WhatBlock,OriginBlock,NamesBlock,WhereBars,NextQuestion,SourcesLine}.tsx` + `*.stories.tsx` **à 320, 430, 768 et 1280 px**.
- `OriginBlock` applique la règle de coupe : récit unique non débattu → 2–3 phrases + « Lire la suite » ; `debated` ou plusieurs récits → la première phrase de **chaque** récit, côte à côte, avant « Lire la suite ». `WhereBars` rend `speakers` en millions avec la mention « estimations » (copy), et `presence` en pastilles de pays sans chiffres (patronymes).
- Acceptation responsive : à 320 px, aucun défilement horizontal de page, cibles ≥ 44 px, barres lisibles (libellé pays sur sa ligne si besoin) ; à 768 et 1280 px, une mesure de lecture bornée, pas d'étirement.
- `src/lib/i18n/copy/searchAnswer.ts` (surtitres par type avec pluriel, modèles de phrase et de question, « Lire la suite », ligne sources, manque patronyme) + entrée dans `src/lib/i18n/copy/index.ts`.
- Tests par composant sur les fixtures (@req REQ-178, REQ-180, REQ-170) ; `copyParity` vert ; `check:copy-literals --staged` vert. Couleurs uniquement via tokens (`--afh-*`, accents par type).

**Lot D — Page « mot »** (après A).

- `scripts/ci/checkProductionLedger.ts` (champ `answer` optionnel validé), `src/lib/productions/ledger.ts`, nouveau `src/lib/productions/wordAnswer.ts` (`findWordAnswer(q, lang)`), `src/api/v2/handlers/search.ts:140` (`wordAnswers` dans l'enveloppe), `openapiV2.ts`, `docs/productions/README.md`.
- **Chemin jusqu'à l'écran (bloquant de la revue)** : décodage de `wordAnswers` dans `src/lib/search/searchEnvelope.ts`, état `wordAnswers` dans `src/components/pages/RecherchePageContent.tsx` (à côté de `nameAnswers`, `:135`/`:215`), prop transmise à `SearchFeed` (`:736`), état de page « mot » dans `SearchFeed` qui l'emporte sur l'aveu quand aucune fiche ne répond.
- Donnée : `docs/productions/mot/018-pharaon-d-ou-vient-le-nom.json` reçoit `answer` et la requête « pharaoh ».
- Tests : `ledger.test.ts`, `wordAnswer.test.ts`, test du contrôle, **test d'enveloppe** (décodage `wordAnswers`), **test de page : recherche « pharaoh » sans aucune ligne de résultat → page « mot » rendue, pas de « Nous ne connaissons pas ce nom »** (@req REQ-184, REQ-180, REQ-178).
- Recouvrement : D touche `RecherchePageContent.tsx` et `SearchFeed.tsx` (comme B et E) → D fusionne avant B ; B rebase dessus.

**Lot B — Intégration de la page** (après A + C ; le plus risqué).

- `src/components/search/SearchFeed.tsx` ; `feed/LensesBlock.tsx` (onglets dynamiques, jamais 0 — aujourd'hui Shorts toujours affiché `SearchFeed.tsx:572`) ; `feed/ShortsBlock.tsx` (« Sur ce nom » = `match.relation` exact|word vs « Autour de ce nom », remplace `wideningNote` `SearchFeed.tsx:607`) ; `src/lib/search/resultGrammar.ts` (nouveau `FEED_BLOCKS`) ; `src/lib/search/searchFeedPlan.ts` ; `feed/NameAnswerEntries.tsx:105` (badge par phrase → `SourcesLine`) ; `src/lib/i18n/copy/searchFeed.ts` ; `docs/design/search-result-charter.md` §3 ter dans la même PR.
- Sortent de « Tout » (restent sous leur filtre) : plates, quiz, images, near-name, tiles, problem, atlas-holds, further.
- Tests : réécrire `feedGrammarContract.test.ts`, `searchFeedPlan.test.ts`, `SearchFeed.test.tsx`, `SearchFeedAnswerFirst.test.tsx`, nouveau test des onglets (@req REQ-178, REQ-180).

**Lot G — Branchement des tests de charte** (avec B). Sur la copie versionnée au lot 0 dans `docs/design/mockups/search-answer/`, ajouter les attributs `data-feed-block` + le manifeste généré, recibler `src/lib/search/__tests__/resultGrammarCharter.test.ts` (fait partie de `test:charter-contracts`, bloquant), marquer `docs/design/mockups/search-feed/` remplacé ; adapter ou retirer avec note : `generator/test_build.py`, `feedCases*.ts`, `feedBoardCases.json`, `searchFeedVisual/Browser.test.ts`, `e2e/search-feed-responsive.spec.ts`.

**Lot F — e2e responsive** (écrit d'abord, en échec). `e2e/search-answer.spec.ts`, 9 cas × **320, 430, 768, 1280 px**, sur `e2e/support/search-feed-fixture.ts` enrichi des réponses `answer` et `wordAnswers` (@req REQ-178). Assertions : ordre des six blocs dans « Tout », onglets jamais à 0, aucun défilement horizontal, lingala montre les deux lectures avant « Lire la suite », pharaoh rend la page « mot ». **Ces scénarios sont les critères d'acceptation de la PR B+G : ils doivent y passer au vert avant sa fusion** (F n'est pas un lot fusionné après coup).

**Lot H — Données des 7 cas de la maquette** (éditorial, en parallèle du code, après A pour les nouveaux champs ; `/afrik-curator` + agent contradicteur, sources citées, registre lecteur).

- `content.searchAnswer.lead` et `followUp` pour PPL_FULA, PPL_NZEBI, FLG_BANTU (et décision PPL_BANTU), `COG`/`COD`, `lin`, PAT_CAMARA — en reprenant et vérifiant le texte de la maquette (l'encadré Bantou « Autrement dit… » devient le `lead` ou une phrase de l'origine).
- `speakers.byCountry` : `lin` (depuis PPL_LINGALA : COD 34 M, COG 4,5 M, CAF 0,8 M, AGO 0,3 M) et FLG_BANTU (depuis PPL_BANTU), sources reprises.
- Retirer `lin` de `PPL_BANTU.content.languages.isoCodes` (ou exclure ce peuple agrégé) ; vérifier les noms de peuples cités pour le Congo (Teke, Mbochi, Nzebi ne figurent pas dans `COG.demographics`).
- `answer` de pharaon dans `docs/productions/mot/018-pharaon-d-ou-vient-le-nom.json` (origine, chemin des langues, requête « pharaoh »), texte du carrousel validé.
- Lignes courtes PPL_FULA : déjà faites ; Camara : récits déjà sourcés (#1484).

**Lot I — Mise à jour du corpus (fond, en parallèle de la forme)**. Indépendant du code : ne touche que `dataset/source/afrik/**`, `dataset/translations/**` et `docs/productions/**`. Démarre **tout de suite** pour les champs existants, et **dès le lot 0 fusionné** pour les nouveaux champs. Travail découpé en **tranches de fiches disjointes** (une tranche = une session = un worktree = une PR ≤ 10 fiches), ordonnées par l'écran `/fr/admin/recherches` (zéro résultat et plus fréquentes d'abord). Chaque fiche : `/afrik-curator` → agent contradicteur → `npx tsx scripts/validateAfrikData.ts` + `scripts/ci/checkEditorialRules.ts` verts. Recherche de sources possible avec Perplexity/Grok, jamais d'écriture depuis ces outils ; aucune affirmation de mémoire (Wikipédia en premier passage, source citée à son niveau).

- I-1 Peuples les plus cherchés : `shortLine` par forme (`dataset/source/afrik/noms/`), `searchAnswer.lead/followUp`.
- I-2 Patronymes cherchés sans origine (≈ 408) : `origin.*` récits attribués, aucun couronné (modèle PAT_CAMARA #1484).
- I-3 Langues (39) : origine du nom + `speakers.byCountry` (estimations sourcées).
- I-4 Familles (25) : `speakers.byCountry` + `searchAnswer` ; FLG_BANTU (répartition fausse, doublon PPL_BANTU, `lin` à retirer de PPL_BANTU).
- I-5 Pays (54) : principaux peuples avec leur part (`demographics.peoples`), `searchAnswer`.
- I-6 Mots publiés (19) : champ `answer` du registre + requêtes anglaises.
- **Mesure de couverture** : un rapport `scripts/ci/reportSearchAnswerCoverage.ts` (lot 0 ou A) qui imprime le remplissage par champ (shortLine x/770, langues x/39…), utilisé comme cliquet montant.
- Le lot H (7 cas de la maquette) est la première tranche de I.

**Ordre de fusion** : 0 + F (en échec, non bloquant : `e2e` est hors `make check`) → E → A → C → D → H (données) → B + G (F vert dans la même PR). Puis `recette → main` (merge commit) et Release. **I tourne en continu à côté, sans dépendre de B.**

## Ce qui va casser (prévu)

- B : `feedGrammarContract`, `searchFeedPlan`, `SearchFeed*`, `ShortsBlock`, `LensesBlock` ; charte §3 ter.
- G : `resultGrammarCharter.test.ts` (charter-contracts, bloquant) et les fichiers du manifeste `search-feed`.
- A, D : `openapi:diff` (ajouts optionnels, à vérifier en CI) ; D : `check:production-ledger`.
- B, C : `copyParity`, `check:copy-literals`.

## Pour la présentation de demain (honnête)

- **Faisable ce soir** : lots 0, E, A (peuples + pays), C (Storybook 430 px).
- **À montrer** : la maquette publiée + les vrais composants dans Storybook (+ page locale sur données de test si A et C sont prêts).
- **Pas avant demain** : B, G, D, F au vert ; une 2e Release pour la production.

## Données à compléter (phase 2, hors code, par ordre de recherches — écran `/fr/admin/recherches`)

- `shortLine` : 1/770 (PPL_FULA).
- Origine des langues : 3/39.
- **`speakers.byCountry` (estimations de locuteurs) sur les fiches langue et famille** : 0/39 et 0/25 ; à amorcer depuis `PPL_LINGALA` et `PPL_BANTU`, puis au fil des recherches (champ de modèle + validateur dans le lot A).
- Origine des patronymes : 397/808 (A les fait toutes lire).
- Principaux peuples des pays (« Autres » jusqu'à 63 %, AGO).
- `answer` des 19 mots publiés, + requêtes anglaises.
- Bantou : répartition FLG_BANTU fausse ; doublon peuple/famille à décider. **PPL_BANTU déclare `lin` dans `content.languages.isoCodes` (22 pays)** : avec la règle « présence documentée », le lingala apparaîtrait en Tanzanie ou en Afrique du Sud — à corriger dans la fiche avant le lot A (ou exclure explicitement ce peuple agrégé).
- Couverture inégale des peuples bantous par pays (Tanzanie 75, RD Congo 23) : le graphe le dit en une ligne, la couverture se complète au fil des recherches.

## Vérification

- Par lot : `npx vitest run <tests du lot>`, `npm run typecheck`, `npm run lint`, `npm run lint:req`, `npm run check:copy-literals`, `npm run test:charter-contracts`, `npm run check:dead`, `npm run format:check` ; A/D : `npm run openapi:diff` si disponible, `npm run check:production-ledger`.
- Visuel : Storybook (`npm run storybook`) à 320 / 430 / 768 / 1280 pour C ; page locale (`npm run dev`) sur les 9 cas pour B, captures aux quatre largeurs (mobile d'abord) via le harnais de `/afrik-art-director`.
- **Fidélité à la maquette (avant la fusion de B)** : captures de la page réelle des 7 cas à 320 / 430 / 768 / 1280, **posées côte à côte avec les captures de la maquette v11** (`docs/design/mockups/search-answer/captures/`) ; écarts listés bloc par bloc ; **relecture `/afrik-art-director`** obligatoire — des tests verts ne prouvent pas la fidélité. Un écart dû à une donnée absente est accepté s'il est dit (bloc masqué ou manque en une ligne) ; un écart de mise en page ne l'est pas.
- e2e : `npx playwright test e2e/search-answer.spec.ts` (F) vert **dans la PR B+G, avant sa fusion**.
- Avant Release : CI verte sur la PR `recette → main`, puis `/ethniafrica-release`.

## Fidélité attendue à la maquette (estimation)

|                                                                                                                             | Code seul (0 → B)                              | Code + données des 7 cas (H) |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------- |
| Mise en page, styles, ordre, onglets                                                                                        | ≈ 90–95 %                                      | ≈ 95 %                       |
| Contenu (moyenne des 7 écrans)                                                                                              | ≈ 50 % (modèles de phrase, données manquantes) | ≈ 85–90 %                    |
| **Global**                                                                                                                  | **≈ 65 %**                                     | **≈ 90 %**                   |
| Les 10 % restants : texte relu et resserré par le contradicteur, chiffres exacts des fiches au lieu de ceux de la maquette. |

## Exécution par agents

- 0, E, A, C, D, F, H : un agent par lot, chacun dans son worktree, tests d'abord, PR vers `recette`.
- B : un agent seul, après A + C + H, avec relecture humaine de la page rendue avant fusion (lot le plus risqué : réécrit `SearchFeed`, casse beaucoup de tests).

## Corrections intégrées depuis la revue du 2026-10-06

1. [Bloquant] Chemin `wordAnswers` jusqu'à l'écran (enveloppe → état de page → `SearchFeed`) + test sans aucune fiche — lot D.
2. [Bloquant éditorial] Pas de coupe d'un récit débattu : chaque lecture montrée avant « Lire la suite » — règle en tête, lots A (`debated`) et C (`OriginBlock`).
3. [Important] Provenance par récit : `AnswerAccount.evidence: SearchEvidence[]` (réutilise `src/lib/search/evidence.ts`), feuille de sources groupée par récit — contrat, lots A et C.
4. [Important] Géographie des langues et familles : jamais une somme de populations de peuples. Après essai d'une « présence documentée » (nombre de peuples par pays), l'opérateur a tranché pour une **estimation de locuteurs en millions, déclarée dans la fiche (`speakers.byCountry`) et étiquetée « estimations »** — tableau des sources, contrat, lots A et C ; maquette lingala/bantou en millions (version 11).
5. [À compléter] Largeurs 320 / 430 / 768–1199 / ≥ 1200 dans C et F ; F devient le critère d'acceptation de B+G.
6. [Fidélité] Maquette v11 versionnée au lot 0 comme référence ; accroche et question de rebond en champs facultatifs de fiche avec modèle en repli (option b) ; lot H pour les données des 7 cas ; comparaison visuelle + `/afrik-art-director` avant la fusion de B.

## Tâches parallèles hors plan

- Release v4.23.0 publiée et déployée ; synchronisation du corpus de production à confirmer ; nettoyage de production (Busansi, Bussa) en cours, puis remettre `.env.local` sur la recette.
- Lighthouse Mobile Audit (non obligatoire) rouge sur `/en/dossiers/anecdotes` (LCP 5,7 s > 5,5 s) : dette déjà présente la nuit, à traiter à part.
