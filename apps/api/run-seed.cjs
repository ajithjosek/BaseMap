// This must be .cjs (CommonJS) to ensure dotenv loads BEFORE any TS imports
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL value:', process.env.DATABASE_URL);

// Now load and run the seed
require('./node_modules/tsx/dist/cli.cjs');
