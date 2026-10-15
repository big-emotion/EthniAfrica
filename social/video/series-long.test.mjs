// @req REQ-186
// The long series video (Cartes 1.7.0): chapters, the chapter card in the
// voice's silence, the chapter kicker, readings, figures and the quoted person
// entering on their word, the signed position, the reminder, the two
// invitations and the next episode, the source label, and runs of one image.
// On the long demonstration (fixtures/series-long.mjs); no browser is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadSeriesVideo,
  seriesFrameState,
  seriesFrameCount,
} from "./series.mjs";
import { longDemo } from "./fixtures/series-long.mjs";

const dirs = [];
function long(options) {
  const dir = mkdtempSync(join(tmpdir(), "series-long-"));
  dirs.push(dir);
  return loadSeriesVideo(longDemo(dir, options), { dir });
}
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const FPS = 30;
const indexOf = (seq, id) => seq.cards.findIndex((c) => c.id === id);
const cardOf = (deck, id) => deck.cards.find((c) => c.id === id);
const withoutChapters = (beats) => beats.filter((b) => !b.chapter);

// @req REQ-186
test("1.7.0: a long video carries its chapters, each opened by a chapter card", () => {
  const seq = long();
  const seconds = seriesFrameCount(seq) / FPS;
  assert.ok(seconds > 120 && seconds < 240, `${seconds} s`);
  const chapters = seq.cards.filter((c) => c.type === "chapter");
  assert.deepEqual(
    chapters.map((c) => [c.chapter.n, c.chapter.of, c.chapter.title]),
    [
      [1, 3, "Un continent entier"],
      [2, 3, "D'où vient le mot"],
      [3, 3, "Ce que nous pensons"],
    ]
  );
  // The chapter card shows the chapter's first image by default.
  const first = indexOf(seq, "chapitre-1");
  assert.deepEqual(seq.cards[first].image, seq.cards[first + 1].image);
  assert.deepEqual(seq.warnings, []);
});

// @req REQ-186
test("1.7.0: a chapter card given its own image carries that image's credit", () => {
  const image = {
    src: "Series/tifinagh-algeria.jpg",
    w: 900,
    h: 529,
    focus: [0.5, 0.5],
    anchor: [0.5, 0.5],
    zoom: 1,
  };
  const credit =
    "Photo : Patrick Gruban, inscriptions en tifinagh (Algérie), 2006, Wikimedia Commons, CC BY-SA 2.0";
  const seq = long({
    edit: (input) => {
      const beat = input.beats.find(
        (b) => b.type === "chapter" && b.chapter === 2
      );
      beat.image = image;
      beat.credit = credit;
    },
  });
  const chapter = seq.cards[indexOf(seq, "chapitre-2")];
  assert.deepEqual(chapter.image, image);
  assert.equal(chapter.credit, credit);
});

// @req REQ-186
test("1.7.0: a video over 90 s without chapters, or with a chapter under 15 s, is refused", () => {
  assert.throws(
    () =>
      long({
        script: withoutChapters,
        edit: (input) => delete input.chapters,
      }),
    /Vidéo longue sans chapitres/
  );
  assert.throws(
    () =>
      long({
        script: (beats) => {
          beats.at(-2).chunks.forEach((c) => (c.duration = 3));
          return beats;
        },
      }),
    /Chapitre 3.*15 s/
  );
});

// @req REQ-186
test("1.7.0: a chaptered video outside 2 to 4 min loads with a warning", () => {
  const seq = long({
    script: (beats) => {
      for (const b of beats)
        // Chapters 1 and 2 shorter; chapter 3 keeps its 15 s.
        if (b.chunks && !/-0[67]$/.test(b.card))
          b.chunks.forEach((c) => (c.duration = Math.max(3, c.duration * 0.7)));
      return beats;
    },
  });
  assert.ok(
    seq.warnings.some((w) => /2 to 4 min/.test(w)),
    seq.warnings.join("; ")
  );
});

