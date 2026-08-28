# Pictiúr

Optimize images 100% locally — convert, resize and compress in one pass, right in your browser.

- 🔒 **No upload**: processing runs locally in your browser (WebAssembly)
- ⚡ **PWA**: installable, works offline
- 🧩 **Formats**: JPEG (mozjpeg), PNG (oxipng), WebP, AVIF, JPEG XL; **HEIC/HEIF** (iPhone) input via WebAssembly

## Development

```bash
pnpm install
pnpm dev
```

## Deployment

Pictiúr is a fully static app (adapter-static) — any static host works.

### Docker (self-hosted / Coolify)

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

**Coolify deploy steps:**

1. **+ New → Docker Image**
2. **Image**: `ghcr.io/etheonor/pictiur:latest`
3. **Domain**: e.g. `https://px.example.com` _(Traefik route + automatic Let's Encrypt certificate)_
4. **Ports Exposes**: `80` _(required — without it the proxy doesn't know where to route)_
5. **Environment variables** (optional — to protect the instance):

   ```
   USERNAME=admin
   PASSWORD=<your-password>
   ```

   _(leave empty for a public demo without login)_

6. **Deploy**

⚠️ **Coolify pitfalls**: do **not** leave _Ports Exposes_ empty → 503 on first attempt. If the
ghcr.io image is private: server settings → registries (token `read:packages`) or make the
package public (Packages → Make public).

## Third-party

- [@discourse/heic](https://www.npmjs.com/package/@discourse/heic) (Apache-2.0), which embeds
  [libheif](https://github.com/strukturag/libheif) and [libde265](https://github.com/strukturag/libde265)
  (LGPL-3.0) compiled to WebAssembly — loading and decoding 100% client-side.

## License

MIT
