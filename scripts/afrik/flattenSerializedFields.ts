#!/usr/bin/env tsx
/**
 * Turns the JSON objects that 90 fiche fields hold as text into prose.
 *
 * `culture.majorRites`, `artsAndMusic`, `spiritualities` and `symbols` were
 * stored as a serialised object: the site prints a string as it finds it, so a
 * reader saw braces and English key names. Each sentence is kept word for word;
 * what changes is that a French label now stands where the key stood.
 *
 * Dry-run by default. `--apply` rewrites the fiches in place, replacing only
 * the string literal of the field so the file's layout is untouched.
 *
 * A key with no entry in `LABELS` stops the run. The alternative, printing the
 * English key, is exactly the defect this script removes.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `string`: the French label. `null`: a name in the people's own language
 * (a rite, a spirit, an instrument), kept exactly as the key spells it.
 */
const LABELS: Record<string, string | null> = {
  // Rites
  ageSetCeremonies: "Cérémonies des classes d'âge",
  agriculturalRites: "Rites agricoles",
  agricultureRites: "Rites agricoles",
  fieldPreparation: "préparation des champs",
  firstFruits: "prémices",
  harvest: "récolte",
  landBlessing: "bénédiction de la terre",
  planting: "semailles",
  ancestorCult: "Culte des ancêtres",
  ancestralRites: "Rites ancestraux",
  greetings: "salutations",
  sacredForest: "forêt sacrée",
  annualBlessings: "Bénédictions annuelles",
  apiaret: null,
  turkanaboy: null,
  beerRituals: "Rituels de la bière",
  birthRites: "Rites de naissance",
  aikido: null,
  bodyDecoration: "Parures du corps",
  facePaint: "peinture du visage",
  flowers: "fleurs",
  scarification: "Scarification",
  burialRites: "Rites d'inhumation",
  cattleCampRites: "Rites du camp de bétail",
  toic: null,
  cattleRites: "Rites du bétail",
  herding: "garde des troupeaux",
  chieftainRites: "Rites de chefferie",
  baabi: null,
  chinamwali: null,
  commonRites: "Rites communs",
  initiationRites: "Rites d'initiation",
  deathRites: "Rites de mort",
  akinuuk: null,
  fishingRites: "Rites de pêche",
  funerailles: "Funérailles",
  funeraryRites: "Rites funéraires",
  ancestralCeremonies: "cérémonies des ancêtres",
  burial: "inhumation",
  funeralMusic: "musique funéraire",
  inheritance: "héritage",
  libations: "libations",
  memorialFigures: "figures commémoratives",
  mourning: "deuil",
  postFuneraryCeremonies: "cérémonies après les funérailles",
  secondBurial: "second enterrement",
  generationalRites: "Rites de génération",
  nyakiriket: null,
  nyasapán: null,
  guleWamkulu: "Gule Wamkulu",
  healingRites: "Rites de guérison",
  divination: "divination",
  herbalism: "phytothérapie",
  honeyHunting: "chasse au miel",
  umalokun: null,
  hlonipha: null,
  communityInitiation: "initiation communautaire",
  femaleInitiation: "initiation des filles",
  headmanInstallation: "installation du chef de village",
  maleInitiation: "initiation des garçons",
  lobola: null,
  mariageEtDotation: "Mariage et dot",
  marriageRites: "Rites de mariage",
  weddingRites: "Rites de mariage",
  akuuta: null,
  bridewealth: "compensation matrimoniale",
  christianMarriage: "mariage chrétien",
  endogamy: "endogamie",
  formal: "mariage formel",
  ilobolo: null,
  preferred: "union préférée",
  preferredType: "union préférée",
  umabo: null,
  weddingFeast: "fête de mariage",
  lobolo: null,
  purificationRites: "Rites de purification",
  exorcism: "exorcisme",
  fumigation: "fumigation",
  ritualBaths: "bains rituels",
  rainCeremony: "Cérémonie de la pluie",
  reconciliationRites: "Rites de réconciliation",
  matoOput: null,
  nyonoTongGweno: null,
  ritualRites: "Rites",
  nkisiActivation: "activation du nkisi",
  royalRites: "Rites royaux",
  coronation: "couronnement",
  installation: "investiture",
  nyikangCult: "Culte de Nyikang",
  ukweshwama: null,
  umemulo: null,
  umhlanga: null,
  southAfricanSpecific: "Particularités sud-africaines",
  beadwork: "Perlage",
  murals: "peintures murales",
  spiritualCleansing: "Purification spirituelle",
  spiritualRites: "Rites spirituels",
  stickFighting: "Combat au bâton",
  sagineFighting: "combat saginé",
  twinsBirthRite: "Rite de naissance des jumeaux",
  ukubuyisa: null,
  ulwaluko: null,
  umembeso: null,
  zimbabweanSpecific: "Particularités zimbabwéennes",
  regimental: "rites régimentaires",
  // Arts and music
  agriculture: "Agriculture",
  artisanat: "Artisanat",
  crafts: "Artisanat",
  boatBuilding: "Construction de bateaux",
  dances: "Danses",
  dance: "Danses",
  danse: "Danses",
  masks: "Masques",
  musicalInstruments: "Instruments de musique",
  instruments: "Instruments de musique",
  oralLiterature: "Littérature orale",
  litteratureOrale: "Littérature orale",
  orature: "Orature",
  sculpture: "Sculpture",
  songs: "Chants",
  udje: null,
  visualArts: "Arts visuels",
  weaving: "Tissage",
  basket: "Vannerie",
  beer: "Bière",
  bodyAdornment: "Parure du corps",
  bodyArt: "Art corporel",
  tattoosAndScarification: "tatouages et scarifications",
  camelRaising: "Élevage de chameaux",
  commonArts: "Arts communs",
  oralTraditions: "Traditions orales",
  fishing: "Pêche",
  gastronomy: "Gastronomie",
  staple: "aliment de base",
  isicathamiya: null,
  jewelry: "Bijoux",
  mbira: null,
  music: "Musique",
  musique: "Musique",
  musicGenres: "Genres musicaux",
  oralCulture: "Culture orale",
  oralPoetry: "Poésie orale",
  poesieOrale: "Poésie orale",
  peintureMurale: "Peinture murale",
  pentecostalism: "Pentecôtisme",
  perles: "Perles",
  polyphony: "Polyphonie",
  pottery: "Poterie",
  southAfricanArts: "Arts sud-africains",
  zimbabweanArts: "Arts zimbabwéens",
  agwara: null,
  bwola: null,
  larakaraka: null,
  otole: null,
  // Spiritualities
  amadlozi: null,
  ancestorSpirits: "Esprits des ancêtres",
  vadzimu: null,
  ancestorWorship: "Culte des ancêtres",
  ancestors: "Ancêtres",
  endonym: "nom local",
  erivwin: null,
  mediation: "médiation",
  roleOfAncestors: "rôle des ancêtres",
  ancestralSpirits: "Esprits ancestraux",
  chiuta: null,
  christianisme: "Christianisme",
  christianity: "Christianisme",
  note: "note",
  specificPractices: "pratiques particulières",
  cosmology: "Cosmologie",
  culteDesAncetres: "Culte des ancêtres",
  elders: "Anciens",
  sacralPower: "pouvoir sacré",
  intermediateDivinities: "Divinités intermédiaires",
  intermediateEntities: "Entités intermédiaires",
  intermediateSpirits: "Esprits intermédiaires",
  inyangas: null,
  islam: "Islam",
  localInfluences: "Influences locales",
  matoboHills: "Collines de Matobo",
  metaphysics: "Métaphysique",
  dualNature: "double nature",
  ufuoma: null,
  natureSpirits: "Esprits de la nature",
  aziza: null,
  sorcery: "Sorcellerie",
  ngimurok: null,
  nyauBrotherhood: "Confrérie nyau",
  orthodoxChristianity: "Christianisme orthodoxe",
  forcedConversion: "conversion forcée",
  otherSpirits: "Autres esprits",
  madzvoka: null,
  mashavi: null,
  ngozi: null,
  nzuzu: null,
  propheticMovements: "Mouvements prophétiques",
  protestantChristianity: "Christianisme protestant",
  religion: "Religion",
  animism: "animisme",
  religiousSyncretism: "Syncrétisme",
  syncretism: "Syncrétisme",
  syncretisme: "Syncrétisme",
  southAfricanTaboos: "Tabous sud-africains",
  spirits: "Esprits",
  supremeDeity: "Être suprême",
  attributes: "attributs",
  rainmaking: "contrôle de la pluie",
  totemism: "Totémisme",
  traditionalReligion: "Religion traditionnelle",
  practices: "pratiques",
  sacredSpaces: "lieux sacrés",
  supremeDeityShort: "Être suprême",
  traditionalReligions: "Religions traditionnelles",
  summary: "résumé",
  umvelinqangi: null,
  worldview: "Vision du monde",
  cattlecosmology: "cosmologie du bétail",
  zimbabweanSpirit: "Esprit zimbabwéen",
  mlimo: null,
  // Symbols
  atapan: null,
  beads: "Perles",
  caste: "Castes",
  cattle: "Bétail",
  council32chiefs: "Conseil des 32 chefs",
  ekicholong: null,
  greyBull: "Taureau gris",
  lipPlate: "Plateau labial",
  livingstoniaChurch: "Église de Livingstonia",
  mphara: null,
  nilSymbol: "Symbole du Nil",
  nkhoswe: null,
  nyikangSymbol: "Symbole de Nyikang",
  omovalley: "Vallée de l'Omo",
  redRobes: "Robes rouges",
  royalSymbols: "Symboles royaux",
  saginé: null,
  spear: "Lance",
  tree: "Arbre",
  wristKnife: "Couteau de poignet",
};

