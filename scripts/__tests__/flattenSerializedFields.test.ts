import { describe, expect, it } from "vitest";

import {
  flattenSerializedField,
  UnmappedKeyError,
} from "../afrik/flattenSerializedFields";

describe("flattenSerializedField — a JSON object written as text becomes prose", () => {
  // @req REQ-143
  it("puts a French label before each sentence and keeps every sentence word for word", () => {
    const sentence = "Les jeunes filles passent par des rites de puberté.";
    const out = flattenSerializedField(
      "majorRites",
      JSON.stringify({ initiationRites: { femaleInitiation: sentence } })
    );
    expect(out).toBe(
      `Rites d'initiation — initiation des filles : ${sentence}`
    );
  });

  // @req REQ-143
  it("drops a generic « description » key and keeps the group label", () => {
    const out = flattenSerializedField(
      "majorRites",
      JSON.stringify({ funeraryRites: { description: "Un rite." } })
    );
    expect(out).toBe("Rites funéraires : Un rite.");
  });

  // @req REQ-143
  it("keeps a name given in the people's own language exactly as written", () => {
    const out = flattenSerializedField(
      "majorRites",
      JSON.stringify({ lobola: "La dot se verse en bétail." })
    );
    expect(out).toBe("Lobola : La dot se verse en bétail.");
  });

  // @req REQ-143
  it("keeps the name of a deity next to what it names, so « Mwari » is still a name", () => {
    const out = flattenSerializedField(
      "spiritualities",
      JSON.stringify({
        supremeDeity: { endonym: "Mwari", attributes: "Créateur." },
      })
    );
    expect(out).toBe(
      "Être suprême — nom local : Mwari. Être suprême — attributs : Créateur."
    );
  });

  // @req REQ-143
  it("reads a list of strings as one enumeration and a list of named entries as one line each", () => {
    expect(
      flattenSerializedField(
        "artsAndMusic",
        JSON.stringify({ musicalInstruments: ["Tambour (bul)", "Hochets"] })
      )
    ).toBe("Instruments de musique : Tambour (bul) ; Hochets.");
    expect(
      flattenSerializedField(
        "spiritualities",
        JSON.stringify({
          intermediateEntities: [
            { name: "Amasoka", description: "Les esprits des ancêtres." },
          ],
        })
      )
    ).toBe("Entités intermédiaires — Amasoka : Les esprits des ancêtres.");
  });

  // @req REQ-143
  it("ignores a repeated field name and closes a sentence that has no final stop", () => {
    expect(
      flattenSerializedField(
        "artsAndMusic",
        JSON.stringify({ artsAndMusic: { dances: "Danses de moisson" } })
      )
    ).toBe("Danses : Danses de moisson.");
  });

  // @req REQ-143
  it("closes an entry that ends on a bracket, so two entries never run together", () => {
    const out = flattenSerializedField(
      "artsAndMusic",
      JSON.stringify({
        musicalInstruments: ["Tambour (bul)", "Hochets (oroma)"],
        oralLiterature: "Des contes.",
      })
    );
    expect(out).toBe(
      "Instruments de musique : Tambour (bul) ; Hochets (oroma). Littérature orale : Des contes."
    );
  });

  // @req REQ-143
  it("refuses a key it has no label for instead of letting an English word through", () => {
    expect(() =>
      flattenSerializedField(
        "majorRites",
        JSON.stringify({ someNewEnglishKey: "Texte." })
      )
    ).toThrow(UnmappedKeyError);
  });
});
