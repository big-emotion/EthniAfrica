#!/usr/bin/env python3
"""Marks the blocks of the frozen answer-page screens and writes manifest.json.

The screens are the operator's validated mockup (v11) and stay byte for byte
otherwise: this script only adds a `data-feed-block` attribute to the opening
tag of each top-level block, named in the vocabulary of
`src/lib/search/resultGrammar.ts`, and it is idempotent. The manifest is then
read back from those attributes, so the screens and the manifest cannot
disagree: `resultGrammarCharter.test.ts` holds both to the grammar.

Run from the repository root:
    python3 docs/design/mockups/search-answer/generate_manifest.py
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
SCREENS = [
    ("peul", "Peul.dc.html", "peul", "all"),
    ("peul-shorts", "Peul-Shorts.dc.html", "peul", "shorts"),
    ("lingala", "Lingala.dc.html", "lingala", "all"),
    ("bantou", "Bantou.dc.html", "bantou", "all"),
    ("congo", "Congo.dc.html", "congo", "all"),
    ("camara", "Camara.dc.html", "camara", "all"),
    ("pharaon", "Pharaon.dc.html", "pharaon", "all"),
]

TOP_LEVEL = re.compile(r"^  <(nav|section|a|div)\b", re.M)


def plain(markup: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", markup)).strip()


def classify(tag: str, markup: str, lens: str):
    text = plain(markup)
    if tag == "nav":
        return "lenses"
    # The invitation to correct: each screen words it for its own subject
    # (« Vous connaissez… », « Vous parlez… », « Vous portez ce nom ? »).
    if tag == "div" and text.startswith("Vous "):
        return "owed"
    if "s'appuient sur" in text:
        return "answer-sources"
    if "Et maintenant" in text:
        return "answer-next"
    if re.search(r"Voir la fiche|\bFiche\b", text) and tag in ("a", "div"):
        return "fiche-link"
    if tag == "section":
        if lens == "shorts":
            return "shorts"
        if "<h1" in markup:
            return "answer-what"
        h2 = re.search(r"<h2[^>]*>([^<]+)", markup)
        title = h2.group(1).strip() if h2 else ""
        if title.startswith("D'où vient"):
            return "answer-origin"
        if re.match(r"Ses |Son chemin", title):
            return "answer-names"
        if title in ("Où", "Qui y vit") or title.startswith("Où"):
            return "answer-where"
    return None


def annotate(path: Path, lens: str):
    source = path.read_text()
    head, sep, body = source.partition("</helmet>")
    positions = [(m.start(), m.group(1)) for m in TOP_LEVEL.finditer(body)]
    ends = [p for p, _ in positions[1:]] + [body.find("</x-dc>")]
    out, last, blocks = [], 0, []
    for (start, tag), end in zip(positions, ends):
        markup = body[start:end]
        block = classify(tag, markup, lens)
        if block is None:
            continue
        if block in blocks:
            continue  # the shorts view has two shelves, one block
        blocks.append(block)
        if 'data-feed-block="' not in markup.split(">", 1)[0]:
            out.append(body[last:start])
            out.append(f'  <{tag} data-feed-block="{block}"')
            last = start + len(f"  <{tag}")
    out.append(body[last:])
    path.write_text(head + sep + "".join(out))
    return blocks


def main():
    entries = []
    for case, file, query, lens in SCREENS:
        blocks = annotate(HERE / file, lens)
        entries.append(
            {"case": case, "file": file, "query": query, "lens": lens, "blocks": blocks}
        )
    (HERE / "manifest.json").write_text(
        json.dumps({"schemaVersion": 2, "entries": entries}, indent=2, ensure_ascii=False)
        + "\n"
    )


if __name__ == "__main__":
    main()