export class UnmappedKeyError extends Error {
  constructor(public readonly key: string) {
    super(`No French label for the key « ${key} »`);
  }
}

function labelOf(key: string, isFirst: boolean): string {
  if (!(key in LABELS)) throw new UnmappedKeyError(key);
  const label = LABELS[key];
  // A name in the people's own language stays as written, capital included.
  if (label === null)
    return isFirst ? key[0].toUpperCase() + key.slice(1) : key;
  return isFirst
    ? label[0].toUpperCase() + label.slice(1)
    : label[0].toLowerCase() + label.slice(1);
}

function closed(text: string): string {
  const trimmed = text.trim();
  return /[.!?…][)»"']?$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function entry(labelParts: string[], text: string): string {
  const label = labelParts.map((part, i) => labelOf(part, i === 0)).join(" — ");
  return label ? `${label} : ${closed(text)}` : closed(text);
}

const FIELD_NAMES = new Set([
  "majorRites",
  "artsAndMusic",
  "spiritualities",
  "symbols",
]);

function collect(node: unknown, trail: string[], out: string[]): void {
  // The field's own name sometimes reappears as the first key of its object.
  if (trail.length > 0 && FIELD_NAMES.has(trail[0])) {
    trail = trail.slice(1);
  }
  if (typeof node === "string") {
    const parts = trail.filter((key) => key !== "description");
    out.push(entry(parts, node));
  } else if (Array.isArray(node)) {
    if (node.every((item) => typeof item === "string")) {
      out.push(
        entry(trail, (node as string[]).map((s) => s.trim()).join(" ; "))
      );
      return;
    }
    for (const item of node) {
      if (item && typeof item === "object" && "name" in item) {
        const { name, ...rest } = item as Record<string, string>;
        const body = rest.description ?? rest.role ?? "";
        const head = trail.map((part, i) => labelOf(part, i === 0)).join(" — ");
        out.push(`${head} — ${name.trim()} : ${closed(body)}`);
      } else {
        collect(item, trail, out);
      }
    }
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node))
      collect(value, [...trail, key], out);
  }
}

