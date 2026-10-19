import { beforeEach, describe, expect, it, vi } from "vitest";

import { CANONICAL_DOMAIN } from "@/lib/brand";
import { getPatronymeRoute } from "@/lib/routing";
import type { PatronymeSource } from "@/lib/patronymes/content";

/**
 * What a name fiche asks a crawler to do with it (REQ-147).
 *
 * A dossier resting only on `unverified` citations is published — the Source
 * Tier Policy is explicit that nothing is suppressed for being weak — but
 * publishing it is not the same as offering it to a search index as an answer.
 * The threshold is the dossier's best tier, and the canonical is unaffected by
 * it: indexability and identity are two different questions.
 */

const { getPatronymeByIdMock, loadPatronymeNextStepsMock } = vi.hoisted(() => ({
  getPatronymeByIdMock: vi.fn(),
  loadPatronymeNextStepsMock: vi.fn(async () => []),
}));

vi.mock("@/api/v2/services/patronymes", () => ({
  getPatronymeById: getPatronymeByIdMock,
}));

vi.mock("@/lib/fiche/patronymeNextSteps", () => ({
  loadPatronymeNextSteps: loadPatronymeNextStepsMock,
}));

import AppellationsSlugPage, { generateMetadata } from "../page";
import { serializePatronyme } from "@/api/v2/serializers/patronymes";
import type { PatronymeAggregate } from "@/api/v2/services/patronymes";

const KEITA_ROUTE = `https://${CANONICAL_DOMAIN}${getPatronymeRoute(
  "fr",
  "PAT_KEITA"
)}`;

function dossierCiting(...sources: PatronymeSource[]) {
  return {
    id: "PAT_KEITA",
    nameMain: "Keïta",
    nameSystem: "clan_name",
    casteOrSocialFunction: null,
    content: { sources },
    associatedPeoples: [],
    associatedCountries: [],
    bearers: [],
    alliances: [],
  };
}

// The corpus writes `source_kind` on the raw dossier; the reader parses it.
const machineWritten = {
  title: "Relevé de couverture",
  url: null,
  tier: "unverified",
  source_kind: "ai_generated",
} as unknown as PatronymeSource;

function metadataFor(slug: string) {
  return generateMetadata({ params: Promise.resolve({ lang: "fr", slug }) });
}

