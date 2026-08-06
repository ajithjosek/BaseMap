import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SOC2_CONTROLS = [
  {
    control_id: 'CC1.1',
    name: 'COSO Principle - Control Environment',
    description: 'Board and management establish and communicate integrity and ethical values.',
    risk_level: 'medium',
  },
  {
    control_id: 'CC2.1',
    name: 'COSO Principle - Communication',
    description: 'Information relevant to internal control is obtained or generated and used to support control components.',
    risk_level: 'medium',
  },
  {
    control_id: 'CC4.1',
    name: 'Monitoring of Controls',
    description: 'Management monitors internal control over financial reporting to determine whether it is operating effectively.',
    risk_level: 'high',
  },
  {
    control_id: 'CC5.1',
    name: 'Risk Assessment - Identify Risks',
    description: 'Identifies and assesses risks to achieving its objectives from internal and external sources.',
    risk_level: 'high',
  },
  {
    control_id: 'CC6.1',
    name: 'Logical and Physical Access',
    description: 'Restricts logical and physical access to protect assets and prevent unauthorized access.',
    risk_level: 'critical',
  },
  {
    control_id: 'CC6.2',
    name: 'User Registration and De-registration',
    description: 'New users are registered with authorization and de-registered upon termination or transfer.',
    risk_level: 'high',
  },
  {
    control_id: 'CC6.3',
    name: 'Access Provisioning',
    description: 'Access rights are provisioned based on the principle of least privilege and segregation of duties.',
    risk_level: 'high',
  },
  {
    control_id: 'CC6.6',
    name: 'Access Rejection',
    description: 'Unauthorized access is rejected through logical and physical access controls.',
    risk_level: 'critical',
  },
  {
    control_id: 'CC7.1',
    name: 'Threat Detection',
    description: 'Procedures to detect, respond to, and remediate security violations, including monitoring anomalies.',
    risk_level: 'critical',
  },
  {
    control_id: 'CC7.2',
    name: 'Incident Response',
    description: 'An incident response plan exists, is tested, and is executed for identified security incidents.',
    risk_level: 'critical',
  },
  {
    control_id: 'CC7.3',
    name: 'System Performance Monitoring',
    description: 'System failures, interruptions, and variances from expected performance are detected and communicated.',
    risk_level: 'medium',
  },
  {
    control_id: 'CC8.1',
    name: 'Change Management',
    description: 'Changes are identified, managed, controlled, and reported including emergency and authorized changes.',
    risk_level: 'high',
  },
  {
    control_id: 'CC9.1',
    name: 'Business Disruption Risks',
    description: 'Identifies and manages risks related to business disruption, including backup and recovery.',
    risk_level: 'high',
  },
  {
    control_id: 'A1.1',
    name: 'Availability - Capacity Management',
    description: 'Maintains capacity to meet availability commitments with capacity monitoring and management.',
    risk_level: 'high',
  },
  {
    control_id: 'A1.2',
    name: 'Backup and Recovery',
    description: 'Backups and recovery procedures support recovery time and recovery point objectives.',
    risk_level: 'critical',
  },
  {
    control_id: 'A1.3',
    name: 'Disaster Recovery Plan',
    description: 'A tested disaster recovery plan supports availability commitments.',
    risk_level: 'critical',
  },
  {
    control_id: 'C1.1',
    name: 'Confidentiality - Data Classification',
    description: 'Confidential information is classified, labeled, and handled appropriately.',
    risk_level: 'high',
  },
  {
    control_id: 'C1.2',
    name: 'Confidentiality - Encryption',
    description: 'Confidential information is protected with encryption at rest and in transit.',
    risk_level: 'critical',
  },
  {
    control_id: 'PI1.1',
    name: 'Privacy - Consent',
    description: 'Personal information is collected with consent consistent with stated purposes.',
    risk_level: 'high',
  },
  {
    control_id: 'PI1.4',
    name: 'Privacy - Data Retention',
    description: 'Personal information is retained only as long as necessary and disposed of per policy.',
    risk_level: 'high',
  },
];

async function main() {
  const tenant = await prisma.tenant.findFirst({ orderBy: { created_at: 'asc' } });
  if (!tenant) {
    throw new Error('No tenant found. Run the primary seed first.');
  }

  const framework = await prisma.complianceFramework.upsert({
    where: { id: `soc2-${tenant.id}` },
    update: { framework_type: 'SOC 2', description: 'SOC 2 Trust Services Criteria' },
    create: {
      id: `soc2-${tenant.id}`,
      tenant_id: tenant.id,
      name: 'SOC 2',
      framework_type: 'SOC 2',
      description: 'SOC 2 Trust Services Criteria (TSC)',
    },
  });

  let compliant = 0;
  for (const control of SOC2_CONTROLS) {
    const existing = await prisma.complianceControl.findFirst({
      where: { framework_id: framework.id, control_id: control.control_id },
    });

    // Gap analysis status: mark known gaps as non_compliant; map to platform capabilities
    const status = resolveStatus(control.control_id);
    if (status === 'compliant') compliant++;

    const data = {
      framework_id: framework.id,
      control_id: control.control_id,
      name: control.name,
      description: control.description,
      status,
      risk_level: control.risk_level,
      owner: 'Security Team',
      due_date: status === 'non_compliant' ? new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) : null,
    };

    if (existing) {
      await prisma.complianceControl.update({ where: { id: existing.id }, data });
    } else {
      await prisma.complianceControl.create({ data });
    }
  }

  const pct = Math.round((compliant / SOC2_CONTROLS.length) * 100);
  await prisma.complianceFramework.update({
    where: { id: framework.id },
    data: { compliance_pct: pct, last_audit: new Date() },
  });

  console.log(
    `SOC 2 seeded: ${SOC2_CONTROLS.length} controls, ${compliant} compliant (${pct}%)`,
  );
}

/**
 * Initial gap analysis: maps each SOC 2 control to current platform capabilities.
 * Controls backed by implemented features are compliant; the rest are tracked gaps.
 */
function resolveStatus(controlId: string): 'compliant' | 'non_compliant' {
  const compliantControls = [
    'CC6.1', // JWT auth + x-tenant-id isolation
    'CC6.3', // RBAC roles (Role/UserRole models)
    'CC6.6', // AdminGuard on privileged routes
    'CC8.1', // CI/CD pipeline (turbo + docker)
    'C1.2', // HTTPS/TLS; DB encryption available
  ];
  return compliantControls.includes(controlId) ? 'compliant' : 'non_compliant';
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
