// Wrapper to ensure env is loaded BEFORE PrismaClient is imported
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);

// Now dynamically require the seed script
require('./seed.ts');