function findElementByName(
  node: unknown,
  name: string
): { props: Record<string, unknown> } | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementByName(child, name);
      if (match) return match;
    }
    return null;
  }

  if (!node || typeof node !== "object") return null;

  const element = node as {
    type?: { name?: string };
    props?: Record<string, unknown>;
  };
  if (element.type?.name === name && element.props) {
    return { props: element.props };
  }

  for (const value of Object.values(element.props ?? {})) {
    const match = findElementByName(value, name);
    if (match) return match;
  }
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the name fiche's indexing directive", () => {
  // The sitemap submits every name that cites a readable source, whatever its
  // tier; a page that then declared `noindex` would be a submitted URL that
  // contradicts itself. Both follow the same rule, which replaces DEC-050's
  // threshold (operator approval 2026-09-30, audit finding T03).
  // @req REQ-147
  it("leaves a name resting only on unverified sources free to be indexed", async () => {
    getPatronymeByIdMock.mockResolvedValue(
      dossierCiting({
        title: "Un blog de généalogie",
        url: null,
        tier: "unverified",
      })
    );

    const metadata = await metadataFor("PAT_KEITA");

    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBe(KEITA_ROUTE);
  });

  // A dossier resting only on machine-written sources is published and
  // labelled, but not offered to a search index (operator decision 2026-09-30).
  // The sitemap applies the same predicate.
  // @req REQ-147
  it("withholds a name whose every citation is AI-generated, and keeps its canonical", async () => {
    getPatronymeByIdMock.mockResolvedValue(dossierCiting(machineWritten));

    const metadata = await metadataFor("PAT_KEITA");

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(KEITA_ROUTE);
  });

  // @req REQ-147
  it("leaves a name free to be indexed when one human-written source sits beside the AI survey", async () => {
    getPatronymeByIdMock.mockResolvedValue(
      dossierCiting(machineWritten, {
        title: "Un blog de généalogie",
        url: null,
        tier: "unverified",
      })
    );

    const metadata = await metadataFor("PAT_KEITA");

    expect(metadata.robots).toBeUndefined();
  });

  // @req REQ-147
  it("withholds a name whose dossier cites nothing readable", async () => {
    getPatronymeByIdMock.mockResolvedValue(dossierCiting());

    const metadata = await metadataFor("PAT_KEITA");

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  // @req REQ-147
  it("leaves a referenced name free to be indexed", async () => {
    getPatronymeByIdMock.mockResolvedValue(
      dossierCiting(
        { title: "Un blog de généalogie", url: null, tier: "unverified" },
        { title: "Niane, Soundjata", url: null, tier: "referenced" }
      )
    );

    const metadata = await metadataFor("PAT_KEITA");

    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBe(KEITA_ROUTE);
  });

  // @req REQ-147
  it("leaves an official name free to be indexed", async () => {
    getPatronymeByIdMock.mockResolvedValue(
      dossierCiting({ title: "SIL Ethnologue", url: null, tier: "official" })
    );

    const metadata = await metadataFor("PAT_KEITA");

    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBe(KEITA_ROUTE);
  });

  // @req REQ-147
  it("declares nothing at all for a slug that names no fiche", async () => {
    getPatronymeByIdMock.mockResolvedValue(null);

    const metadata = await metadataFor("PAT_INCONNU");

    expect(metadata.alternates).toBeUndefined();
    expect(metadata.robots).toBeUndefined();
  });

  /**
   * An unreachable corpus is not a weak dossier. Answering `noindex` to a
   * timeout would de-list a sourced fiche on a transient failure, so a read
   * that fails leaves the metadata exactly as it was before REQ-147.
   */
  // @req REQ-147
  it("keeps a name indexable when the dossier cannot be read", async () => {
    getPatronymeByIdMock.mockRejectedValue(new Error("database unavailable"));

    const metadata = await metadataFor("PAT_KEITA");

    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBe(KEITA_ROUTE);
  });
});

describe("the rendered name fiche's public projection", () => {
  // @req REQ-133
  it("renders the serializer projection, including its ordering and bearer field boundary", async () => {
    const aggregate = {
      id: "PAT_KEITA",
      nameMain: "Keïta",
      nameSystem: "clan_name",
      casteOrSocialFunction: null,
      content: {},
      associatedPeoples: [
        { id: "PPL_Z", nameMain: "Zulu", autonym: null, slug: "zulu" },
        { id: "PPL_A", nameMain: "Alpha", autonym: null, slug: "alpha" },
      ],
      associatedCountries: [
        { id: "CIV", nameFr: "Côte d’Ivoire" },
        { id: "BEN", nameFr: "Bénin" },
      ],
      bearers: [
        {
          id: "person-1",
          fullName: "A. Keïta",
          roleCategory: "historian",
          peopleLinks: ["PPL_SECRET"],
          countryIds: ["CIV"],
        },
      ],
      namedBearers: [{ displayName: "A. Keïta", status: "deceased" }],
      alliances: [],
    } as unknown as PatronymeAggregate;
    getPatronymeByIdMock.mockResolvedValue(aggregate);

    const page = await AppellationsSlugPage({
      params: Promise.resolve({ lang: "fr", slug: "PAT_KEITA" }),
    });
    const fiche = findElementByName(page, "PatronymeFicheView");
    const renderedPatronyme = fiche?.props.patronyme as
      ReturnType<typeof serializePatronyme> | undefined;

    expect(renderedPatronyme).toEqual(serializePatronyme(aggregate));
    expect(renderedPatronyme?.bearers[0]).not.toHaveProperty("peopleLinks");
    expect(renderedPatronyme?.associatedPeoples.map(({ id }) => id)).toEqual([
      "PPL_A",
      "PPL_Z",
    ]);
    expect(renderedPatronyme?.associatedCountries.map(({ id }) => id)).toEqual([
      "BEN",
      "CIV",
    ]);
  });
});
