import { describe, expect, it } from "vitest";

import { consentCopy } from "@/lib/i18n/copy/consent";

// Three surfaces described one mechanism three ways: the banner said cookies,
// the code writes localStorage, the policy said "the browser". Plausible and
// Sentry set no cookie, so a banner that says they do is a false statement made
// at the moment of asking for consent.
describe("consent copy", () => {
  // @req REQ-145
  it("says the choice is kept in the browser's local storage, not in a cookie", () => {
    expect(consentCopy.fr.description).toMatch(/stockage local/);
    expect(consentCopy.en.description).toMatch(/local storage/);
    expect(consentCopy.fr.description).not.toMatch(/utilisons des cookies/i);
    expect(consentCopy.en.description).not.toMatch(/use cookies/i);
  });

  // @req REQ-145
  it("says audience measurement sets no cookie", () => {
    expect(consentCopy.fr.analyticsDescription).toMatch(/sans cookie/);
    expect(consentCopy.en.analyticsDescription).toMatch(/no cookie/);
  });

  // @req REQ-145
  it("offers no choice about a service that is not running", () => {
    for (const copy of [consentCopy.fr, consentCopy.en]) {
      expect(JSON.stringify(copy)).not.toMatch(/Sentry/);
    }
  });
});
