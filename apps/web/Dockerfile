FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY .npmrc ./
COPY apps/web/package*.json ./apps/web/
# Workspace packages must be present before the install so npm links them into
# node_modules (the web app imports @basemap/utils at build time).
COPY packages ./packages

RUN npm install

COPY apps/web ./apps/web

# next.config.ts bakes the /api rewrite destination into the build output, so the
# internal API URL must be known at build time (a runtime env has no effect).
ARG API_INTERNAL_URL=http://localhost:4001
ENV API_INTERNAL_URL=$API_INTERNAL_URL

RUN npx turbo build --filter=web

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package*.json ./
COPY .npmrc ./

RUN npm install --omit=dev

EXPOSE 3000

CMD ["npm", "start"]
