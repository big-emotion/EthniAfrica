---
name: ethniafrica-featured-campaigns
description: Proposer une campagne pour la tuile vedette de la home (src/lib/home/featuredCampaigns.ts) — une histoire de noms ou un événement historique daté (fête d'indépendance, anniversaire), jamais permanemment le même sujet. Recherche en temps réel : découvre les dates candidates via une API de calendrier, puis vérifie chacune auprès d'une institution publique africaine ou d'un média africain avant de la sourcer. Ne rend rien, n'active rien, n'écrit jamais de fenêtre de dates lui-même — propose une entrée FeaturedCampaign sourcée, sans activeFrom/activeTo, à l'opérateur pour validation. Utiliser pour « quelle campagne pour la home », « prochaines dates importantes », « propose un événement pour [pays/peuple] », « trouve une date à mettre en avant », ou /ethniafrica-featured-campaigns.
---

# featured-campaigns — la tuile vedette de la home, jamais figée sur un sujet

Ce skill alimente `src/lib/home/featuredCampaigns.ts` (PR #1278,
2026-09-22) — la tuile qui suit la bande de recherche sur la home. Sa règle
fondatrice, posée par l'opérateur le même jour : **la forme reste, le sujet
ne reste jamais**. Une histoire de noms aujourd'hui, une fête nationale
demain, jamais permanemment le même peuple — sinon le site lit comme
consacré à un seul sujet, ce qu'il n'est pas.

**Ce skill ne fait tourner aucune campagne.** Il en propose une, sourcée,
sans fenêtre de dates. `getActiveFeaturedCampaign` ne choisit une entrée que
si elle porte `activeFrom`/`activeTo` — ajouter ces deux dates et merger
reste un geste de l'opérateur, jamais de ce skill.

Distinct d'`afrik-curator` : celui-ci enrichit les fiches du corpus ; ce
skill ne touche à aucune fiche — il lit `dataset/source/afrik/` en lecture
seule et écrit uniquement dans `featuredCampaigns.ts`/`.en.ts`.

## Le pipeline — trois étapes, jamais raccourcies

### 1. Découverte — une date candidate, pas encore une source

Pour un pays donné (code ISO 3166-1 **alpha-2**, pas l'alpha-3 du corpus —
`MLI` devient `ML`, `SEN` devient `SN`), interroge une API de calendrier
public en temps réel :

```
https://date.nager.at/api/v3/PublicHolidays/{année}/{code-alpha-2}
```

Vérifié en direct le 2026-09-22 : `.../2026/SN` renvoie bien « April 4 —
Independence Day » pour le Sénégal, daté correctement. C'est une base
communautaire (tier `unverified`) : elle sert à **savoir quelle date
chercher**, jamais à la citer comme preuve.

Pour un **peuple**, il n'existe aucune API équivalente. La plupart des
peuples n'ont aucune date calendaire annuelle vérifiable — un royaume
précolonial a une période de fondation, rarement un jour. Chercher directement
(voir étape 2) plutôt que forcer une date qui n'existe pas : l'absence de date
sourcée est un résultat valide, pas un échec du skill.

### 2. Vérification — la date candidate rencontre une vraie source

Pour chaque date candidate, cherche une confirmation auprès de :

- **Une institution publique africaine** — présidence, ministère, l'Union
  africaine. Tier `official`. Exemple trouvé le 2026-09-22 : la page Facebook
  officielle de la Présidence du Mali annonçant « Bamako, 22 septembre 2025 :
  Indépendance, 65e anniversaire ».
- **Un média africain** — panafricain (AllAfrica agrège des dizaines de
  titres nationaux) ou national (la presse du pays concerné). Tier
  `referenced`.
- **Wikipédia se lit en premier passage**, jamais comme source finale — la
  règle déjà écrite dans CLAUDE.md pour toute affirmation du projet. Une
  date lue seulement sur Wikipédia n'est pas encore vérifiée.

**Le plancher : au moins une source `official`, ou deux sources
`referenced` indépendantes.** Une seule dépêche de presse ne suffit pas à
fixer une date calendaire qui sera republiée chaque année — l'erreur coûte
plus qu'ailleurs sur le site parce qu'elle se répète.

**Ne jamais aplatir une date qui a une histoire.** Le Mali a eu deux
indépendances : le 20 juin 1960 (Fédération du Mali, dissoute en quelques
semaines) et le 22 septembre 1960 (celle retenue comme fête nationale). La
campagne doit porter la nuance si les sources la portent, pas la date la
plus simple à citer — la même discipline que `docs/design/search-result-charter.md`
applique à un nom : présenter, jamais trancher pour aplatir.

### 3. Rédaction — une entrée `FeaturedCampaign`, jamais une fenêtre

Produit un objet au schéma de `src/lib/home/featuredCampaigns.ts` :

```ts
{
  id: "kebab-case-descriptif",
  kind: "event",
  eyebrow: string,
  heading: string,
  support: string,
  entity: { kind: "country" | "people" | ..., id: "ID_CORPUS" },
  quote: string,        // une phrase sourcée, jamais inventée
  sources: [{ title, url? }],  // 2 à 5, les plus citables
  sourceCount: number,  // le total réel de sources vérifiées, pas gonflé
  linkLabel: string,
  // activeFrom / activeTo : JAMAIS renseignés par ce skill
}
```

Et son jumeau anglais dans `featuredCampaigns.en.ts`, `provenance: "human"`
si la traduction est faite à la main (pas via une passe machine).

`entity.id` doit exister dans le corpus (`dataset/source/afrik/pays/` ou
`peuples/`) — une campagne pointant vers une fiche absente est un 404 que
le lecteur trouve avant l'opérateur. Vérifie avant de proposer.

## Ce que tu rends à l'opérateur

Pas un fichier écrit directement sur `recette` : une proposition, dans une
réponse ou dans une branche/PR isolée si le contexte s'y prête (une session
en tâche de fond travaille toujours dans son propre worktree). Présente :

- La date, avec ses deux sources minimum et leurs liens.
- L'objet `FeaturedCampaign` complet, prêt à coller.
- La nuance trouvée à l'étape 2, si elle existe.
- Explicitement : « aucune fenêtre de dates n'est ajoutée — c'est à toi de
  l'activer si tu valides. »

## Ce que tu ne fais jamais

- Ajouter `activeFrom`/`activeTo` — ça reste le geste de l'opérateur, même
  après validation du contenu.
- Merger ou pousser sur `recette` sans qu'on te le demande explicitement.
- Citer Wikipédia, une API de calendrier ou un agrégateur comme source finale
  d'une date — ce sont des outils de découverte, jamais des preuves.
- Inventer une date pour un peuple qui n'en a pas de vérifiable : dire
  « aucune date sourcée trouvée » plutôt que forcer une campagne.
- Toucher une fiche du corpus — ça, c'est `/afrik-curator`.

## Pour finir

Une ligne : la date proposée (ou l'absence de date sourcée), ses sources, et
le rappel qu'elle attend l'activation de l'opérateur.
