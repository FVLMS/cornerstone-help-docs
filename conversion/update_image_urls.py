"""Replace local staged screenshot paths with hosted image URLs.

Default mode is a dry run. Fill final_sharepoint_url in image-manifest.csv, then run:

    python conversion/update_image_urls.py --apply

If the hosted image folder preserves the local directory structure under
image-upload-staging, a base URL can be used instead:

    python conversion/update_image_urls.py --base-url "https://example/path/" --apply
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path
from urllib.parse import quote


LOCAL_DOC_PREFIXES = ("../image-upload-staging/", "../assets/images-staged/")
LOCAL_MANIFEST_PREFIXES = ("image-upload-staging/", "assets/images-staged/")
IMAGE_RE = re.compile(
    r'(?P<prefix>src=["\'])\.\./(?P<folder>image-upload-staging|assets/images-staged)/(?P<path>[^"\']+)(?P<suffix>["\'])'
)


def quote_url_path(path: str) -> str:
    return "/".join(quote(part) for part in path.replace("\\", "/").split("/"))


def mapping_from_manifest(manifest_path: Path) -> tuple[dict[str, str], int]:
    mapping: dict[str, str] = {}
    missing_urls = 0

    with manifest_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {"local_image", "final_sharepoint_url"}
        if not required.issubset(reader.fieldnames or []):
            raise SystemExit(f"{manifest_path} must include local_image and final_sharepoint_url columns.")

        for row in reader:
            local_image = (row.get("local_image") or "").strip().replace("\\", "/")
            final_url = (row.get("final_sharepoint_url") or "").strip()
            if not local_image:
                continue
            if not local_image.startswith(LOCAL_MANIFEST_PREFIXES):
                raise SystemExit(f"Unexpected local_image path in manifest: {local_image}")
            if not final_url:
                missing_urls += 1
                continue
            mapping[f"../{local_image}"] = final_url

    return mapping, missing_urls


def mapping_from_base_url(base_url: str, images_dir: Path) -> dict[str, str]:
    base = base_url.rstrip("/")
    mapping: dict[str, str] = {}

    for image_path in images_dir.rglob("*"):
        if not image_path.is_file():
            continue
        relative = image_path.relative_to(images_dir).as_posix()
        local = f"{LOCAL_DOC_PREFIXES[0]}{relative}"
        mapping[local] = f"{base}/{quote_url_path(relative)}"

    return mapping


def rewrite_docs(docs_dir: Path, mapping: dict[str, str], apply: bool) -> tuple[int, int, set[str]]:
    files_changed = 0
    replacements = 0
    unresolved: set[str] = set()

    for doc_path in sorted(docs_dir.glob("*.md")):
        original = doc_path.read_text(encoding="utf-8")
        doc_replacements = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal doc_replacements
            local = f"../{match.group('folder')}/{match.group('path')}"
            hosted = mapping.get(local)
            if not hosted:
                unresolved.add(local)
                return match.group(0)
            doc_replacements += 1
            return f"{match.group('prefix')}{hosted}{match.group('suffix')}"

        updated = IMAGE_RE.sub(replace, original)
        if doc_replacements:
            files_changed += 1
            replacements += doc_replacements
            if apply:
                doc_path.write_text(updated, encoding="utf-8")

    return files_changed, replacements, unresolved


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write changes to docs. Omit for a dry run.")
    parser.add_argument("--base-url", help="Hosted base URL that mirrors image-upload-staging structure.")
    parser.add_argument("--docs-dir", default="docs")
    parser.add_argument("--images-dir", default="image-upload-staging")
    parser.add_argument("--manifest", default="conversion/image-manifest.csv")
    args = parser.parse_args()

    root = Path.cwd()
    docs_dir = root / args.docs_dir
    images_dir = root / args.images_dir
    manifest_path = root / args.manifest

    if args.base_url:
        mapping = mapping_from_base_url(args.base_url, images_dir)
        missing_urls = 0
    else:
        mapping, missing_urls = mapping_from_manifest(manifest_path)

    files_changed, replacements, unresolved = rewrite_docs(docs_dir, mapping, args.apply)

    mode = "updated" if args.apply else "would update"
    print(f"{mode} {replacements} image URL(s) across {files_changed} doc file(s).")
    if missing_urls:
        print(f"manifest rows without final_sharepoint_url: {missing_urls}")
    if unresolved:
        print(f"unresolved local image references: {len(unresolved)}", file=sys.stderr)
        for local in sorted(unresolved)[:25]:
            print(f"  {local}", file=sys.stderr)
        if len(unresolved) > 25:
            print("  ...", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
