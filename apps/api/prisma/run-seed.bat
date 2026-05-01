@echo off
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/basemap?schema=public
npx tsx prisma/seed.ts
