// @req REQ-186
// Synthetic test assets and decisions; never a real publication or approval.
import { after } from "node:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  cpSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import sharp from "sharp";
import { renderSequence } from "../../../../social/renderer/render.mjs";
const template = mkdtempSync(join(tmpdir(), "ethnia-package-base-"));
after(() => rmSync(template, { recursive: true, force: true }));
const source = resolve("social/design-system");
const design = join(template, "social/design-system");
mkdirSync(join(design, "components"), { recursive: true });
mkdirSync(join(design, "assets"), { recursive: true });
for (const file of [
  "version.json",
  "tokens.json",
  "components/bundle.js",
  "components/bundle.css",
])
  cpSync(join(source, file), join(design, file));
cpSync(join(source, "fonts"), join(design, "fonts"), { recursive: true });
cpSync(resolve("social/renderer"), join(template, "social/renderer"), {
  recursive: true,
});
await sharp({
  create: { width: 1080, height: 1350, channels: 3, background: "#56606a" },
})
  .png()
  .toFile(join(design, "assets/plain.png"));
const cards = {
  version: JSON.parse(readFileSync(join(design, "version.json"))).version,
  logo: "plain.png",
  cards: [
    {
      id: "fixture",
      type: "opener",
      theme: "nuit",
      folio: "01/01",
      title: "Découvrons les noms",
      image: {
        src: "plain.png",
        w: 1080,
        h: 1350,
        focus: [0.5, 0.3],
        anchor: [0.5, 0.3],
      },
      imageAlt: "Un fond uni.",
      credit: "Image de test.",
    },
  ],
};
writeFileSync(join(template, "cards.json"), JSON.stringify(cards));
await renderSequence({
  input: join(template, "cards.json"),
  output: join(template, "exports"),
  design,
  assets: join(design, "assets"),
});
export function installPackageFixture(
  root,
  piece = "piece",
  networks = ["instagram", "facebook"]
) {
  cpSync(join(template, "social"), join(root, "social"), { recursive: true });
  mkdirSync(join(root, piece), { recursive: true });
  cpSync(join(template, "exports"), join(root, piece, "exports"), {
    recursive: true,
  });
  cpSync(join(template, "cards.json"), join(root, piece, "cards.json"));
  const file = (name, content) => {
    const rel = `${piece}/${name}`;
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(
      join(root, rel),
      typeof content === "string" ? content : JSON.stringify(content)
    );
    return rel;
  };
  const research = `${piece}/research.json`;
  if (!existsSync(join(root, research)))
    file("research.json", {
      schema: 1,
      subject: "Synthetic fixture",
      search: { terms: ["Synthetic fixture"], excluded: [] },
      records: [],
      noCorpusReason: "No test corpus",
      findings: [],
      images: [
        {
          file: "social/design-system/assets/plain.png",
          sourcePage: "https://example.org/test-image",
          creator: "Test fixture",
          description: "Synthetic background",
          reuseBasis: "Generated test fixture",
          credit: "Image de test.",
          crop: "Full image",
          rightsEvidence: file("rights.txt", "Synthetic test image permission"),
        },
      ],
      sources: [
        {
          id: "s1",
          kind: "written",
          citation: "Synthetic source",
          locator: "page 1",
          passage: "Fixture evidence",
          recordFile: file("source.txt", "Fixture evidence"),
          basis: "context",
        },
      ],
      claims: [
        {
          id: "c1",
          text: "Fixture claim",
          certainty: "supported",
          sources: ["s1"],
          limits: "Test only",
        },
      ],
      destination: {
        status: "no-link",
        invitation: "No link in test",
        reason: "Synthetic",
      },
    });
  const evidence = file(
    "account.txt",
    "Synthetic account capability verification"
  );
  const config = {
    schema: 1,
    input: `${piece}/cards.json`,
    render: `${piece}/exports`,
    design: "social/design-system",
    assets: "social/design-system/assets",
    research,
    networks: networks.map((network) => ({
      network,
      caption: "Découvrons ensemble les noms et leur histoire.",
      firstComment: null,
      link: { placement: "none" },
      capability: {
        account: "Synthetic account",
        checkedAt: "2026-10-10",
        observation:
          "Test only: image upload, copy limits and accessibility route",
        evidence,
        format: "photo-carousel",
        maxCards: 10,
        captionMax: 2000,
        commentMax: 2000,
        altRoute: "native",
        altMax: 5000,
        altInstruction: "Ajouter la description de chaque image.",
        linkPlacements: ["none"],
      },
    })),
  };
  const configPath = `${piece}/package-input.json`;
  const save = () => file("package-input.json", config);
  save();
  return {
    root,
    file,
    config,
    configPath,
    save,
    output: `${piece}/package-v1`,
  };
}
export function packageFixture(t) {
  const root = mkdtempSync(join(tmpdir(), "ethnia-package-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return installPackageFixture(root);
}
