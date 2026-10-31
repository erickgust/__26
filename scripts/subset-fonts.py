"""Subset the site's web fonts into a preloaded core file and a lazy extended file.

Run by hand, then commit the output (src/assets/fonts/*.woff2 + subsets.json):

    python3 -m venv .venv && .venv/bin/pip install 'fonttools[woff]==4.68.0'
    bun run fonts:subset

Rerun when:
- content gains a character outside ASCII, Latin-1 and Latin Extended-A
  (e.g. an arrow, €, Greek); the script scans src/ for them,
- CSS turns on an OpenType feature not in FEATURES (e.g. tabular-nums -> tnum),
- a source font in src/assets/fonts/source/ is replaced.
"""

import json
import unicodedata
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "src/assets/fonts"
SCAN_EXTS = {".astro", ".md", ".mdx", ".ts", ".css", ".txt", ".json"}

# PP Fraktion Mono keeps its full wght axis (200-800) on purpose. The CSS only
# uses 300/400/600, but narrowing the axis to 300-600 moves the default master,
# re-rounds every outline and changes anti-aliasing, for ~0.8 KB saved.

# Features browsers apply by default; nothing in the CSS enables others.
FEATURES = ["ccmp", "locl", "mark", "mkmk", "kern", "liga", "clig", "calt",
            "rlig", "rvrn", "rclt", "curs"]

BASE = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180))
# ASCII, nbsp, curly quotes, dashes, ellipsis, plus the site-chrome glyphs
# ← (writing pages), ↗, ©, ▶ and ⬛ (home) so no page needs the extended file for them.
CORE = set(range(0x20, 0x7F)) | {0xA0, 0x2018, 0x2019, 0x201C, 0x201D,
                                 0x2013, 0x2014, 0x2026, 0x2190, 0x2197, 0xA9,
                                 0x25B6, 0x2B1B}


def used_codepoints():
    cps = set()
    for path in (ROOT / "src").rglob("*"):
        if path.suffix not in SCAN_EXTS or FONTS in path.parents:
            continue
        for ch in path.read_text(encoding="utf-8"):
            # text-transform upper/lowercase is used across the site.
            for variant in (ch, ch.upper(), ch.lower()):
                cps.update(map(ord, variant))
    marks = sorted(c for c in cps if unicodedata.combining(chr(c)))
    if marks:
        # shortcut: marks land in the extended file, apart from their base letters,
        # so mark positioning breaks; NFC-normalize content instead of handling it.
        print("warning: combining marks in src/:", " ".join(f"U+{c:04X}" for c in marks))
    return {c for c in cps if c >= 0x20}


def unicode_range(cps):
    runs = []
    for c in sorted(cps):
        if runs and runs[-1][1] == c - 1:
            runs[-1][1] = c
        else:
            runs.append([c, c])
    return [f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in runs]


def make_subset(font_path, cps, out_path):
    options = subset.Options()
    options.layout_features = FEATURES
    options.hinting = False
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # keep copyright + license
    options.flavor = "woff2"
    font = TTFont(font_path, recalcTimestamp=False)  # reruns stay byte-identical
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=cps)
    subsetter.subset(font)
    font.save(out_path)
    got = set(TTFont(out_path).getBestCmap())
    assert got == cps, f"{out_path.name}: cmap mismatch {sorted(cps ^ got)}"


def main():
    used = used_codepoints()
    ranges = {}
    for name in ("PPFraktionMono-Variable", "GeistPixel-Square"):
        src = FONTS / "source" / f"{name}.woff2"
        cmap = set(TTFont(src).getBestCmap())
        keep = (BASE | CORE | used) & cmap
        core = keep & CORE
        ext = keep - core
        ranges[name] = {}
        for part, cps in (("core", core), ("ext", ext)):
            out = FONTS / f"{name}-{part}.woff2"
            make_subset(src, cps, out)
            ranges[name][part] = unicode_range(cps)
            print(f"{out.name}: {len(cps)} chars, {out.stat().st_size} bytes")
        print(f"  dropped {len(cmap - keep)} unused chars")
    (FONTS / "subsets.json").write_text(json.dumps(ranges, indent=2) + "\n")


if __name__ == "__main__":
    main()
