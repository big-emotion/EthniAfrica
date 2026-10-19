import { describe, expect, it } from "vitest";

import {
  corpusEntities,
  familyNameLeadForm,
  familyNameLeads,
  fichesRecordingWord,
  nameHits,
  NEIGHBOUR_FLOOR,
  neighbours,
  peopleLeadForm,
  peopleLeadForms,
  proseHits,
  similarity,
  type ModelEntity,
} from "@/lib/search/__fixtures__/corpusNameModel";

// The one-name rule of migration 113 (brief 16, tenth review), restated here
// letter by letter rather than with the model's pattern, so the corpus-wide
// tests below can catch the model out. At most three words; each word made
// of letters of any script with their combining marks, hyphens, apostrophes
// and click marks, a click mark standing at the start of a word or inside
// it, never at its end. The first word opens on an upper-case letter, a
// letter with no case (ǂ, ǁ, ǃ, ǀ are letters), click marks before a letter,
// one to eight lower-case letters before an upper-case one, or one or two
// lower-case letters joined by a hyphen to a lower-case one.
const CLICK_MARKS = new Set(["!", "|", "=", "/"]);
const isLetter = (char: string) => /^[\p{L}\p{M}]$/u.test(char);
const isUpper = (char: string) => char !== char.toLowerCase();
const isLower = (char: string) => char !== char.toUpperCase();

function isWord(word: string): boolean {
  const chars = [...word];
  const lastLetter = chars.map(isLetter).lastIndexOf(true);
  return (
    lastLetter >= 0 &&
    chars.every(
      (char) => isLetter(char) || CLICK_MARKS.has(char) || "'’-".includes(char)
    ) &&
    chars.slice(lastLetter + 1).every((char) => "'’-".includes(char))
  );
}

function opensAsAName(word: string): boolean {
  const chars = [...word];
  const afterClicks = chars.findIndex((char) => !CLICK_MARKS.has(char));
  if (afterClicks > 0) return /^\p{L}$/u.test(chars[afterClicks] ?? "");
  if (!/^\p{L}$/u.test(chars[0])) return false;
  if (!isLower(chars[0])) return true;
  const prefix = chars.findIndex((char) => !isLower(char));
  if (chars[prefix] === "-") {
    return prefix <= 2 && isLower(chars[prefix + 1] ?? "");
  }
  return prefix >= 1 && prefix <= 8 && isUpper(chars[prefix]);
}

function isOneName(form: string): boolean {
  const words = form.split(" ").filter((word, index) => index === 0 || word);
  return (
    form === form.trim() &&
    words.length <= 3 &&
    words.every(isWord) &&
    opensAsAName(words[0])
  );
}

const peopleFiches = () =>
  corpusEntities().filter((item) => item.kind === "people");

function fiche(key: string): ModelEntity {
  const found = corpusEntities().find((item) => item.key === key);
  expect(found, key).toBeDefined();
  return found!;
}

/**
 * The leads in the order migration 113 returns its rows: similarity, then
 * name, then id. A people is named by the piece that scored; a country or a
 * language family by its name.
 */
