require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);
require('./seed.ts');
