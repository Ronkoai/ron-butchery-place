#!/usr/bin/env python3
"""Check the translation set against the pages.

Verifies that
  * every data-i18n / data-i18n-html / data-i18n-attr key used in the five pages
    exists, non-empty, in ko / ja / zh / es;
  * the four dictionaries carry the same key set;
  * keys requested from JS (RonI18n.t('...')) exist;
  * every photograph in data/gallery.json has a title and alt in
    data/i18n/gallery.<lang>.json, and every place label is mapped;
  * the employer name stays private and no placeholder is malformed.

Usage: python3 scripts/check_i18n.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = ["ko", "ja", "zh", "es"]
PAGES = ["index.html", "about.html", "archive.html", "builds.html", "contact.html"]
BANNED = ["deepplant", "딥플랜트"]

problems = []


def load(path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def page_keys():
    keys = {}
    attr_re = re.compile(r'data-i18n-attr="([^"]+)"')
    text_re = re.compile(r'data-i18n(?:-html)?="([^"]+)"')
    for page in PAGES:
        html = (ROOT / page).read_text(encoding="utf-8")
        found = set(text_re.findall(html))
        for spec in attr_re.findall(html):
            for pair in spec.split(","):
                if ":" in pair:
                    found.add(pair.split(":", 1)[1].strip())
        for key in found:
            keys.setdefault(key, set()).add(page)
    return keys


def js_keys():
    keys = set()
    for name in ["js/gallery.js", "js/i18n.js"]:
        source = (ROOT / name).read_text(encoding="utf-8")
        keys.update(re.findall(r"\b[Tt]\(\s*'([^']+)'", source))
    return keys


def main() -> int:
    dicts = {lang: load(ROOT / "data" / "i18n" / f"{lang}.json") for lang in LANGS}
    html_keys = page_keys()
    script_keys = js_keys()

    all_keys = set(html_keys) | script_keys
    print(f"keys in pages and scripts: {len(all_keys)}")

    base = set(dicts[LANGS[0]])
    for lang in LANGS[1:]:
        missing = base - set(dicts[lang])
        extra = set(dicts[lang]) - base
        if missing:
            problems.append(f"{lang}.json is missing keys present in ko.json: {sorted(missing)}")
        if extra:
            problems.append(f"{lang}.json has keys not in ko.json: {sorted(extra)}")

    for lang in LANGS:
        dict_keys = set(dicts[lang])
        for key in sorted(all_keys - dict_keys):
            problems.append(f"{lang}.json: no translation for '{key}' (used in {sorted(html_keys.get(key, ['js']))})")
        for key, value in dicts[lang].items():
            if not isinstance(value, str) or not value.strip():
                problems.append(f"{lang}.json: empty value for '{key}'")
            if "{n}" in value and key != "gallery.count":
                problems.append(f"{lang}.json: unexpected placeholder in '{key}'")
        if "{n}" not in dicts[lang].get("gallery.count", ""):
            problems.append(f"{lang}.json: 'gallery.count' needs a {{n}} placeholder")
        for key, value in dicts[lang].items():
            lowered = value.lower()
            for banned in BANNED:
                if banned in lowered:
                    problems.append(f"{lang}.json: employer name leaked in '{key}'")

    # gallery captions
    gallery = load(ROOT / "data" / "gallery.json")
    sources = [item["src"] for item in gallery]
    places = {item.get("place", "") for item in gallery if item.get("place")}
    for lang in LANGS:
        data = load(ROOT / "data" / "i18n" / f"gallery.{lang}.json")
        items = data.get("items", {})
        missing = [src for src in sources if src not in items]
        if missing:
            problems.append(f"gallery.{lang}.json: {len(missing)} photographs without a caption, e.g. {missing[:3]}")
        for src, entry in items.items():
            for field in ("title", "alt"):
                if not entry.get(field):
                    problems.append(f"gallery.{lang}.json: '{src}' has no {field}")
        place_map = data.get("places", {})
        unmapped = sorted(place for place in places if place not in place_map)
        if unmapped:
            problems.append(f"gallery.{lang}.json: place labels not translated: {unmapped}")

    if problems:
        print("\nPROBLEMS")
        for item in problems:
            print(" -", item)
        return 1

    print("all keys translated in ko / ja / zh / es")
    print(f"gallery captions: {len(sources)} photographs x {len(LANGS)} languages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
