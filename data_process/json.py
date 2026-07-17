"""Print download links recorded in the land-cover metadata file.

This file keeps its original project name for compatibility. Because the name
shadows Python's standard-library ``json`` module, the script temporarily
removes its own directory from ``sys.path`` before importing that module.
"""

from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path = [path for path in sys.path if Path(path or ".").resolve() != SCRIPT_DIR]
import json  # noqa: E402

ROOT_DIR = SCRIPT_DIR.parent
METADATA_PATH = ROOT_DIR / "data" / "LandCover.json"


def add_url(urls, value):
    if isinstance(value, str) and value.strip():
        urls.add(value.strip())


def main():
    with METADATA_PATH.open(encoding="utf-8") as file:
        metadata = json.load(file)

    urls = set()
    link = metadata.get("link")
    if isinstance(link, dict):
        add_url(urls, link.get("url"))
    else:
        add_url(urls, link)

    for item in metadata.get("relatedItems", []):
        if not isinstance(item, dict):
            continue
        item_link = item.get("link")
        if isinstance(item_link, dict):
            add_url(urls, item_link.get("url"))
        else:
            add_url(urls, item_link)

    for file_info in metadata.get("files", []):
        if isinstance(file_info, dict):
            add_url(urls, file_info.get("url"))

    if not urls:
        print("No direct download URL was found in LandCover.json.")
        return

    print("Land-cover links:")
    for url in sorted(urls):
        print(f"- {url}")


if __name__ == "__main__":
    main()