export function flattenSerializedField(
  fieldName: string,
  serialized: string
): string {
  const parsed = JSON.parse(serialized);
  const out: string[] = [];
  const root =
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    Object.keys(parsed).length === 1 &&
    fieldName in parsed
      ? parsed[fieldName]
      : parsed;
  collect(root, [], out);
  return out.join(" ");
}

// ───── CLI ───────────────────────────────────────────────────────────────

const FIELDS = [
  "majorRites",
  "artsAndMusic",
  "spiritualities",
  "symbols",
] as const;

function ficheFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entryDir) => {
    const full = join(dir, entryDir.name);
    if (entryDir.isDirectory())
      return entryDir.name === "archive" || entryDir.name === "logs"
        ? []
        : ficheFiles(full);
    return entryDir.name.endsWith(".json") ? [full] : [];
  });
}

function main(): void {
  const apply = process.argv.includes("--apply");
  const root = join("dataset", "source", "afrik", "peuples");
  let changed = 0;
  for (const file of ficheFiles(root)) {
    let raw = readFileSync(file, "utf8");
    const doc = JSON.parse(raw);
    const culture = doc?.content?.culture;
    if (!culture) continue;
    for (const field of FIELDS) {
      const value = culture[field];
      if (typeof value !== "string") continue;
      const text = value.trim();
      if (!(text.startsWith("{") && text.endsWith("}"))) continue;
      try {
        JSON.parse(text);
      } catch {
        continue;
      }
      const literal = JSON.stringify(value);
      if (!raw.includes(literal))
        throw new Error(`${file}: ${field} literal not found verbatim`);
      raw = raw.replace(literal, () =>
        JSON.stringify(flattenSerializedField(field, value))
      );
      changed += 1;
    }
    if (apply) writeFileSync(file, raw);
  }
  console.log(`${apply ? "rewrote" : "would rewrite"} ${changed} fields`);
}

if (process.argv[1]?.endsWith("flattenSerializedFields.ts")) main();
