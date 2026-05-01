// Pure CommonJS wrapper - runs BEFORE any TypeScript is loaded
const dotenv = require('dotenv');
const path = require('path');

// Load .env BEFORE anything else
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('Dotenv loaded:', result.parsed ? 'YES' : 'NO');
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

// Now load and run the seed
require('tsx/dist/register.cjs');
require('./prisma/seed.ts');
