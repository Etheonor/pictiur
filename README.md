# Pictiúr

Optimize images 100% locally — convert, resize and compress in one pass, right in your browser.

- 🔒 **No upload**: processing runs locally in your browser (WebAssembly)
- ⚡ **PWA**: installable, works offline
- 🧩 **Formats**: JPEG (mozjpeg), PNG (oxipng), WebP, AVIF, JPEG XL

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

### Cloudflare Pages

The repo builds with **framework preset: Static**, build command
`pnpm install --frozen-lockfile && pnpm build`, output directory `build`.
`static/_redirects` (SPA fallback) and `static/_headers` (security headers) are included.

## License

MIT