function rankedLeads(query: string): { key: string; form: string }[] {
  return neighbours(query, { formsOfAPeople: true })
    .map((item) => {
      const form =
        item.kind === "people"
          ? peopleLeadForm(query, item)!
          : item.forms.reduce((best, candidate) =>
              similarity(candidate, query) > similarity(best, query)
                ? candidate
                : best
            );
      return {
        key: item.key,
        name: item.filedName,
        form,
        score: similarity(form, query),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.name.localeCompare(right.name) ||
        left.key.localeCompare(right.key)
    )
    .map(({ key, form }) => ({ key, form }));
}

// DEC-075 over the real family-name fiches of the repository, through the
// pg_trgm model of corpusNameModel.ts. The SQL of migration 113, which
// re-issues 111's function, stays the authority; its verification block
// re-checks these on recette.
describe("which family names are a spelling of the searched name (DEC-075)", () => {
  const leadIds = (query: string) =>
    familyNameLeads(query).map((item) => item.key);

  // @req REQ-125
  it("offers Tchicaya for « tchikaya », and neither Tchalla nor Tchoumba", () => {
    expect(leadIds("tchikaya")).toContain("PAT_TCHICAYA");
    expect(leadIds("tchikaya")).not.toContain("PAT_TCHALLA");
    expect(leadIds("tchikaya")).not.toContain("PAT_TCHOUMBA");
  });

  // @req REQ-125
  it("offers Mutombo for « muzombo »", () => {
    expect(leadIds("muzombo")).toContain("PAT_MUTOMBO");
  });

  // Main's example of several choices with a fiche found that is not one of
  // them (brief 16): Konan and Konaté begin like « konana », each through its
  // filed name; Onana, which the search also finds by its spelling, begins
  // with another letter. No fiche writes the word anywhere, sources
  // included: the example is a spelling our data does not record.
  // @req REQ-125
  it("offers Konan and Konaté for « konana », a word no fiche records", () => {
    const leads = familyNameLeads("konana");

    expect(leads.map((item) => item.key)).toEqual(
      expect.arrayContaining(["PAT_KONAN", "PAT_KONATE"])
    );
    expect(leads.map((item) => familyNameLeadForm("konana", item))).toEqual(
      leads.map((item) => item.filedName)
    );
    expect(leadIds("konana")).not.toContain("PAT_ONANA");
    expect(nameHits("konana")).toEqual([]);
    expect(proseHits("konana")).toEqual([]);
    expect(fichesRecordingWord("konana")).toEqual([]);
  });

  // The first several-choice example, withdrawn: « Sanoh » is one of the
  // Kuranko clans, and Sanou's source note reads « Notice SANOU / SANOH /
  // SANON ». A spelling our fiches record is no misspelling to correct: the
  // query layer offers no lead beside such a fiche until DEC-075 rules on it.
  // @req REQ-125
  it("finds « sanoh » written by the Kuranko and Sanou fiches", () => {
    expect(proseHits("sanoh").map((item) => item.key)).toContain("PPL_KURANKO");
    expect(fichesRecordingWord("sanoh")).toEqual(
      expect.arrayContaining(["PPL_KURANKO", "PAT_SANOU"])
    );
  });

  // Migration 110 returns the form that scored beside the filed name.
  // « jarra » reaches Diarra through its recorded spelling Jara only: Diarra
  // begins with another letter. The page names Jara, the form that is
  // written almost the same way, not Diarra.
  // @req REQ-125
  it("reaches Diarra for « jarra » through its recorded spelling Jara", () => {
    const diarra = familyNameLeads("jarra").find(
      (item) => item.key === "PAT_DIARRA"
    );

    expect(diarra).toBeDefined();
    expect(familyNameLeadForm("jarra", diarra!)).toBe("Jara");
  });

  // Mukasa begins with another letter; Bukuru begins with b but shares too
  // little with « bukasa ».
  // @req REQ-125
  it("offers no family name for « bukasa »", () => {
    expect(leadIds("bukasa")).toEqual([]);
  });

  // The first letter changes, so the spelling is not offered; the search
  // itself still finds what it finds.
  // @req REQ-125
  it("does not offer Tchicaya for « chikaya »", () => {
    expect(leadIds("chikaya")).not.toContain("PAT_TCHICAYA");
  });

  // The family-name branch scores the filed name and `spellings[].spelling`
  // only. An
  // attestation's country code is no form of the name: « cog » is not a
  // spelling of Tchicaya because it was attested in Congo.
  // @req REQ-125
  it("scores only the filed name and the recorded spellings, not their attestations", () => {
    expect(leadIds("cog")).not.toContain("PAT_TCHICAYA");
  });

  // @req REQ-125
  it("offers nothing for a query under three letters", () => {
    expect(familyNameLeads("tc")).toEqual([]);
  });

  // The filed name keeps the branch as it stood; each recorded spelling must
  // be one name. « da Costa » begins in lower case, so « da costa » reaches
  // no family name through it: Costa, the filed name, begins with c.
  // @req REQ-125
  it("scores a recorded spelling only when it is one name: no Costa for « da costa »", () => {
    const costa = fiche("PAT_COSTA");

    expect(leadIds("da costa")).not.toContain("PAT_COSTA");
    expect(familyNameLeadForm("da costa", costa)).toBeUndefined();
  });

  // A hyphen after a class prefix of one or two letters opens a name only
  // before a lower-case letter (« a-liyan »). « al-Hawari », a recorded
  // spelling of El Hawary, opens like « da Costa » on a lower-case particle
  // before a capital, and stays out until rule 4 is ruled on (brief 16,
  // « Tenth review »): El Hawary itself begins with another letter.
  // @req REQ-125
  it("does not score a recorded spelling opened by « al- »: no El Hawary for « al-hawari »", () => {
    const elHawary = fiche("PAT_EL_HAWARY");

    expect(leadIds("al-hawari")).not.toContain("PAT_EL_HAWARY");
    expect(familyNameLeadForm("al-hawari", elHawary)).toBeUndefined();
  });

  // Every form a family-name lead can be named by, each typed as written:
  // the chip is the filed name, or a recorded spelling that is one name.
  // @req REQ-125
  it("names a family-name lead only by its filed name or a spelling that is one name", () => {
    const misnamed = corpusEntities()
      .filter((item) => item.kind === "patronyme")
      .flatMap((item) => {
        const filed = item.filedName.replace(/\s*\([^)]*\)\s*$/, "").trim();
        return [filed, ...(item.spellings ?? [])].map((typed) => ({
          key: item.key,
          filed,
          chip: familyNameLeadForm(typed, item),
        }));
      })
      .filter(
        ({ filed, chip }) =>
          chip !== undefined && chip !== filed && !isOneName(chip)
      );

    expect(misnamed).toEqual([]);
  });
});

// A people lead through one of its other names (brief 16): migration 113
// scores the pieces of a people's filed name, self-appellation and exonyms
// that are one name, at 0.2, and names the piece that scored.
describe("which people a misspelling resembles (REQ-125)", () => {
  // The example of brief 16: Pakhallas is the name the Dioula gave the
  // Koulango, recorded by the Koulango fiche alone, and no fiche marks it as
  // a name that hurts. No fiche writes « pakhalas » anywhere, sources
  // included, and Koulango begins with another letter: the chip names
  // Pakhallas, the line names the fiche. Since the ninth review cuts the
  // Dioula exonym list « Diula, Djula, Doula, Dualas, Dyoula, Dyulanke »,
  // its spelling Dualas (0.23) is a second, weaker lead.
  // @req REQ-125
  it("reaches Koulango for « pakhalas » only through its exonym Pakhallas, a word no fiche records", () => {
    const leads = neighbours("pakhalas", { formsOfAPeople: true });
    const named = leads.map((item) => ({
      key: item.key,
      form: peopleLeadForm("pakhalas", item),
    }));

    expect(named).toEqual([
      { key: "PPL_KOULANGO", form: "Pakhallas" },
      { key: "PPL_DIOULA", form: "Dualas" },
    ]);
    expect(similarity("Pakhallas", "pakhalas")).toBeGreaterThan(
      similarity("Dualas", "pakhalas")
    );
    expect(familyNameLeads("pakhalas")).toEqual([]);
    expect(nameHits("pakhalas")).toEqual([]);
    expect(proseHits("pakhalas")).toEqual([]);
    expect(fichesRecordingWord("pakhalas")).toEqual([]);
  });

  // The page's examples of a form two fiches record, and of a fiche filed
  // with a bracket: Iteso and Kumam both record Ikumama; the fiche filed
  // « Diola (Joola / Jola) » records Ajamataw, the name the Diola give
  // themselves. Neither typed word is written by any fiche.
  // @req REQ-125
  it("reaches Iteso and Kumam for « icumama », and Diola for « ajumataw », through the form each records", () => {
    const ikumama = neighbours("icumama", { formsOfAPeople: true });
    const ajamataw = neighbours("ajumataw", { formsOfAPeople: true });

    expect(ikumama.map((item) => item.key).sort()).toEqual([
      "PPL_ITESO",
      "PPL_KUMAM",
    ]);
    expect(ikumama.map((item) => peopleLeadForm("icumama", item))).toEqual([
      "Ikumama",
      "Ikumama",
    ]);
    expect(ajamataw.map((item) => item.key)).toEqual(["PPL_DIOLA"]);
    expect(peopleLeadForm("ajumataw", ajamataw[0])).toBe("Ajamataw");
    for (const query of ["icumama", "ajumataw"]) {
      expect(familyNameLeads(query)).toEqual([]);
      expect(proseHits(query)).toEqual([]);
      expect(fichesRecordingWord(query)).toEqual([]);
    }
  });

  // A lead is offered only under a piece that is one name and that itself
  // scored (ninth review of brief 16). « Baganda (sg. Muganda,
  // pl. Abaganda) » is one piece: the commas sit inside its trailing
  // bracket, which is dropped, so « pl. Abaganda) » is never scored. The
  // filed name « Baganda / Ganda » is cut at its slash, which stands between
  // spaces, and its piece Baganda scores 0.21 against « abagenda » on its
  // own. No fiche writes the word.
  // @req REQ-125
  it("reaches Baganda for « abagenda » through Baganda, a piece of its filed name, never through « pl. Abaganda) »", () => {
    const lead = neighbours("abagenda", { formsOfAPeople: true }).find(
      (item) => item.key === "PPL_BAGANDA"
    );

    expect(lead).toBeDefined();
    expect(peopleLeadForm("abagenda", lead!)).toBe("Baganda");
    expect(similarity("Baganda", "abagenda")).toBeGreaterThanOrEqual(
      NEIGHBOUR_FLOOR
    );
    expect(peopleLeadForms(lead!)).not.toContain("pl. Abaganda)");
    expect(nameHits("abagenda")).toEqual([]);
    expect(proseHits("abagenda")).toEqual([]);
  });

  // A self-appellation of clean names joined by a slash is cut at the slash,
  // and each name is scored: « Bakongo (pluriel) / Mukongo (singulier) »,
  // « Bidhaawyeet / Tubdhaawi », « Baatonu (singulier) / Baatombu
  // (pluriel) ; leur langue : Baatonum ». The eighth review's pattern
  // dropped such a value whole, while the filed name was always scored: the
  // filed name was ranked above the name a people gives itself. No fiche
  // writes these three words.
  // @req REQ-125
  it("scores a self-appellation joined by a slash piece by piece: Mukongo for « mukongu », Bidhaawyeet for « bidhawyet », Baatombu for « baatombou »", () => {
    const cases: [string, string, string][] = [
      ["mukongu", "PPL_KONGO", "Mukongo"],
      ["bidhawyet", "PPL_BEJA", "Bidhaawyeet"],
      ["baatombou", "PPL_BARIBA", "Baatombu"],
    ];

    for (const [query, key, form] of cases) {
      const lead = neighbours(query, { formsOfAPeople: true }).find(
        (item) => item.key === key
      );

      expect(lead, `${query} → ${key}`).toBeDefined();
      expect(peopleLeadForm(query, lead!), query).toBe(form);
      expect(fichesRecordingWord(query), query).toEqual([]);
    }
    expect(peopleLeadForms(fiche("PPL_IJAW"))).toEqual(
      expect.arrayContaining(["Izon", "Ijo"])
    );
  });

  // An exonym entry that lists several spellings is cut at its commas, and
  // each spelling is scored on its own: the chip names one of them, never
  // the list « Diula, Djula, Doula, Dualas, Dyoula, Dyulanke ».
  // @req REQ-125
  it("scores a comma list of exonyms piece by piece: Dyulanke for « dyoulanke », Bekoose for « bekosse »", () => {
    const cases: [string, string, string][] = [
      ["dyoulanke", "PPL_DIOULA", "Dyulanke"],
      ["bekosse", "PPL_BAKOSSI", "Bekoose"],
    ];

    for (const [query, key, form] of cases) {
      const lead = neighbours(query, { formsOfAPeople: true }).find(
        (item) => item.key === key
      );

      expect(lead, `${query} → ${key}`).toBeDefined();
      expect(peopleLeadForm(query, lead!), query).toBe(form);
    }
  });

  // The Dioula self-appellation holds a paragraph, cut at its commas and
  // semicolons into pieces of prose; the Sawa one holds glosses. None is one
  // name, so none is scored: « bathilly » does not reach the Dioula fiche
  // through « suivant Abdoulaye Bathily », a historian's name.
  // @req REQ-125
  it("never scores a piece of prose: « suivant Abdoulaye Bathily », « au XIVe siècle », « les Dioula », « rivage »", () => {
    const dioula = fiche("PPL_DIOULA");
    const sawa = fiche("PPL_SAWA");

    for (const prose of [
      "suivant Abdoulaye Bathily",
      "au XIVe siècle",
      "les Dioula",
    ]) {
      expect(peopleLeadForms(dioula)).not.toContain(prose);
      expect(peopleLeadForm(prose, dioula), prose).not.toBe(prose);
    }
    expect(peopleLeadForms(sawa)).not.toContain("rivage");
    expect(
      neighbours("bathilly", { formsOfAPeople: true }).map((item) => item.key)
    ).not.toContain("PPL_DIOULA");
  });

  // A gloss of three words or fewer is not a name when it starts in lower
  // case: « peuple du Burundi », the second half of the Rundi exonym
  // « Habitants du Burundi / peuple du Burundi », and « de l'espagnol raíz »,
  // the tail of the Raizal self-appellation, are never scored.
  // @req REQ-125
  it("never scores a short gloss that starts in lower case: « peuple du Burundi », « de l'espagnol raíz »", () => {
    expect(peopleLeadForms(fiche("PPL_RUNDI"))).not.toContain(
      "peuple du Burundi"
    );
    expect(peopleLeadForms(fiche("PPL_RAIZAL"))).not.toContain(
      "de l'espagnol raíz"
    );
    expect(peopleLeadForms(fiche("PPL_RAIZAL"))).toContain("Raizal");
  });

  // A slash inside a word writes a click: « Hai//om », « Zhu/'hoasi »,
  // « G//ana », « G/anda ». Cut there, the ninth review's first draft gave
  // Hai, om, Zhu and G, names no fiche gives, and « zhuhoasi » would have
  // printed « La fiche Ju|'hoansi donne le nom Zhu. ». Only a slash between
  // spaces cuts, so each of these is one piece and scored whole.
  // @req REQ-125
  it("never cuts at a slash inside a word: « haiom » and its typos name no Hai and no om", () => {
    const wholes: [string, string][] = [
      ["PPL_HAIOM", "Hai//om"],
      ["PPL_JUHOANSI", "Zhu/'hoasi"],
      ["PPL_GONA", "G//ana"],
      ["PPL_BUGAKWE", "G/anda"],
    ];
    const fragments = ["Hai", "om", "Zhu", "G", "anda", "ana", "'hoasi"];

    for (const [key, whole] of wholes) {
      const scored = peopleLeadForms(fiche(key));
      expect(scored, key).toContain(whole);
      expect(
        scored.filter((form) => fragments.includes(form)),
        key
      ).toEqual([]);
    }
    for (const query of ["haiom", "hai om", "haiiom", "zhuhoasi", "gxa"]) {
      const chips = neighbours(query, { formsOfAPeople: true })
        .filter((item) => item.kind === "people")
        .map((item) => peopleLeadForm(query, item));
      expect(
        chips.filter((chip) => fragments.includes(chip!)),
        query
      ).toEqual([]);
    }
  });

  // Click names open on a letter with no case (ǂ, ǃ, ǀ) or on a click mark
  // written « ! », « | » or « = »: each is one name and is scored. A people
  // keeps the name it gives itself (doctrine §1): ǂHoan for the ǂHoan,
  // Ju|'hoansi for the Ju|'hoansi, never only « Dobe Bushmen ».
  // @req REQ-125
  it("scores click names: ǂHoan, =|Hoa, Ju|'hoansi, !Kung, Nǀhuki, ʼNǀohan", () => {
    const cases: [string, string[]][] = [
      ["PPL_HOA", ["ǂHoan", "=|Hoa", "ǂ'Amkoe"]],
      ["PPL_JUHOANSI", ["Ju|'hoansi", "!Kung", "ǃXũũ"]],
      ["PPL_NUU", ["Nǀuu", "Nǀhuki", "N|uu"]],
      ["PPL_TAA", ["ǃXoon", "ʼNǀohan"]],
      ["PPL_DAMARA", ["ǂNūkhoen"]],
    ];

    for (const [key, names] of cases) {
      expect(peopleLeadForms(fiche(key)), key).toEqual(
        expect.arrayContaining(names)
      );
    }
    const juhoansi = neighbours("juhoansi", { formsOfAPeople: true }).find(
      (item) => item.key === "PPL_JUHOANSI"
    );
    expect(juhoansi).toBeDefined();
    expect(peopleLeadForm("juhoansi", juhoansi!)).toBe("Ju|'hoansi");
  });

  // A class prefix of one to eight lower-case letters before the stem's
  // capital opens a name: amaXhosa, vaKaranga, vaKavango and haKavango, the
  // names these peoples give themselves.
  // @req REQ-125
  it("scores a name opened by a lower-case class prefix: amaXhosa, vaKaranga, vaKavango", () => {
    expect(peopleLeadForms(fiche("PPL_XHOSA"))).toContain("amaXhosa");
    expect(peopleLeadForms(fiche("PPL_KARANGA"))).toContain("vaKaranga");
    expect(peopleLeadForms(fiche("PPL_KAVANGO"))).toEqual(
      expect.arrayContaining(["vaKavango", "haKavango"])
    );
  });

  // « abakwa- » means « those of the house of »: the two Southern Ndebele
  // peoples name themselves abakwaManala and abakwaNdzundza, a class prefix
  // of six letters before the stem's capital. A cap of four letters dropped
  // both while their exonyms (« Manala Ndebele », « Southern Ndebele ») still
  // scored, so « abakwamanala » offered Gwandara through « Abakwa Riga » and
  // never the Manala: a name others gave outranked the name the people gives
  // itself (doctrine §1). The lower-case spelling and a one-letter slip each
  // reach their own people first, through the self-name.
  // @req REQ-125
  it("scores the Ndebele self-names abakwaManala and abakwaNdzundza: a typo of each offers its own people first", () => {
    expect(peopleLeadForms(fiche("PPL_NDEBELE_MANALA"))).toContain(
      "abakwaManala"
    );
    expect(peopleLeadForms(fiche("PPL_NDEBELE_NDZUNDZA"))).toContain(
      "abakwaNdzundza"
    );
    for (const query of ["abakwamanala", "abakwamanla"]) {
      expect(rankedLeads(query)[0], query).toEqual({
        key: "PPL_NDEBELE_MANALA",
        form: "abakwaManala",
      });
    }
    for (const query of ["abakwandzundza", "abakwandzunza"]) {
      expect(rankedLeads(query)[0], query).toEqual({
        key: "PPL_NDEBELE_NDZUNDZA",
        form: "abakwaNdzundza",
      });
    }
  });

  // The Bassari name themselves a-liyan, one person, and be-liyan, the
  // people; their fiche says « Bassari est un nom donné au peuple de
  // l'extérieur ». Each name opens on a class prefix of one or two
  // lower-case letters joined by a hyphen to its stem. Migration 110 scored
  // a-liyan. Without this opening, « aliyan » offered Alladian first and
  // Bassari second, through the exonym Biyan: a name others gave ranked
  // above the name the people gives itself (doctrine §1).
  // @req REQ-125
  it("scores the Bassari self-names a-liyan and be-liyan: « aliyan » offers Bassari first, through a-liyan", () => {
    expect(peopleLeadForms(fiche("PPL_BASSARI"))).toEqual(
      expect.arrayContaining(["a-liyan", "be-liyan"])
    );
    expect(rankedLeads("aliyan")[0]).toEqual({
      key: "PPL_BASSARI",
      form: "a-liyan",
    });
    expect(rankedLeads("beliyan")[0]).toEqual({
      key: "PPL_BASSARI",
      form: "be-liyan",
    });
  });

  // Every people fiche scores at least one piece of its filed name or of its
  // self-appellation. A filed name can itself be a name others gave
  // (Bassari), so the next test holds the self-appellation on its own.
  // @req REQ-125
  it("scores, for every people fiche, a piece of its filed name or of its self-appellation", () => {
    const withoutOwnName = peopleFiches()
      .filter((item) => {
        const [filed, self] = item.nameFields ?? [];
        return !peopleLeadForms({
          ...item,
          nameFields: [filed, self ?? ""],
        }).length;
      })
      .map((item) => item.key);

    expect(withoutOwnName).toEqual([]);
  });

  // The seven fiches whose self-appellation holds no piece that is one name.
  // Five describe rather than name: the four language groups (« Diverses
  // selon les sous-groupes », « Les noms varient selon les groupes ») and
  // the Bantu (« Aucun nom propre »). Two pack a name with its gloss: Sawa
  // (« Sawa — du duala : rive, … ») and Harari (« ጌ፞ይ ኡሱኣች (Gey Usuach) —
  // les Gens de la Ville »). The list changes only with the data (ETNI-2135
  // rewrites packed and describing values): a fiche that joins it is a name
  // the rule drops.
  const SELF_APPELLATION_WITHOUT_A_NAME = [
    "PPL_ATLANTIQUE_MACRO",
    "PPL_BANTU",
    "PPL_BENOUECONGO_MACRO",
    "PPL_GUR_MACRO",
    "PPL_HARARI",
    "PPL_KROU_MACRO",
    "PPL_SAWA",
  ];

  // No people fiche that records the name it gives itself is reachable only
  // through its filed name and the names others gave it: each scores a piece
  // of its self-appellation, but for the seven fiches above.
  // @req REQ-125
  it("scores, for every people fiche with a self-appellation, a piece of it, but for seven that hold no name", () => {
    const withoutSelfName = peopleFiches()
      .filter((item) => {
        const self = item.nameFields?.[1] ?? "";
        return (
          self.trim() !== "" &&
          !peopleLeadForms({ ...item, nameFields: [self] }).length
        );
      })
      .map((item) => item.key)
      .sort();

    expect(withoutSelfName).toEqual(SELF_APPELLATION_WITHOUT_A_NAME);
  });

  // The examples of brief 16 keep their lead: each is reached through a
  // form that is one name, and that form's own score clears the floor.
  // @req REQ-125
  it("keeps the leads of « pakhalas », « icumama » and « ajumataw », each named by the form that scored", () => {
    const cases: [string, string, string][] = [
      ["pakhalas", "PPL_KOULANGO", "Pakhallas"],
      ["icumama", "PPL_ITESO", "Ikumama"],
      ["icumama", "PPL_KUMAM", "Ikumama"],
      ["ajumataw", "PPL_DIOLA", "Ajamataw"],
    ];

    for (const [query, key, form] of cases) {
      const lead = neighbours(query, { formsOfAPeople: true }).find(
        (item) => item.key === key
      );

      expect(lead, `${query} → ${key}`).toBeDefined();
      expect(peopleLeadForm(query, lead!)).toBe(form);
      expect(similarity(form, query)).toBeGreaterThanOrEqual(NEIGHBOUR_FLOOR);
    }
  });

  // Every form a people lead can be named by is one name, the filed name
  // included: « Baganda / Ganda » is two pieces, Baganda and Ganda. And every
  // name field a people fiche records, typed as written, gets a chip that is
  // one name and scores the floor itself, or no chip.
  // @req REQ-125
  it("names a people lead only by one name, over every name field of every people fiche", () => {
    const scoredNotOneName = peopleFiches().flatMap((item) =>
      peopleLeadForms(item)
        .filter((form) => !isOneName(form))
        .map((form) => `${item.key}: ${form}`)
    );
    const misnamed = peopleFiches()
      .flatMap((item) =>
        [...(item.nameFields ?? []), ...item.forms].map((typed) => ({
          key: item.key,
          typed,
          chip: peopleLeadForm(typed, item),
        }))
      )
      .filter(
        ({ typed, chip }) =>
          chip !== undefined &&
          (!isOneName(chip) || similarity(chip, typed) < NEIGHBOUR_FLOOR)
      );

    expect(scoredNotOneName).toEqual([]);
    expect(misnamed).toEqual([]);
  });

  // The other side of the rule: no clean name is lost. Read here without the
  // model's cut: each bracket set off by a space taken out as a qualifier,
  // each name field split at « , », « ; », « ou » and a slash between spaces.
  // Every piece that is one name must be scored. « Ta(m)berma » keeps its
  // brackets: they sit inside the word.
  // @req REQ-125
  it("scores every name that is one name in a people fiche's name fields", () => {
    const lost = peopleFiches().flatMap((item) =>
      (item.nameFields ?? []).flatMap((field) =>
        field
          .replace(/\s+\([^)]*\)/g, " ")
          .split(/[,;]|\s\/\s|\sou\s/)
          .map((piece) => piece.trim().replace(/ +/g, " "))
          .filter(isOneName)
          .filter((piece) => !peopleLeadForms(item).includes(piece))
          .map((piece) => `${item.key}: ${piece}`)
      )
    );

    expect(lost).toEqual([]);
  });

  // The withdrawn example: the Peul fiche writes « Felata », as François de
  // Medeiros wrote the name Fellata, and records Fellata as a name that can
  // be an insult in Sudan and Chad. A spelling our fiches record is no
  // misspelling to correct.
  // @req REQ-125
  it("finds « felata » written by the Peul fiche", () => {
    expect(fichesRecordingWord("felata")).toContain("PPL_FULA");
    expect(proseHits("felata").map((item) => item.key)).toContain("PPL_FULA");
  });
});
