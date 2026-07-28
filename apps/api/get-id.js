const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/basemap' });
pool.query('SELECT id FROM tenants LIMIT 1').then(res => {
  console.log("Found tenant ID:");
  console.log(res.rows[0].id);
}).catch(console.error).finally(() => pool.end());
