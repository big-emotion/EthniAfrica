#!/usr/bin/env tsx
/**
 * Seeds a freshly-migrated, otherwise-empty ephemeral database with exactly
 * the entities `ephemeralSeedManifest.ts` says the three gated CI jobs need
 * — never the whole corpus.
 *
 * Reuses `migrateAfrikToDatabase.ts`'s own upsert functions rather than
 * reimplementing the write path: they carry the classification-protection
 * and assertion-writing logic a fiche's confidence chip depends on, and
 * duplicating it risks it drifting from what production actually does.
 * What this script does NOT reuse is `migrateAfrikToDatabase.ts`'s own
 * orchestration — its drift comparison and orphan scan assume they are
 * looking at the *whole* corpus, and would misread a deliberately partial
 * one as thousands of missing/orphaned rows.
 *
 * Out of scope, on purpose: `afrik_languages` and `afrik_people_languages`.
 * None of the three gated jobs' routes render a language-specific page or a
 * fiche section that depends on that join; if a future gated route does,
 * widen this script and `ephemeralSeedManifest.ts` together.
 */
import { config } from "dotenv";
import path, { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { logger } from "../../src/lib/api/logger";
import { loadAllLanguageFamilies } from "../../src/lib/afrik/loaders/languageFamilyLoader";
import { loadAllPeoples } from "../../src/lib/afrik/loaders/peopleLoader";
import { loadAllCountries } from "../../src/lib/afrik/loaders/countryLoader";
import { createAdminClient } from "../../src/lib/supabase/admin";
import {
  loadAllPeopleFiles,
  loadPeopleProvenance,
} from "../../src/lib/afrik/loaders/peopleProvenanceLoader";
import {
  loadAllCountryFiles,
  loadCountryProvenance,
} from "../../src/lib/afrik/loaders/countryProvenanceLoader";
import {
  emptyMigrationReport,
  readClassificationStatuses,
  upsertLanguageFamilies,
  upsertPeoples,
  upsertCountries,
} from "../migrateAfrikToDatabase";
import { buildEphemeralSeedManifest } from "./ephemeralSeedManifest";

export async function seedEphemeralDatabase(): Promise<void> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed the ephemeral database — this script is not a dry-run tool."
    );
  }

  const manifest = buildEphemeralSeedManifest();
  const supabase = createAdminClient();

  const [allFamilies, allPeoples, allCountries] = await Promise.all([
    loadAllLanguageFamilies(),
    loadAllPeoples(),
    loadAllCountries(),
  ]);

  const peoples = allPeoples.filter((people) =>
    manifest.peopleIds.includes(people.id)
  );

  // A people's language family must exist before upsertPeoples will accept
  // it, even when the manifest itself never names that family directly.
  const requiredFamilyIds = new Set([
    ...manifest.languageFamilyIds,
    ...peoples.map((people) => people.languageFamilyId),
  ]);
  const families = allFamilies.filter((family) =>
    requiredFamilyIds.has(family.id)
  );
  const countries = allCountries.filter((country) =>
    manifest.countryIds.includes(country.id)
  );

  const missingFamilies = [...requiredFamilyIds].filter(
    (id) => !families.some((family) => family.id === id)
  );
  const missingPeoples = manifest.peopleIds.filter(
    (id) => !peoples.some((people) => people.id === id)
  );
  const missingCountries = manifest.countryIds.filter(
    (id) => !countries.some((country) => country.id === id)
  );
  if (
    missingFamilies.length > 0 ||
    missingPeoples.length > 0 ||
    missingCountries.length > 0
  ) {
    throw new Error(
      `The seed manifest names entities the corpus does not have: ` +
        `families [${missingFamilies.join(", ")}], ` +
        `peoples [${missingPeoples.join(", ")}], ` +
        `countries [${missingCountries.join(", ")}]. ` +
        `A gated route was pointed at a retired or renamed fiche.`
    );
  }

  const report = emptyMigrationReport();

  const familyStatuses = await readClassificationStatuses(
    supabase,
    "afrik_language_families"
  );
  await upsertLanguageFamilies(supabase, families, familyStatuses, report);

  const peopleStatuses = await readClassificationStatuses(
    supabase,
    "afrik_peoples"
  );
  const validFamilyIds = new Set(families.map((family) => family.id));
  await upsertPeoples(
    supabase,
    peoples,
    validFamilyIds,
    peopleStatuses,
    report
  );

  await upsertCountries(supabase, countries, report);

  const entityErrors = [
    ...report.languageFamilies.errors,
    ...report.peoples.errors,
    ...report.countries.errors,
  ];
  if (entityErrors.length > 0) {
    throw new Error(
      `Ephemeral seed failed to write entities:\n${entityErrors.join("\n")}`
    );
  }

  const peopleFiles = loadAllPeopleFiles().filter((people) =>
    manifest.peopleIds.includes(people.id)
  );
  const peopleProvenance = await loadPeopleProvenance(supabase, peopleFiles);

  const countryFiles = loadAllCountryFiles().filter((country) =>
    manifest.countryIds.includes(country.id)
  );
  const countryProvenance = await loadCountryProvenance(supabase, countryFiles);

  logger.info("Ephemeral database seeded", {
    script: "seedEphemeralDatabase",
    languageFamilies: families.length,
    peoples: peoples.length,
    countries: countries.length,
    peopleAssertions: peopleProvenance.assertionsWritten,
    countryAssertions: countryProvenance.assertionsWritten,
  });

  const provenanceErrors = [
    ...peopleProvenance.errors,
    ...countryProvenance.errors,
  ];
  if (provenanceErrors.length > 0) {
    throw new Error(
      `Ephemeral seed's provenance pass reported errors:\n${provenanceErrors.join("\n")}`
    );
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
) {
  seedEphemeralDatabase().catch((error) => {
    logger.error("seedEphemeralDatabase crashed", error, {
      script: "seedEphemeralDatabase",
    });
    process.exit(1);
  });
}
