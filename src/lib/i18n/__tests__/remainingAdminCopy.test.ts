import { describe, expect, it } from "vitest";

import { adminCopy } from "@/lib/i18n/copy/admin";
import { reportsCopy } from "@/lib/i18n/copy/reports";

describe("administration and report outcome copy", () => {
  // @req REQ-145
  it("names the staff surfaces in French", () => {
    expect(adminCopy.fr.queue.title).toBe("Signalements");
    expect(adminCopy.fr.signIn.submit).toBe("Recevoir un lien de connexion");
    expect(adminCopy.fr.apiKeys.createTitle).toBe("Créer une clé");
    expect(adminCopy.fr.sourceReview.title).toBe("Sources en attente d'examen");
  });

  // @req REQ-145
  it("names the public report outcomes in French", () => {
    expect(reportsCopy.fr.detail.targetTitle).toBe("Élément concerné");
    expect(reportsCopy.fr.verification.verified.title).toBe(
      "Adresse confirmée"
    );
  });
});
