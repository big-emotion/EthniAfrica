# Essai — d'où viennent les noms

Écrit le 2026-09-17. Cinquième essai enregistré sous cette commande, et le seul
qui **réoriente le projet entier** plutôt que d'éclairer un angle.

**Ce que ce fichier est.** La décision de faire de l'onomastique le **sujet** du
site, et non plus seulement sa méthode. Les quatre essais précédents expliquaient
pourquoi le projet raconte les noms ; celui-ci décide que le produit se
réorganise autour de cette question, jusque dans sa signature et dans sa page la
plus visitée.

**Ce qu'il ne fait pas.** Il ne spécifie ni la page de résultats, ni le gabarit
social, ni le titre exact d'un écran. Un essai motive une règle ; il ne l'écrit
pas. Les décisions qui en découlent sont listées en fin de fichier avec l'endroit
où chacune doit être écrite.

## L'échange, verbatim

> EthniAfrica — d'où viennent les noms des peuples d'Afrique : ça doit être le
> nouveau slogan du site.
>
> On réoriente la stratégie éditoriale du site sur l'onomastique, la recherche de
> l'origine des noms des peuples, personnes, lieux, pays, régions, langues, etc.
> d'Afrique.
>
> La page d'accueil reste telle qu'elle visuellement et en termes d'UX, le titre
> change. La page de résultats de recherche est pensée pour montrer d'où vient le
> nom recherché par l'utilisateur, et on l'oriente dans sa recherche sur la
> variété des sources qui indiquent l'origine du nom cherché. Il fait son choix
> ou se laisse guider par les choix de l'édito. On affiche le nom sous les
> différentes appellations.
>
> Ex : mandé / mandingue / bambara / dioula.
>
> Sur les réseaux sociaux, on poste un seul format : « D'où vient le nom
> "…" ? ». Par exemple : d'où vient le nom « lingala » ?, d'où vient le nom
> « mandé » ? Dans le narratif, on présente les différentes appellations avec
> l'origine sourcée. On peut aussi présenter les on-dit, mythes populaires,
> traditions orales, etc. On n'accorde du poids qu'à ceux qui sont concernés.
> Toutes les appellations d'autres sources sont également présentées, à commencer
> par les appellations les plus communes.
>
> À la fin de la publication, on délivre un message positif, lié à la doctrine /
> à propos du projet (actuelle page « À propos » du site ethniafrica.com).
>
> Les fiches pays, peuples, langues, familles, noms, lieux, etc. en détail
> restent. Mais l'accent est mis sur la page de résultats de recherche, où on
> oriente les utilisateurs sur les différentes appellations du nom cherché et les
> origines de chacune, en y montrant les migrations et changements à travers le
> temps.

## Synthèse

**Ce que la décision change, en une phrase : l'onomastique passe de méthode à
sujet.** L'essai du matin même
([saluer l'autre comme il se nomme](saluer-l-autre-comme-il-se-nomme-2026-09-17.md))
posait que « l'onomastique n'est pas le sujet du projet, c'est sa méthode ». Cette
page promeut la méthode au rang de sujet — et la signature du site le dit.

**Le produit se réordonne autour d'une seule question.** Jusqu'ici l'atlas
répondait à « qui est ce peuple, où vit-il ». Il répondra à **« d'où vient ce
nom »**. Ce n'est pas une nuance de formulation : les deux questions n'appellent
ni la même page d'arrivée, ni le même ordre de lecture.

**La page de résultats cesse d'être un aiguillage et devient un article.** Elle
ne conduit plus vers une fiche : elle porte elle-même la réponse — les
appellations concurrentes regroupées, l'origine de chacune attribuée à sa source,
et les changements dans le temps. C'est un déplacement d'investissement, pas un
ajout : les fiches détaillées de chaque classe d'entité restent, elles cessent
seulement d'être le point d'arrivée par défaut.

**Aucune appellation n'est couronnée, et l'ordre est celui de l'usage.** On
commence par les plus communes — parce que c'est ce que le lecteur a tapé — et on
donne les autres, chacune avec son origine. C'est la règle « ne jamais trancher »
appliquée à l'architecture, et non plus seulement à la phrase.

**Le on-dit devient un contenu, pas une erreur.** Mythes populaires et traditions
orales sont présentés, à condition d'être attribués. Le poids ne leur vient pas
de leur nombre de sources mais de qui les porte : **on n'accorde du poids qu'à
ceux qui sont concernés**. C'est mot pour mot la hiérarchie de sources dictée le
matin même — la meilleure source est celle qui approche le nom qu'un peuple se
donne — ici appliquée aux explications concurrentes d'un nom.

**Le format social se réduit à un seul.** « D'où vient le nom "X" ? », et rien
d'autre. C'est une simplification massive : le gabarit actuel porte plus de dix
clôtures distinctes selon le type de sujet, chacune à choisir. Une question
unique les remplace.

**La clôture reste positive et adossée à la doctrine.** Chaque publication se
referme sur le propos du projet tel que la page « À propos » le porte. La
conviction d'unité y reste étiquetée comme une position, jamais comme un fait que
le corpus démontre — la contrainte permanente de cette commande n'est pas levée
par la réorientation.

## Ce que la mesure du jour dit du coût

Deux constats mesurés le 2026-09-17 mordent directement sur cette décision, et il
vaut mieux les savoir avant de spécifier :

- **Le corpus ne date presque aucune attestation.** Or la diachronie que la page
  de résultats doit afficher — « les migrations et changements à travers le
  temps » — repose sur des formes datées. La donnée n'existe pas encore.
- **Aucune porte ne garde les exonymes.** L'autonyme est obligatoire ; les
  appellations concurrentes ne le sont nulle part
  (`docs/editorial/audit-doctrine-publication-2026-09-17.md`, constat 1). Une
  page qui promet de toutes les montrer repose sur un champ que rien ne remplit.

Ni l'un ni l'autre n'invalide la décision. Ils disent où le chantier commence.

## Ce qui en découle, à écrire ailleurs

Un essai motive une règle ; il ne la remplace pas. Cinq décisions suivent, chacune
avec son domicile :

1. **La signature du site** — la copie de l'accueil, dans son dictionnaire i18n.
   Le visuel et l'UX ne bougent pas.
2. **Le contrat de l'article de nom** — quelles sections une réponse « d'où vient
   ce nom » doit porter, et dans quel ordre. C'est une charte de surface, donc
   `docs/design/`.
3. **La page de résultats** — sa spécification, et le fait qu'elle regroupe les
   variantes sous une entrée unique plutôt que de lister des liens.
4. **Le format social unique** — une ligne dans la table par type de contenu de
   `GABARITS-SOCIAL.md` §7 ter, qui remplace les précédentes plutôt que de s'y
   ajouter. La table elle-même énonce que la ligne s'écrit là d'abord, jamais
   dans une carte.
5. **L'obligation d'exposer les appellations concurrentes** — une règle de plus
   dans `checkEditorialRules.ts`, sans quoi la page promet ce que le corpus ne
   garantit pas.

Aucune n'est écrite ici.
