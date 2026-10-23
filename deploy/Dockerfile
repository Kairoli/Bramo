# Image de production de Bramo (serveur + client construit). Construite depuis la racine du dépôt :
#   docker compose -f deploy/docker-compose.prod.yml build
FROM node:22-alpine AS build
WORKDIR /bramo
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY . .
RUN pnpm install --frozen-lockfile
# Le client (fichiers statiques servis par Caddy) ; le serveur tourne avec tsx, sans étape de compilation.
RUN pnpm --filter @bramo/web build

FROM node:22-alpine
WORKDIR /bramo
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY --from=build /bramo /bramo
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    TRUST_PROXY=1
EXPOSE 3001
USER node
CMD ["pnpm", "--filter", "@bramo/server", "start"]
