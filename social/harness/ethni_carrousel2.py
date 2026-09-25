"""Render one deck to the new gabarit — two formats, with a render report.

    ./venv/bin/python ethni_carrousel2.py <Sujet> [--sortie <dossier>]
    ./venv/bin/python ethni_carrousel2.py --brief memoires-sonores

Reads `<projet>/cards.json` at §10 and the project's `assets/`. Replaces the
retired-gabarit carousel script and its single-card sibling, both deleted once the
video engine had moved to `ethni_montage.py` too.

An opt-in editorial profile chooses its own formats and networks. The brief
command reads its canonical preparation guide and returns an empty scaffold.
Unknown or malformed profiles fail before asset loading; ordinary review and
composition failures still produce proofs.

**It always renders.** A lot that fails a gate goes to `_epreuves/` stamped and
annotated; a lot that passes goes to one folder per format, named after the
networks that format reaches (§1 bis, read from its « Reçoit » column). Nothing
here asks permission: a
proof is looked at, and that is how it gets decided.

The `linkedin` format (1080 × 1080) is retired from this loop: no network in
§1 bis's table receives it as an image any more, LinkedIn's own line taking a
text post instead. §1 still carries its pixel spec for the record.

The report is the deliverable, not a courtesy. It says which layout each card got
and **why**, each image's enlargement factor, which gates held, and the computed
output licence — so a layout can be argued with without reading this file.
"""
import json
import pathlib
import sys

from PIL import Image

import ethni_compose as gab
import ethni_tokens as tk
import ethni_carousel_profiles as carousel_profiles
from ethni_paths import resolve_project

FORMATS = ("carrousel", "reel")


