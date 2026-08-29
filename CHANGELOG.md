# Changelog

## [1.2.0] — 2026-08-29

### Added

- **Download all images individually** (next to the ZIP button)
- Staged file **summary with thumbnails**; mobile flow: dropzone → summary → settings → buttons → results

### Fixed

- Comparison now **decodes HEIC inputs** for the "before" preview (no more broken image)
- HEIC/HEIF listed in the dropzone accepted formats
- Long filenames ellipsize instead of overflowing (no horizontal scroll)

## [1.1.0] — 2026-08-28

### Added

- **HEIC / HEIF** input support (lazy WASM decoder, Apache-2.0)
  - also detected by extension (iPhone shares photos as `application/octet-stream`)
  - no output change: webp/avif/jpeg/jxl, resize, quality, budget, ZIP

### Changed

- `Codec.encode` is now optional (decode-only codecs)
- The output-format dropdown only lists encode codecs

## [1.0.0] — 2026-08-27

### Added

- 100% local image optimizer (WebAssembly, no upload)
- Formats: JPEG (mozjpeg), PNG (oxipng), WebP, AVIF, JPEG XL
- Resize (contain/cover/fill), fixed quality, target size in KB
- Multi-file batch: progress, cancellation, ZIP export
- Before/after comparison
- Installable PWA, fully functional offline
- FR/EN localization
- MIT license, complete docs, CI, official Docker image