// @req REQ-186
test("1.7.0: the chapter card fills the voice's silence; a short silence is refused with the milliseconds missing", () => {
  const seq = long();
  const i = indexOf(seq, "chapitre-1");
  const full = seq.cardStarts[i + 1] - 9 - seq.cardStarts[i];
  assert.ok(full >= 36, `${full} frames at full opacity`);
  // No subtitle while the chapter card is on screen alone.
  for (let f = seq.cardStarts[i]; f < seq.cardStarts[i + 1] - 9; f++)
    assert.equal(seriesFrameState(seq, f).subtitle, null, `frame ${f}`);
  assert.throws(
    () =>
      long({
        script: (beats) => {
          beats.find((b) => b.chapter === 2).silence = 0.8;
          return beats;
        },
      }),
    /Chapitre 2 : le silence est trop court de \d+ ms/
  );
});

// @req REQ-186
test("1.7.0: every content card of a chapter shows « n · Titre »; a signed card reads « Nous pensons »", () => {
  const seq = long();
  const kicker = (id) => seq.cards[indexOf(seq, id)].videoKicker;
  assert.equal(kicker("serie-afrique-tout-02"), "1 · Un continent entier");
  assert.equal(kicker("serie-afrique-tout-rappel"), "2 · D'où vient le mot");
  assert.equal(kicker("serie-afrique-tout-06"), "Nous pensons");
  // The card's own kicker is not changed, so the carousel keeps it.
  assert.equal(
    seq.cards[indexOf(seq, "serie-afrique-tout-02")].kicker,
    "Le nom tel qu'on le dit"
  );
  assert.equal(kicker("serie-afrique-tout-01"), undefined);
});

// @req REQ-186
test("1.7.0: readings, figures and the quoted person enter on their word, over 9 frames", () => {
  const seq = long();
  const i = indexOf(seq, "serie-afrique-tout-02");
  const at = (frame) =>
    seriesFrameState(seq, frame).layers.find((l) => l.card === i);
  const start = seq.cardStarts[i];
  assert.deepEqual(at(start).items, [0, 0, 0]);
  const last = at(seq.cardStarts[i + 1] - 10);
  assert.deepEqual(last.items, [1, 1, 1]);
  const q = indexOf(seq, "serie-afrique-tout-02-cite");
  const quoted = (frame) =>
    seriesFrameState(seq, frame).layers.find((l) => l.card === q);
  assert.equal(quoted(seq.cardStarts[q]).attribution, 0);
  assert.equal(quoted(seq.cardStarts[q + 1] - 10).attribution, 1);
});

// @req REQ-186
test("1.7.0: a `say` missing from the card's chunks, or items read too fast, are refused", () => {
  assert.throws(
    () =>
      long({
        deck: (d) => {
          cardOf(d, "serie-afrique-tout-02").figures.items[0].say = "soixante";
          return d;
        },
      }),
    /Mot de la carte absent du sous-titre/
  );
  assert.throws(
    () =>
      long({
        deck: (d) => {
          cardOf(d, "serie-afrique-tout-04").readings.items.push(
            ...Array.from({ length: 3 }, () => ({ text: "x", say: "Afri" }))
          );
          return d;
        },
      }),
    /cinq lectures au plus/
  );
});

// @req REQ-186
test("1.7.0: a signed card carries no source; a sourced card never reads « Nous pensons »", () => {
  assert.throws(
    () =>
      long({
        deck: (d) => {
          cardOf(d, "serie-afrique-tout-06").source = "Une source";
          return d;
        },
      }),
    /Une carte signée ne porte pas de source/
  );
  assert.throws(
    () =>
      long({
        deck: (d) => {
          cardOf(d, "serie-afrique-tout-05").kicker = "Nous pensons";
          return d;
        },
      }),
    /« Nous pensons » sur une carte sourcée/
  );
  const unsigned = long({
    deck: (d) => {
      delete cardOf(d, "serie-afrique-tout-06").signed;
      return d;
    },
  });
  assert.ok(unsigned.warnings.some((w) => /signée/.test(w)));
});

