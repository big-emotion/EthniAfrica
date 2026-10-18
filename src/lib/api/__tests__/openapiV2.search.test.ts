import { describe, expect, it } from "vitest";
import { swaggerSpecV2 } from "@/lib/api/openapiV2";
import type { SearchHitKind, SearchLead } from "@/types/afrik";

interface SchemaObject {
  type?: string | string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
  required?: string[];
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  $ref?: string;
  description?: string;
}

interface OpenApiParameter {
  in?: string;
  name?: string;
  required?: boolean;
  schema?: SchemaObject;
  description?: string;
}

interface OpenApiOperation {
  description?: string;
  parameters?: OpenApiParameter[];
}

interface OpenApiSpec {
  components: { schemas: Record<string, SchemaObject> };
  paths: Record<string, { get?: OpenApiOperation }>;
}

const spec = swaggerSpecV2 as unknown as OpenApiSpec;
const schemas = spec.components.schemas;

/**
 * The spec's kind enum is checked against the union the merge actually emits,
 * not against a list retyped here: adding a member to `SearchHitKind` without
 * adding it below fails `typecheck`, and adding it below without adding it to
 * the spec fails this suite. An undocumented kind therefore cannot ship.
 */
const KINDS_THE_MERGE_EMITS: Record<SearchHitKind, true> = {
  people: true,
  country: true,
  languageFamily: true,
  person: true,
  patronyme: true,
  quiz: true,
};

/** Same pattern for the kinds a near-miss lead can carry (DEC-075). */
const KINDS_A_LEAD_CARRIES: Record<SearchLead["kind"], true> = {
  people: true,
  country: true,
  family: true,
  patronyme: true,
};

/** The answer key, in every spelling the fiche and the RPC use for it. */
const ANSWER_FIELDS = [
  "options",
  "optionsFr",
  "options_fr",
  "correctOption",
  "correct_option",
  "explanation",
  "explanationFr",
  "explanation_fr",
];

function schemaName($ref: string): string {
  return $ref.replace("#/components/schemas/", "");
}

