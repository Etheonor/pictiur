# syntax=docker/dockerfile:1

# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Runtime: static nginx, single container (Coolify-ready) ----
FROM nginx:alpine
RUN apk add --no-cache apache2-utils
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security.conf /etc/nginx/security.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
ENTRYPOINT ["/usr/local/bin/entrypoint"]