def _pourquoi(plan, carte, image, fmt_key, deck):
    """The sentence that lets somebody contest a layout without reading code."""
    cadre = tk.fmt(fmt_key)
    sur_ech = max(cadre["w"] / image.width, cadre["h"] / image.height)
    signes = len(carte.get("corps") or "")

    if plan.ecart_regle:
        return (f"{plan.disposition} imposée par la carte — la règle disait "
                f"{plan.ecart_regle}")
    if plan.disposition == "B":
        return (f"B — {carte.get('role')} : le mot porte, {signes} signes "
                f"l'expliquent, et aucune paire ne dispute le centre")
    if sur_ech > tk.SUR_ECH_MAX:
        return (f"C — repli sur résolution : l'image serait agrandie ×{sur_ech:.1f}, "
                f"au-delà de ×{tk.SUR_ECH_MAX:.0f}")
    if tk.est_detoure(image):
        return "C — sujet détouré sur blanc : le plein cadre n'a rien à assombrir"
    if plan.disposition == "C":
        # §6 — measured, not counted, so the sentence says what was measured. A
        # character count here would be the very approximation the rule dropped.
        _, essai = gab.fond_et_plan(carte, deck, fmt_key, image=image, disposition="A")
        raison = ("elle ne tient qu'en cédant du corps" if essai.comprime
                  else (essai.fautes[0] if essai.fautes else "elle ne tient pas"))
        return (f"C — la colonne composée ne tient pas au-dessus du crédit "
                f"({signes} signes) : {raison}")
    return f"A — carte de série, image suffisante (×{sur_ech:.2f})"


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--brief":
        if len(sys.argv) != 3:
            raise SystemExit("usage: ethni_carrousel2.py --brief <profil>")
        try:
            print(json.dumps(carousel_profiles.brief(sys.argv[2]), ensure_ascii=False, indent=2))
        except ValueError as error:
            raise SystemExit(str(error)) from error
        return

    racine = resolve_project(sys.argv[1] if len(sys.argv) > 1 else None)
    deck = json.loads((racine / "cards.json").read_text(encoding="utf-8"))

    profile_errors = carousel_profiles.errors(deck)
    if profile_errors:
        raise SystemExit("\n".join(profile_errors))
    formats = carousel_profiles.formats(deck, FORMATS)

    if "cartes" not in deck:
        raise SystemExit(
            f"{racine.name} : cards.json est encore à l'ancien schéma. Lance "
            f"`node social/tools/migrate-cards/migrate-cards.mjs {racine.name}`")

    assets = racine / "assets"
    images = {}
    for carte in deck["cartes"]:
        fichier = carte["image"]["fichier"]
        chemin = assets / fichier
        if not chemin.exists():
            raise SystemExit(f"carte {carte['rang']} : {chemin} est introuvable")
        images[fichier] = Image.open(chemin).convert("RGB")

    verdict = gab.portes(deck["cartes"], deck)
    deck["licence_sortie"] = verdict.licence_sortie

    # §5 — the message gate, read from the verdicts filed beside the deck. It is
    # the fifth of the five `ethniafrica-produire` names, and the engine held only
    # four until 2026-09-16: a lot that cleared licences, credits, internal notes
    # and enlargement was filed as publishable however the message audit had ruled.
    # It refuses nothing that the others do not already refuse the same way — the
    # lot still renders, it renders as a proof.
    message = gab.porte_message(racine)
    if message:
        verdict = gab.Verdict(passe=False, manquantes=verdict.manquantes + message,
                              licence_sortie=verdict.licence_sortie,
                              remarques=verdict.remarques)

    # §6 — the layout quota is a property of the lot, so it has to be known before
    # a single file is written: a deck out of quota must not reach `images/`.
    # Planning costs nothing to run twice — it asserts geometry without drawing —
    # and the render loop below re-plans rather than carrying state between passes.
    #
    # Measured per format. A card can be A in `carrousel` and fall to C in `reel`,
    # where the same file is enlarged further, and each format ships on its own.
    quotas = []
    for fmt_key in formats:
        dispositions = [
            (c["rang"], gab.plan(c, deck, fmt_key,
                                 image=images[c["image"]["fichier"]]).disposition)
            for c in deck["cartes"]]
        quotas += gab.quota(dispositions, fmt_key)

    if quotas:
        verdict = gab.Verdict(passe=False, manquantes=verdict.manquantes + quotas,
                              licence_sortie=verdict.licence_sortie,
                              remarques=verdict.remarques)

    # Composition faults are a property of the lot too, and for the same reason:
    # the verdict decides *where* a render is filed, so everything that can refuse
    # the lot has to be known before the first file is written.
    #
    # Measured on `diallo-djallo`, 2026-09-16. This pass used to live inside the
    # render loop, so the destination was chosen from a verdict that still said
    # « passe » and the twelve renders landed in the network folders — unstamped,
    # unsuffixed, one upload away from publication — while the report went to
    # `_epreuves/` announcing that the four gates had been cleared. Nothing in the
    # run said the two disagreed.
    #
    # Planning and painting cost nothing to run twice: neither writes.
    fautes = []
    blocages = []
    rangees = []
    for carte in deck["cartes"]:
        image = images[carte["image"]["fichier"]]
        for fmt_key in formats:
            plan = gab.plan(carte, deck, fmt_key, image=image)
            cadre = tk.fmt(fmt_key)
            sur_ech = max(cadre["w"] / image.width, cadre["h"] / image.height)

            # The plan says what should be on the card; painting says what is.
            # Nothing compared them, and three blocks went missing that way — the
            # rank's total, the pastille and the lockup.
            for nom in gab.blocs_non_peints(carte, deck, fmt_key, image=image):
                blocages.append(f"carte {carte['rang']:02d} en {fmt_key} : "
                                f"« {nom} » est au plan et n'est pas peint")
            pourquoi = _pourquoi(plan, carte, image, fmt_key, deck)
            if plan.fautes:
                # A composition fault is not a remark. A lot that could not be made
                # legible without drowning its own photograph does not ship.
                blocages.extend(f"carte {carte['rang']:02d} en {fmt_key} : {f}"
                                for f in plan.fautes)
                pourquoi += " — **" + " · ".join(plan.fautes) + "**"
                fautes.append(f"carte {carte['rang']:02d} en {fmt_key} : {plan.fautes[0]}")
            rangees.append(
                f"| {carte['rang']:02d} | {fmt_key} | {plan.disposition} | "
                f"{pourquoi} | ×{sur_ech:.2f} |")
            print(f"  {carte['rang']:02d} {fmt_key} → {plan.disposition}", flush=True)

    if blocages:
        verdict = gab.Verdict(passe=False,
                              manquantes=verdict.manquantes + blocages,
                              licence_sortie=verdict.licence_sortie,
                              remarques=verdict.remarques)

    # `outDir` in the retired schema pointed straight at `images/`. The proof
    # folder is its sibling, not its child: an épreuve inside `images/` is one
    # upload away from being published, which is the one thing it must not be.
    sortie = pathlib.Path(deck.get("outDir", racine / "rendus")).expanduser()
    if sortie.name == "images":
        sortie = sortie.parent

    # A lot that clears its gates lands one folder per format, named after the
    # networks §1 bis gives that format. When a previous gabarit's renders are
    # already sitting there, that means dropping a second set beside a set
    # somebody could upload — and the two are indistinguishable in a file
    # picker. So the lot goes to `_epreuves/` instead unless the operator says to
    # replace, and it says which.
    #
    # This is not hypothetical: a verification pass on 2026-09-10 put 189 files
    # next to the 199 already there, and they had to be moved back out one deck
    # at a time.
    dossiers_reseaux = {fmt_key: "-".join(tk.reseaux(fmt_key, deck)) for fmt_key in formats}
    deja = {nom: sortie / nom for nom in sorted(set(dossiers_reseaux.values()))}
    encombres = {nom: chemin for nom, chemin in deja.items()
                if chemin.exists()
                and any(f.suffix.lower() in (".png", ".jpg") for f in chemin.iterdir())}
    encombre = bool(encombres)

    # Captured before the render and moved *after* it. Replacing means replacing —
    # two generations in one folder are indistinguishable in a file picker — but
    # the set-aside must never run before the replacement exists.
    #
    # Mercator lost fifteen renders to the other order: its lot failed gate 1 and
    # went to `_epreuves/`, so no network folder ever received anything, while the
    # previous generation had already been carried out of it.
    remplacer = verdict.passe and encombre and "--remplacer" in sys.argv
    a_ecarter = ([f for chemin in encombres.values() for f in chemin.iterdir()
                 if f.suffix.lower() in (".png", ".jpg")]
                 if remplacer else [])

    if verdict.passe and encombre and "--remplacer" not in sys.argv:
        noms = ", ".join(f"`{nom}/`" for nom in encombres)
        total_existant = sum(len(list(c.glob("*.png"))) for c in encombres.values())
        verdict = gab.Verdict(
            passe=False,
            manquantes=[
                f"{noms} porte(nt) déjà {total_existant} rendus de l'ancien "
                f"gabarit — relance avec `--remplacer` pour les remplacer, ou "
                f"vide le(s) dossier(s) d'abord"],
            licence_sortie=verdict.licence_sortie)
    lignes = [f"# Rendu — {deck.get('campagne')}", "",
              f"licence de sortie calculée : **{verdict.licence_sortie or 'aucune'}**", ""]
    lignes += carousel_profiles.report(deck)

    if verdict.passe:
        cibles = ", ".join(f"{fmt_key} → `{nom}/`" for fmt_key, nom in dossiers_reseaux.items())
        lignes += [f"Les cinq portes sont franchies. Le lot part par réseau : {cibles}.", ""]
    else:
        lignes += ["**Épreuve.** Portes non franchies :", ""]
        lignes += [f"- {m}" for m in verdict.manquantes]
        lignes += ["", "Le lot reste dans `_epreuves/` et le sujet en 🟡.", ""]

    ecrits = set()
    if verdict.remarques:
        lignes += ["", "**À regarder de près.** Ces cartes passent, mais le crédit et "
                   "l'identité ne se recoupent pas :", ""]
        lignes += [f"- {r}" for r in verdict.remarques]
        lignes += [""]

    lignes += ["", "## Qui a compar\u00e9 le cr\u00e9dit \u00e0 l'image", "",
               "| Carte | Image | Signature |", "| --- | --- | --- |"]
    lignes += [f"| {c['rang']:02d} | {c['image']['fichier']} | {gab.signature(c['image'])} |"
               for c in deck["cartes"]]
    lignes += [""]

    # §6 — the quota, stated whether or not it held. A deck that scrapes past it is
    # as much a signal to `structure` as one that fails.
    lignes += ["## Répartition des dispositions", "",
               f"§6 — au moins {tk.QUOTA_A_MIN:.0%} en A, au plus "
               f"{tk.QUOTA_C_MAX:.0%} en C, au plus {tk.QUOTA_B_MAX} en B.", "",
               "| Format | A | B | C | Quota |", "| --- | --- | --- | --- | --- |"]
    for fmt_key in formats:
        ds = [gab.plan(c, deck, fmt_key,
                       image=images[c["image"]["fichier"]]).disposition
              for c in deck["cartes"]]
        tenu = "tenu" if not gab.quota(list(enumerate(ds)), fmt_key) else "**hors quota**"
        lignes.append(f"| {fmt_key} | {ds.count('A')} | {ds.count('B')} | "
                      f"{ds.count('C')} | {tenu} |")
    lignes += [""]

    lignes += ["| Carte | Format | Disposition | Pourquoi | Agrandissement |",
               "| --- | --- | --- | --- | --- |"]

    # The verdict is settled above, so this loop only writes: every card of the lot
    # is filed the same way, and none of them can be filed on a verdict a later
    # card is about to overturn.
    lignes += rangees
    for carte in deck["cartes"]:
        image = images[carte["image"]["fichier"]]
        for fmt_key in formats:
            _, ecrit = gab.rendre(carte, deck, fmt_key, image=image, racine=sortie,
                                  verdict=verdict)
            ecrits.add(ecrit.name)

    # The new generation is on disk, so the old one can step aside: only the files
    # that were there before, and only those the render did not overwrite.
    if a_ecarter:
        ecartes = 0
        for f in a_ecarter:
            # By name, not by existence: a re-render writes the same filenames, so
            # the path still exists — pointing at the new file. Checking existence
            # carried the fresh generation into the attic and emptied the network
            # folder it came from.
            if f.name in ecrits:
                continue
            if f.exists():
                # Namespaced by the source folder: `carrousel` and `reel` no
                # longer share one destination the way `images/` did, so a flat
                # attic would let a same-named leftover from one silently
                # overwrite the other's — the one thing this step must not do.
                sous_grenier = sortie / "_rendus-remplaces" / f.parent.name
                sous_grenier.mkdir(parents=True, exist_ok=True)
                f.rename(sous_grenier / f.name)
                ecartes += 1
        if ecartes:
            print(f"{ecartes} rendus remplac\u00e9s d\u00e9plac\u00e9s dans "
                  f"_rendus-remplaces/", flush=True)

    # A passing lot no longer has a single folder to nest the report under — it
    # has one per format — so the report sits at the post's root instead.
    rapport = sortie / "_epreuves" / "RENDU.md" if not verdict.passe else sortie / "RENDU.md"
    # `rendre()` creates `_epreuves/` on its way past, but only for a lot it knows
    # is a proof. A lot refused after the last card was written found no folder
    # here and died on the report instead of filing one.
    rapport.parent.mkdir(parents=True, exist_ok=True)
    rapport.write_text("\n".join(lignes) + "\n", encoding="utf-8")

    if fautes:
        print(f"\n{len(fautes)} faute(s) de composition — du texte n'a pas tenu :")
        for f in fautes:
            print("  • " + f)

    total = len(deck["cartes"]) * len(formats)
    if verdict.passe:
        cibles = ", ".join(f"{nom}/" for nom in sorted(set(dossiers_reseaux.values())))
        print(f"\n{total} images → {cibles}")
    else:
        print(f"\n{total} images → {rapport.parent}")
    print(f"rapport : {rapport}")
    print(f"licence de sortie : {verdict.licence_sortie or 'aucune'}")
    if not verdict.passe:
        print(f"\nÉPREUVE — {len(verdict.manquantes)} porte(s) non franchie(s) :")
        for m in verdict.manquantes:
            print("  • " + m)
    if verdict.remarques:
        print(f"\n{len(verdict.remarques)} remarque(s) — le lot passe, mais regarde :")
        for r in verdict.remarques:
            print("  ~ " + r)


if __name__ == "__main__":
    main()
