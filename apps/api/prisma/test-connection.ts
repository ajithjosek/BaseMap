import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database successfully!');
    
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', tenants);

    const appCount = await prisma.application.count();
    const interfaceCount = await prisma.interface.count();
    const capCount = await prisma.capabilityNode.count();
    
    console.log(`Counts - Apps: ${appCount}, Interfaces: ${interfaceCount}, Capabilities: ${capCount}`);
  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
