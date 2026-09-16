"""Move a post's flat `images/` onto the per-network layout, once.

    ./venv/bin/python migrer_dossiers_reseaux.py <ETHNIAFRICA_SOCIAL_POSTS>            liste, ne bouge rien
    ./venv/bin/python migrer_dossiers_reseaux.py <ETHNIAFRICA_SOCIAL_POSTS> --write     déplace pour de vrai

`ethni_carrousel2.py` filed every passing render into `images/` until
2026-09-16; it now files by network (§1 bis). Six already-validated posts in
the library still carry the old, flat folder. This script is the one-time
catch-up, not a permanent part of the engine — it moves files, it renders
nothing, and it archives rather than deletes the retired `linkedin` renders
nobody's format table receives any more.

Dry-run by default, on purpose: this walks the production library, not a
scratch directory.
"""
import pathlib
import re
import sys

import ethni_tokens as tk

_NOM_FICHIER = re.compile(r"_(?:carrousel|linkedin|reel)_\d+x\d+\.(?:png|jpe?g)$", re.I)
_FORMAT = re.compile(r"_(carrousel|linkedin|reel)_\d+x\d+\.")


def planifier(post, fichiers):
    """The move plan for one post's `images/` file list, as (source, cible) pairs.

    A pure function of names, not of the filesystem, so the plan can be checked
    without a real post. `post` is the post's own folder — every source sits
    under its `images/`, every destination is a sibling of it, the same shape
    the engine now writes on a fresh render.
    """
    images = post / "images"
    plan = []
    for nom in fichiers:
        if nom == "RENDU.md":
            plan.append((images / nom, post / nom))
            continue
        if not _NOM_FICHIER.search(nom):
            continue
        fmt = _FORMAT.search(nom).group(1)
        if fmt == "linkedin":
            cible = post / "_non-publie" / nom
        else:
            cible = post / "-".join(tk.reseaux(fmt)) / nom
        plan.append((images / nom, cible))
    return plan


def _postes_a_migrer(racine):
    for images in racine.rglob("images"):
        if not images.is_dir():
            continue
        fichiers = [f.name for f in images.iterdir()
                    if f.is_file() and not f.name.startswith(".")]
        if any(f.lower().endswith((".png", ".jpg", ".jpeg")) for f in fichiers):
            yield images.parent, fichiers


def main():
    if len(sys.argv) < 2:
        raise SystemExit(f"usage: {sys.argv[0]} <bibliothèque> [--write]")
    racine = pathlib.Path(sys.argv[1]).expanduser().resolve()
    ecrire = "--write" in sys.argv

    total = 0
    for post, fichiers in _postes_a_migrer(racine):
        images = post / "images"
        plan = planifier(post, fichiers)
        print(f"\n{post.relative_to(racine)} — {len(plan)} fichier(s)")
        for source, cible in plan:
            print(f"  images/{source.name} -> {cible.relative_to(post)}")
            if ecrire:
                cible.parent.mkdir(parents=True, exist_ok=True)
                source.rename(cible)
        total += len(plan)
        if ecrire and not any(images.iterdir()):
            images.rmdir()

    mot = "déplacé(s)" if ecrire else "à déplacer (relance avec --write)"
    print(f"\n{total} fichier(s) {mot}")


if __name__ == "__main__":
    sys.exit(main())