// @req REQ-186
test("1.7.0: the reminder shows the opener's image and comes between 75 and 120 s", () => {
  const seq = long();
  assert.ok(
    seq.reminder.seconds >= 75 && seq.reminder.seconds <= 120,
    `${seq.reminder.seconds} s`
  );
  assert.throws(
    () =>
      long({
        deck: (d) => {
          cardOf(d, "serie-afrique-tout-rappel").image.focus = [0.2, 0.2];
          return d;
        },
      }),
    /Le rappel ne montre pas l'image d'ouverture/
  );
  const early = long({
    script: (beats) => {
      beats
        .find((b) => b.card === "serie-afrique-tout-02-cite")
        .chunks.forEach((c) => (c.duration = 4));
      return beats;
    },
  });
  assert.ok(early.warnings.some((w) => /75 et 120 s/.test(w)));
});

// @req REQ-186
test("1.7.0: the general invitation, word for word, after the signature line", () => {
  const general = (texts) =>
    long({
      script: (beats) => {
        beats
          .at(-1)
          .chunks.splice(
            3,
            2,
            ...texts.map((text) => ({ text, duration: 2.6 }))
          );
        return beats;
      },
      edit: (input) => {
        delete input.ending.search;
        input.ending.general = true;
        delete input.ending.next;
      },
    });
  const seq = general([
    "Vous aussi, cherchez votre nom sur EthniAfrica,",
    "lien en profil.",
  ]);
  assert.equal(seq.ending.general, true);
  assert.throws(
    () => general(["Cherchez votre nom sur EthniAfrica,", "lien en profil."]),
    /« Vous aussi, cherchez votre nom sur EthniAfrica, lien en profil. »/
  );
});

// @req REQ-186
test("1.7.0: the next episode sits under the pill, or on its own card after the general invitation", () => {
  const named = long();
  assert.equal(named.cards.at(-1).next, "le pays des Noirs");
  assert.ok(!named.cards.some((c) => c.type === "next"));
  const general = long({
    script: (beats) => {
      beats.at(-1).silence = 2.4;
      beats.at(-1).chunks.splice(
        3,
        2,
        {
          text: "Vous aussi, cherchez votre nom sur EthniAfrica,",
          duration: 2.8,
        },
        { text: "lien en profil.", duration: 1.4 }
      );
      return beats;
    },
    edit: (input) => {
      delete input.ending.search;
      input.ending.general = true;
    },
  });
  const own = general.cards.at(-2);
  assert.equal(own.type, "next");
  assert.equal(own.title, "le pays des Noirs");
  assert.equal(general.cards.at(-1).next, undefined);
});

// @req REQ-186
test("1.7.0: a source labelled in its own text is refused; `sourceLabel` names it", () => {
  assert.throws(
    () =>
      long({
        deck: (d) => {
          cardOf(d, "serie-afrique-tout-04").source = "Mot : Afri";
          return d;
        },
      }),
    /Le champ source porte déjà son étiquette/
  );
  assert.throws(
    () =>
      long({
        deck: (d) => {
          cardOf(d, "serie-afrique-tout-04").sourceLabel = "Références";
          return d;
        },
      }),
    /sourceLabel/
  );
});

// @req REQ-186
test("1.7.0: a run of one image changes the head only, under one zoom", () => {
  const seq = long();
  const i = indexOf(seq, "chapitre-1");
  // Mid-change from the chapter card to its first card: one image, one zoom.
  const mid = seriesFrameState(seq, seq.cardStarts[i + 1] - 4);
  const incoming = mid.layers.find((l) => l.card === i + 1);
  const outgoing = mid.layers.find((l) => l.card === i);
  assert.equal(incoming.opacity, 0);
  assert.equal(outgoing.opacity, 1);
  // The zoom goes on across the run rather than restarting.
  const after = seriesFrameState(seq, seq.cardStarts[i + 1]);
  const z = after.layers.find((l) => l.card === i + 1).zoom;
  assert.ok(z > 1.0005, `zoom ${z} at the second card of the run`);
});
