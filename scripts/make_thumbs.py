#!/usr/bin/env python3
"""Generate thumbnails for the photo archive and print gallery.json entries.

Photos live under images/archive/YYYY/YYYY-MM-DD_slug/ and the list versions
go next to them in a thumbs/ folder:

    images/archive/2025/2025-08-19_gwangpyung/01.jpg
    images/archive/2025/2025-08-19_gwangpyung/thumbs/01.jpg

Usage:
    python3 scripts/make_thumbs.py             # only missing / outdated thumbs
    python3 scripts/make_thumbs.py --force     # rebuild everything
    python3 scripts/make_thumbs.py --width 640 --quality 85

Needs Pillow:  python3 -m pip install Pillow

Every photo it touches is printed at the end as an entry you can paste into
data/gallery.json. Title, place, tags and alt are left empty on purpose —
they are yours to fill in, so nothing gets guessed.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: python3 -m pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / "images" / "archive"
THUMB_DIR = "thumbs"
PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

DATE_FOLDER = re.compile(r"^(\d{4}-\d{2}-\d{2})_(.+)$")


def find_photos(archive: Path) -> list[Path]:
    photos = []
    for path in sorted(archive.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in PHOTO_EXTENSIONS:
            continue
        if THUMB_DIR in path.relative_to(archive).parts:
            continue
        photos.append(path)
    return photos


def thumb_path_for(photo: Path) -> Path:
    return photo.parent / THUMB_DIR / (photo.stem + ".jpg")


def folder_facts(photo: Path) -> tuple[str, str]:
    """Return (date, slug) read from the YYYY-MM-DD_slug folder, if present."""
    date, slug = "", ""
    for part in photo.relative_to(ARCHIVE).parts[:-1]:
        match = DATE_FOLDER.match(part)
        if match:
            date, slug = match.group(1), match.group(2)
    return date, slug


def make_thumb(photo: Path, target: Path, width: int, quality: int) -> tuple[int, int]:
    with Image.open(photo) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        image.thumbnail((width, width * 4), Image.LANCZOS)
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "JPEG", quality=quality, optimize=True, progressive=True)
        return image.size


def entry_for(photo: Path, size: tuple[int, int]) -> dict:
    date, _slug = folder_facts(photo)
    return {
        "src": photo.relative_to(ROOT).as_posix(),
        "thumb": thumb_path_for(photo).relative_to(ROOT).as_posix(),
        "date": date,
        "title": "",
        "place": "",
        "tags": [],
        "alt": "",
        "width": size[0],
        "height": size[1],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Make archive thumbnails.")
    parser.add_argument("--width", type=int, default=480, help="max thumbnail width in px (default 480)")
    parser.add_argument("--quality", type=int, default=82, help="JPEG quality, 1-95 (default 82)")
    parser.add_argument("--force", action="store_true", help="rebuild thumbs that already exist")
    args = parser.parse_args()

    if not ARCHIVE.is_dir():
        print(f"No archive folder yet: {ARCHIVE.relative_to(ROOT)}")
        print("Put photos in images/archive/YYYY/YYYY-MM-DD_slug/ first.")
        return 0

    photos = find_photos(ARCHIVE)
    if not photos:
        print(f"No photos found under {ARCHIVE.relative_to(ROOT)}.")
        return 0

    made, skipped, failed = [], 0, []
    for photo in photos:
        target = thumb_path_for(photo)
        fresh = target.exists() and target.stat().st_mtime >= photo.stat().st_mtime
        if fresh and not args.force:
            skipped += 1
            continue
        try:
            size = make_thumb(photo, target, args.width, args.quality)
        except Exception as error:  # noqa: BLE001 - report and keep going
            failed.append((photo, error))
            continue
        made.append(entry_for(photo, size))
        print(f"thumb  {target.relative_to(ROOT)}  ({size[0]}x{size[1]})")

    print()
    print(f"{len(made)} created, {skipped} up to date, {len(failed)} failed.")
    for photo, error in failed:
        print(f"  ! {photo.relative_to(ROOT)}: {error}")

    if made:
        print("\nPaste these into data/gallery.json and fill in title / place / tags / alt:\n")
        print(json.dumps(made, ensure_ascii=False, indent=2))
    elif skipped:
        print("Nothing to do. Use --force to rebuild existing thumbnails.")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
