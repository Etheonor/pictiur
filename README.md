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

## Usage (self-hosted)

La façon la plus simple — image Docker officielle :

```bash
docker run -d --name pictiur -p 3002:80 ghcr.io/etheonor/pictiur:latest
```

Avec protection par mot de passe :

```bash
docker run -d --name pictiur -p 3002:80 \
  -e USERNAME=admin -e PASSWORD=motdepasse \
  ghcr.io/etheonor/pictiur:latest
```

Ou en docker-compose : voir `docker-compose.yml`.
Déploiement Coolify : voir « Déploiement » plus bas.

## Déploiement (Coolify)

1. **+ Nouveau → Docker Image**
2. **Image** : `ghcr.io/etheonor/pictiur:latest`
3. **Domaine** : ex. `https://px.example.com` _(route Traefik + certificat Let's Encrypt automatiques)_
4. **Ports Exposes** : `80` _(indispensable : sans lui, le proxy ne sait pas où router)_
5. **Variables d'environnement** (optionnel — pour protéger l'instance) :

   ```
   USERNAME=admin
   PASSWORD=<mot-de-passe>
   ```

   _(laisser vide pour une démo publique sans login)_

6. **Deploy**

⚠️ **Pièges Coolify** : ne **pas** renseigner _Ports Exposes_ → 503 au premier essai. Si l'image
ghcr.io est privée : réglages du serveur → registres (token `read:packages`) ou rends le paquet
public (Packages → Make public).

## License

MIT
