const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$connect()
  .then(() => {
    console.log('Connected!');
    return p.tenant.findMany();
  })
  .then((tenants) => {
    console.log('Tenants:', tenants.length);
    return p.$disconnect();
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
