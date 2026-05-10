FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY apps/api ./apps/api
COPY packages ./packages

RUN npx turbo build --filter=api

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./

RUN npm install --only=production

EXPOSE 4000

CMD ["node", "dist/main"]