describe("OpenAPI v2 unified search contract", () => {
  // @req REQ-121
  it("documents the optional quiz lens as an exclusive search stream", () => {
    const operation = spec.paths["/api/v2/search"]?.get;
    const lens = operation?.parameters?.find(
      (parameter) => parameter.in === "query" && parameter.name === "lens"
    );

    expect(lens).toBeDefined();
    expect(lens?.required ?? false).toBe(false);
    expect(lens?.schema?.enum).toEqual(["quiz"]);
    expect(lens?.description).toMatch(/only quiz questions/i);
    expect(lens?.description).toMatch(/not queried/i);
    expect(lens?.description).toMatch(/main search stream/i);
  });

  // The English site was retired: the parameter stays optional and accepts
  // French alone, and any other value is refused rather than defaulted.
  // @req REQ-141
  it("documents the optional lang parameter as French only", () => {
    const operation = spec.paths["/api/v2/search"]?.get;
    const lang = operation?.parameters?.find(
      (parameter) => parameter.in === "query" && parameter.name === "lang"
    );

    expect(lang).toBeDefined();
    expect(lang?.required ?? false).toBe(false);
    expect(lang?.schema?.enum).toEqual(["fr"]);
    expect(lang?.description).toMatch(/French/i);
    expect(lang?.description).toMatch(/400/);
  });

  // @req REQ-141
  it("describes the cross-kind tie-break as collated in French", () => {
    const results = schemas.SearchResponseData.properties?.results;

    expect(results?.description).toMatch(/collated in French/);
  });

  // @req REQ-121
  it("explains both sides of the exclusive quiz-lens behavior", () => {
    const description = spec.paths["/api/v2/search"]?.get?.description;

    expect(description).toMatch(/without `lens`[^.]*not queried/i);
    expect(description).toMatch(/`lens=quiz`[^.]*only quiz questions/i);
  });

  // @req REQ-121
  it("defines mode-aware quiz, result, and total descriptions", () => {
    const data = schemas.SearchResponseData;
    const properties = data.properties ?? {};

    expect(properties.quizzes?.description).toMatch(
      /empty without `lens`.*populated only with `lens=quiz`/i
    );
    expect(properties.results?.description).toMatch(
      /without `lens`.*excludes quiz.*`lens=quiz`.*only quiz/i
    );
    expect(properties.quizzesTotal?.description).toMatch(
      /zero without `lens`.*matching.*`lens=quiz`/i
    );
    expect(properties.total?.description).toMatch(
      /without `lens`.*non-quiz.*`lens=quiz`.*quizzesTotal/i
    );
  });

  // @req REQ-002
  it("documents results as the canonical cross-kind ordered array", () => {
    const data = schemas.SearchResponseData;
    const results = data.properties?.results;

    expect(results?.type).toBe("array");
    expect(schemaName(results?.items?.$ref ?? "")).toBe("SearchHitV2");
    expect(data.required).toContain("results");
    expect(results?.description).toMatch(/normalizedScore/);
    expect(results?.description).toMatch(/ties broken/i);
  });

  // @req REQ-125
  it("documents optional recorded-field evidence on each unified hit", () => {
    const hit = schemas.SearchHitV2;

    expect(hit.properties?.recordedIn).toMatchObject({
      type: "array",
      items: {
        type: "object",
        properties: {
          fieldPath: { type: "string" },
          text: { type: "string" },
        },
        required: ["fieldPath", "text"],
      },
    });
    expect(hit.properties?.recordedIn?.description).toMatch(
      /field paths and their text where the fiche records the query as a whole word/i
    );
    expect(hit.required).not.toContain("recordedIn");
  });

  // @req REQ-180
  it("documents qualified near names separately from zero-result leads", () => {
    const data = schemas.SearchResponseData;
    const nearNames = data.properties?.nearNames;

    expect(nearNames?.type).toBe("array");
    expect(schemaName(nearNames?.items?.$ref ?? "")).toBe("SearchNearNameV2");
    expect(data.required).toContain("nearNames");
    expect(nearNames?.description).toMatch(/non-empty search/i);
    expect(nearNames?.description).toMatch(/similarity/i);
  });

  // @req REQ-125
  it("enumerates every kind a near-miss lead can carry, family names included", () => {
    const kind = schemas.SearchLeadV2?.properties?.kind;

    expect([...(kind?.enum ?? [])].sort()).toEqual(
      Object.keys(KINDS_A_LEAD_CARRIES).sort()
    );
  });

  // « jarra » reaches Diarra through its spelling Jara: a client showing
  // the filed name alone would offer a name that begins with another letter.
  // Optional, so a client written before migration 110 keeps working.
  // @req REQ-125
  it("documents the form that scored on a lead, as an optional addition", () => {
    const lead = schemas.SearchLeadV2;
    const matchedForm = lead?.properties?.matchedForm;

    expect(matchedForm?.type).toBe("string");
    expect(matchedForm?.description).toMatch(/scored/i);
    expect(lead?.required).not.toContain("matchedForm");
    expect(lead?.properties?.similarity?.description).toMatch(/matchedForm/);
    expect(schemas.SearchNearNameV2?.properties).not.toHaveProperty(
      "matchedForm"
    );
  });

  // A lead is offered only under a piece that is one name and that itself
  // scored (brief 16, ninth and tenth reviews): matchedForm is always what
  // `similarity` measures. « One name » is promised only where migration 111
  // guarantees it: a people's piece and a family name's recorded spelling. A
  // family name's filed name (« dos Santos ») and a country or language
  // family's name are given as filed; a client told « always one name »
  // would rely on a test those forms never pass.
  // @req REQ-125
  it("documents per kind which forms are one name, with no filed-name fallback", () => {
    const description =
      schemas.SearchLeadV2?.properties?.matchedForm?.description;

    expect(description).toMatch(/migrations 110 and 111/);
    expect(description).toMatch(
      /For a people, a piece of its filed name, its self-appellation or an exonym that is one name/
    );
    expect(description).toMatch(/a slash between spaces/);
    expect(description).toMatch(/click/);
    expect(description).toMatch(/« a-liyan »/);
    expect(description).toMatch(/is never scored/);
    expect(description).toMatch(
      /For a family name, its filed name as filed, or a recorded spelling that is one name/
    );
    expect(description).toMatch(
      /For a country or a language family, its name as filed/
    );
    expect(description).not.toMatch(/always one name/);
    expect(description).not.toMatch(/named by its filed name/);
    expect(
      schemas.SearchLeadV2?.properties?.similarity?.description
    ).not.toMatch(/unless/);
  });

  // A client that read « always empty when total > 0 » would never show the
  // family-name lead « tchikaya » now carries beside its results.
  // @req REQ-125
  it("documents family-name leads beside results, with their guards", () => {
    const description =
      schemas.SearchResponseData.properties?.leads?.description;

    expect(description).not.toMatch(/always an empty array when total/i);
    expect(description).toMatch(/family name/i);
    expect(description).toMatch(/answers the query exactly/i);
    // A third-party caller scoping its search must know why no lead comes.
    expect(description).toMatch(/familyId/);
    expect(description).toMatch(/countryId/);
    expect(description).toMatch(/spells exactly/i);
    expect(description).toMatch(/first letter/i);
    expect(description).toMatch(/0\.4/);
  });

  // « tchikaya » no longer returns Chukwu beside the Tchicaya lead: a client
  // counting patronymesTotal must know why (brief 16).
  // @req REQ-201
  it("documents that a family-name lead also withholds the names reached only by their sound", () => {
    const description =
      schemas.SearchResponseData.properties?.patronymes?.description;

    expect(description).toMatch(/phonetic key/i);
    expect(description).toMatch(/family-name lead/i);
    expect(description).toMatch(/DEC-075/);
  });

  // @req REQ-135
  it("documents the history names on every row kind the page answers by name, as an optional addition", () => {
    const rows = {
      peoples: "PeopleV2",
      countries: "CountryV2",
      families: "LanguageFamilyV2",
      patronymes: "PatronymeSearchResultV2",
      languages: "LanguageSearchResultV2",
    };

    for (const [array, name] of Object.entries(rows)) {
      const items = schemas.SearchResponseData.properties?.[array]?.items;
      const historyNames = schemas[name]?.properties?.historyNames;

      expect(schemaName(items?.$ref ?? ""), array).toBe(name);
      expect(schemaName(historyNames?.$ref ?? ""), name).toBe(
        "SearchHistoryNamesV2"
      );
      expect(schemas[name]?.required ?? [], name).not.toContain("historyNames");
    }
    expect(schemas.SearchHistoryNamesV2).toMatchObject({
      type: "array",
      items: { type: "string" },
    });
    expect(schemas.SearchHistoryNamesV2?.description).toMatch(/history order/);
  });

  // @req REQ-002
  it("enumerates every kind the merge can emit", () => {
    const kind = schemas.SearchHitV2?.properties?.kind;

    expect([...(kind?.enum ?? [])].sort()).toEqual(
      Object.keys(KINDS_THE_MERGE_EMITS).sort()
    );
  });

  // @req REQ-129
  it("bounds normalizedScore on [0, 1] wherever a hit carries it", () => {
    const carriers = [
      "SearchHitV2",
      "QuizSearchResultV2",
      "PersonSearchResultV2",
      "PatronymeSearchResultV2",
    ];

    for (const name of carriers) {
      const score = schemas[name]?.properties?.normalizedScore;

      expect(score, `${name}.normalizedScore`).toMatchObject({
        type: "number",
        minimum: 0,
        maximum: 1,
      });
      expect(schemas[name]?.required, name).toContain("normalizedScore");
    }
  });

  // @req REQ-180
  it("documents the structured naming projection and complete evidence", () => {
    const projection = schemas.SearchNamingProjectionV2;
    const presentation = schemas.SearchNamingPresentationV2;
    const form = schemas.SearchNamingPresentationFormV2;
    const evidence = schemas.SearchNamingEvidenceV2;
    const assertion = schemas.SearchNamingEvidenceAssertionV2;

    expect(projection?.required).toEqual(["forms", "eras", "presentation"]);
    expect(projection?.properties?.presentation?.$ref).toBe(
      "#/components/schemas/SearchNamingPresentationV2"
    );
    expect(presentation?.required).toEqual([
      "forms",
      "eras",
      "disagreements",
      "evidence",
    ]);
    expect(form?.required).toEqual([
      "form",
      "selfGiven",
      "attestations",
      "evidence",
    ]);
    expect(form?.properties?.selfGiven?.type).toEqual(["boolean", "null"]);
    expect(form?.properties?.origin?.$ref).toBe(
      "#/components/schemas/SearchNamingOriginFactV2"
    );
    expect(form?.properties?.evidence?.items?.$ref).toBe(
      "#/components/schemas/SearchNamingEvidenceV2"
    );

    expect(evidence?.required).toEqual(["assertion", "sources", "standing"]);
    expect(assertion?.required).toEqual([
      "statement",
      "sourceCount",
      "lastHumanAuditAt",
    ]);
    expect(assertion?.properties?.confidenceScore).toMatchObject({
      type: "number",
      minimum: 0,
      maximum: 1,
    });
    expect(assertion?.required).not.toContain("confidenceScore");
  });

  // @req REQ-180
  it("attaches naming optionally to all five naming search classes", () => {
    const carriers = [
      "PeopleV2",
      "CountryV2",
      "LanguageFamilyV2",
      "PatronymeSearchResultV2",
      "LanguageSearchResultV2",
    ];

    for (const name of carriers) {
      expect(schemas[name]?.properties?.naming, name).toEqual({
        $ref: "#/components/schemas/SearchNamingProjectionV2",
      });
      expect(schemas[name]?.required ?? [], name).not.toContain("naming");
    }
  });

  // @req REQ-178
  it("attaches the answer optionally, so the change never breaks a client", () => {
    for (const name of [
      "PeopleV2",
      "CountryV2",
      "LanguageFamilyV2",
      "PatronymeSearchResultV2",
      "LanguageSearchResultV2",
    ]) {
      expect(schemas[name]?.properties?.answer, name).toEqual({
        $ref: "#/components/schemas/SearchAnswerV2",
      });
      expect(schemas[name]?.required ?? [], name).not.toContain("answer");
    }
  });

  // @req REQ-178
  it("documents speaker estimates as a declared figure, never a sum of peoples", () => {
    const where = schemas.SearchAnswerV2?.properties?.where;

    expect(where?.properties?.unit?.enum).toContain("speakers");
    expect(where?.description).toMatch(/never a sum/);
    expect(schemas.SearchAnswerV2?.required).toEqual(
      expect.arrayContaining(["kind", "title", "what", "names", "sources"])
    );
  });

  // @req REQ-121
  it("projects the quiz stem and never the answer", () => {
    const quiz = schemas.QuizSearchResultV2;
    const documented = Object.keys(quiz?.properties ?? {});

    expect(documented).toEqual(
      expect.arrayContaining([
        "id",
        "prompt",
        "entityType",
        "entityId",
        "subjectName",
        "normalizedScore",
        "snippet",
      ])
    );
    for (const answerField of ANSWER_FIELDS) {
      expect(documented, answerField).not.toContain(answerField);
    }
  });

  // @req REQ-126
  it("keeps the grouped compatibility arrays and their totals documented", () => {
    const data = schemas.SearchResponseData;
    const groupedItems: Record<string, string> = {
      peoples: "PeopleV2",
      countries: "CountryV2",
      families: "LanguageFamilyV2",
      persons: "PersonSearchResultV2",
      patronymes: "PatronymeSearchResultV2",
      quizzes: "QuizSearchResultV2",
    };

    for (const [group, itemSchema] of Object.entries(groupedItems)) {
      const array = data.properties?.[group];

      expect(array?.type, group).toBe("array");
      expect(schemaName(array?.items?.$ref ?? ""), group).toBe(itemSchema);
      expect(data.required, group).toContain(group);

      const totalKey = `${group}Total`;
      expect(data.properties?.[totalKey]?.type, totalKey).toBe("integer");
      expect(data.required, totalKey).toContain(totalKey);
    }

    expect(data.required).toContain("total");
  });
});
