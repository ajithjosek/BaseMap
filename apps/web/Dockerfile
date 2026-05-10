FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY apps/web ./apps/web
COPY packages ./packages

RUN npx turbo build --filter=web

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package*.json ./

RUN npm install --only=production

EXPOSE 3000

CMD ["npm", "start"]
