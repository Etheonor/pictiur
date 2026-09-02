# Pictiúr

Optimize images 100% locally — convert, resize and compress in one pass, right in your browser.

- 🔒 **No upload**: processing runs locally in your browser (WebAssembly)
- ⚡ **PWA**: installable, works offline
- 🧩 **Formats**: JPEG (mozjpeg), PNG (oxipng), WebP, AVIF, JPEG XL; **HEIC/HEIF** (iPhone) input via WebAssembly
- 🔄 **Transform**: rotate (90/180/270) & mirror (H/V) per image, before the batch launch

## Development

```bash
pnpm install
pnpm dev
```

## Deployment

Pictiúr is a fully static app (adapter-static) — any static host works.

### Docker (self-hosted)

Simplest way — official Docker image:

```bash
docker run -d --name pictiur -p 3002:80 ghcr.io/etheonor/pictiur:latest
```

With password protection:

```bash
docker run -d --name pictiur -p 3002:80 \
  -e USERNAME=admin -e PASSWORD=your-password \
  ghcr.io/etheonor/pictiur:latest
```

Or with docker-compose — see `docker-compose.yml` (builds locally from the Dockerfile by default).

## Third-party

- [@discourse/heic](https://www.npmjs.com/package/@discourse/heic) (Apache-2.0), which embeds
  [libheif](https://github.com/strukturag/libheif) and [libde265](https://github.com/strukturag/libde265)
  (LGPL-3.0) compiled to WebAssembly — loading and decoding 100% client-side.

## License

MIT
