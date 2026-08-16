from __future__ import annotations

import hashlib
import json
import struct
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON = ROOT / "package.json"
MANIFEST_JSON = ROOT / "manifest.json"

PACKAGE_FILES = (
    "LICENSE",
    "manifest.json",
    "options.html",
    "dist/background.js",
    "dist/content.js",
    "dist/options.js",
    "icons/icon-16.png",
    "icons/icon-32.png",
    "icons/icon-48.png",
    "icons/icon-128.png",
)


def load_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def png_dimensions(path: Path) -> tuple[int, int]:
    header = path.read_bytes()[:24]
    if header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise SystemExit(f"not a valid PNG: {path.relative_to(ROOT)}")
    return struct.unpack(">II", header[16:24])


def main() -> None:
    package = load_json(PACKAGE_JSON)
    manifest = load_json(MANIFEST_JSON)
    version = package.get("version")
    if not isinstance(version, str) or manifest.get("version") != version:
        raise SystemExit("package.json and manifest.json versions must match")
    if manifest.get("manifest_version") != 3:
        raise SystemExit("release manifest must use Manifest V3")

    name = manifest.get("name")
    description = manifest.get("description")
    if not isinstance(name, str) or len(name) > 75:
        raise SystemExit("manifest name must be at most 75 characters")
    if not isinstance(description, str) or len(description) > 132:
        raise SystemExit("manifest description must be at most 132 characters")

    missing = [path for path in PACKAGE_FILES if not (ROOT / path).is_file()]
    if missing:
        raise SystemExit(f"missing release files: {', '.join(missing)}")

    for size in (16, 32, 48, 128):
        path = ROOT / f"icons/icon-{size}.png"
        if png_dimensions(path) != (size, size):
            raise SystemExit(f"icon must be {size}x{size}: {path.relative_to(ROOT)}")

    included = set(PACKAGE_FILES)
    referenced = {
        str(manifest["background"]["service_worker"]),
        str(manifest["options_ui"]["page"]),
        *(str(path) for path in manifest["icons"].values()),
        *(str(path) for path in manifest["action"]["default_icon"].values()),
        *(
            str(path)
            for content_script in manifest["content_scripts"]
            for path in content_script["js"]
        ),
    }
    omitted = sorted(referenced - included)
    if omitted:
        raise SystemExit(f"manifest references unpackaged files: {', '.join(omitted)}")

    release_dir = ROOT / "release"
    release_dir.mkdir(exist_ok=True)
    output = release_dir / f"hn-guideline-collapser-{version}.zip"

    with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for relative_path in PACKAGE_FILES:
            data = (ROOT / relative_path).read_bytes()
            info = ZipInfo(relative_path, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compresslevel=9)

        corrupt = archive.testzip()
        if corrupt is not None:
            raise SystemExit(f"failed to verify packaged file: {corrupt}")

    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"Created {output.relative_to(ROOT)} ({output.stat().st_size} bytes)")
    print(f"SHA-256 {digest}")


if __name__ == "__main__":
    main()
