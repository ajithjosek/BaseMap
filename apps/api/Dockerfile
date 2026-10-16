FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
# legacy-peer-deps: @nestjs/apollo@13 peers @apollo/server@^5 while we pin ^4.
COPY .npmrc ./

RUN npm install

COPY apps/api ./apps/api
COPY packages ./packages

# Generate the Prisma client before building (outputs to node_modules/.prisma).
# generate does not connect to the database; the placeholder URL only satisfies
# prisma.config.ts (the real DATABASE_URL is supplied at runtime).
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    npx prisma generate --schema apps/api/prisma/schema.prisma

RUN npx turbo build --filter=api

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# nest build emits to dist/src/ (sourceRoot is preserved).
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
# Schema + migrations are kept so migrations can be run against this image.
COPY --from=builder /app/apps/api/prisma ./prisma
# legacy-peer-deps so this prod-only install resolves (see .npmrc).
COPY .npmrc ./

RUN npm install --omit=dev

# The generated Prisma client is not an npm package; copy it in explicitly.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# main.ts falls back to 4001 when PORT is unset; pin the container to the port
# that EXPOSE and docker-compose expose (4000).
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/src/main"]
