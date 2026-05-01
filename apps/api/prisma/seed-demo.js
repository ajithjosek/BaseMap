const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/basemap?schema=public',
});

async function main() {
  console.log('Starting seed...');

  // Create or get tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo',
      plan: 'enterprise',
    },
  });

  console.log('Tenant:', tenant.id);

  // Create business units
  const buNames = ['IT', 'Finance', 'Sales', 'HR', 'Analytics', 'Security', 'Design', 'Legal', 'Supply Chain'];
  const buMap = {};
  
  for (const buName of buNames) {
    const bu = await prisma.businessUnit.upsert({
      where: { id: `${buName}-bu-id` },
      update: {},
      create: {
        id: `${buName}-bu-id`,
        tenant_id: tenant.id,
        name: buName,
      },
    });
    buMap[buName] = bu.id;
  }

  console.log('Business units created');

  // Create admin user
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.upsert({
    where: { id: 'admin-user-id' },
    update: {},
    create: {
      id: 'admin-user-id',
      tenant_id: tenant.id,
      email: 'admin@basemap.demo',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
    },
  });

  console.log('Admin user created');

  // Applications data
  const apps = [
    { name: 'SAP ERP', vendor: 'SAP', type: 'ERP', lifecycle: 'Active', risk: 20, cost: 500000, bu: 'IT' },
    { name: 'Salesforce CRM', vendor: 'Salesforce', type: 'CRM', lifecycle: 'Active', risk: 15, cost: 300000, bu: 'Sales' },
    { name: 'Oracle Financials', vendor: 'Oracle', type: 'ERP', lifecycle: 'Active', risk: 30, cost: 400000, bu: 'Finance' },
    { name: 'Microsoft Dynamics', vendor: 'Microsoft', type: 'ERP', lifecycle: 'Maintenance', risk: 25, cost: 200000, bu: 'IT' },
    { name: 'Tableau', vendor: 'Salesforce', type: 'BI', lifecycle: 'Active', risk: 10, cost: 150000, bu: 'Analytics' },
    { name: 'Power BI', vendor: 'Microsoft', type: 'BI', lifecycle: 'Active', risk: 10, cost: 100000, bu: 'Analytics' },
    { name: 'Jira', vendor: 'Atlassian', type: 'PM', lifecycle: 'Active', risk: 15, cost: 80000, bu: 'IT' },
    { name: 'Confluence', vendor: 'Atlassian', type: 'Collab', lifecycle: 'Active', risk: 10, cost: 60000, bu: 'IT' },
    { name: 'Slack', vendor: 'Salesforce', type: 'Collab', lifecycle: 'Active', risk: 5, cost: 120000, bu: 'IT' },
    { name: 'Workday', vendor: 'Workday', type: 'HR', lifecycle: 'Active', risk: 20, cost: 250000, bu: 'HR' },
    { name: 'ServiceNow', vendor: 'ServiceNow', type: 'ITSM', lifecycle: 'Active', risk: 25, cost: 350000, bu: 'IT' },
    { name: 'MuleSoft', vendor: 'Salesforce', type: 'Integration', lifecycle: 'Active', risk: 30, cost: 180000, bu: 'IT' },
    { name: 'Informatica', vendor: 'Informatica', type: 'Data', lifecycle: 'Maintenance', risk: 35, cost: 200000, bu: 'IT' },
    { name: 'Databricks', vendor: 'Databricks', type: 'Data', lifecycle: 'Active', risk: 20, cost: 300000, bu: 'Analytics' },
    { name: 'Snowflake', vendor: 'Snowflake', type: 'Data', lifecycle: 'Active', risk: 15, cost: 250000, bu: 'Analytics' },
    { name: 'Ansible', vendor: 'Red Hat', type: 'DevOps', lifecycle: 'Active', risk: 20, cost: 100000, bu: 'IT' },
    { name: 'Jenkins', vendor: 'CloudBees', type: 'DevOps', lifecycle: 'Maintenance', risk: 25, cost: 50000, bu: 'IT' },
    { name: 'GitLab', vendor: 'GitLab', type: 'DevOps', lifecycle: 'Active', risk: 15, cost: 120000, bu: 'IT' },
    { name: 'Docker', vendor: 'Docker', type: 'DevOps', lifecycle: 'Active', risk: 10, cost: 80000, bu: 'IT' },
    { name: 'Kubernetes', vendor: 'CNCF', type: 'DevOps', lifecycle: 'Active', risk: 30, cost: 150000, bu: 'IT' },
    { name: 'Nginx', vendor: 'F5', type: 'Infra', lifecycle: 'Active', risk: 10, cost: 30000, bu: 'IT' },
    { name: 'Apache HTTP', vendor: 'Apache', type: 'Infra', lifecycle: 'Maintenance', risk: 15, cost: 20000, bu: 'IT' },
    { name: 'MySQL', vendor: 'Oracle', type: 'DB', lifecycle: 'Active', risk: 20, cost: 50000, bu: 'IT' },
    { name: 'PostgreSQL', vendor: 'PostgreSQL', type: 'DB', lifecycle: 'Active', risk: 15, cost: 40000, bu: 'IT' },
    { name: 'MongoDB', vendor: 'MongoDB', type: 'DB', lifecycle: 'Active', risk: 20, cost: 100000, bu: 'IT' },
    { name: 'Redis', vendor: 'Redis', type: 'DB', lifecycle: 'Active', risk: 10, cost: 30000, bu: 'IT' },
    { name: 'Elasticsearch', vendor: 'Elastic', type: 'Search', lifecycle: 'Active', risk: 25, cost: 120000, bu: 'IT' },
    { name: 'Active Directory', vendor: 'Microsoft', type: 'Identity', lifecycle: 'Active', risk: 30, cost: 200000, bu: 'IT' },
    { name: 'Okta', vendor: 'Okta', type: 'Identity', lifecycle: 'Active', risk: 15, cost: 150000, bu: 'IT' },
    { name: 'Duo', vendor: 'Cisco', type: 'Identity', lifecycle: 'Active', risk: 10, cost: 80000, bu: 'IT' },
    { name: 'CrowdStrike', vendor: 'CrowdStrike', type: 'Security', lifecycle: 'Active', risk: 20, cost: 200000, bu: 'Security' },
    { name: 'Qualys', vendor: 'Qualys', type: 'Security', lifecycle: 'Active', risk: 25, cost: 150000, bu: 'Security' },
    { name: 'Splunk', vendor: 'Splunk', type: 'Security', lifecycle: 'Active', risk: 20, cost: 250000, bu: 'Security' },
    { name: 'Zscaler', vendor: 'Zscaler', type: 'Security', lifecycle: 'Active', risk: 15, cost: 180000, bu: 'Security' },
    { name: 'Miro', vendor: 'Miro', type: 'Collab', lifecycle: 'Active', risk: 5, cost: 60000, bu: 'IT' },
    { name: 'Figma', vendor: 'Figma', type: 'Design', lifecycle: 'Active', risk: 5, cost: 80000, bu: 'Design' },
    { name: 'Adobe Creative', vendor: 'Adobe', type: 'Design', lifecycle: 'Active', risk: 10, cost: 120000, bu: 'Design' },
    { name: 'SAP Ariba', vendor: 'SAP', type: 'Procurement', lifecycle: 'Planning', risk: 20, cost: 180000, bu: 'Finance' },
    { name: 'Coupa', vendor: 'Coupa', type: 'Procurement', lifecycle: 'Active', risk: 15, cost: 150000, bu: 'Finance' },
    { name: 'Concur', vendor: 'SAP', type: 'Expense', lifecycle: 'Active', risk: 10, cost: 100000, bu: 'Finance' },
    { name: 'Expensify', vendor: 'Expensify', type: 'Expense', lifecycle: 'Active', risk: 5, cost: 50000, bu: 'Finance' },
    { name: 'DocuSign', vendor: 'DocuSign', type: 'Legal', lifecycle: 'Active', risk: 10, cost: 120000, bu: 'Legal' },
    { name: 'iManage', vendor: 'iManage', type: 'Legal', lifecycle: 'Maintenance', risk: 20, cost: 100000, bu: 'Legal' },
    { name: 'Zoom', vendor: 'Zoom', type: 'Comms', lifecycle: 'Active', risk: 5, cost: 100000, bu: 'IT' },
    { name: 'Teams', vendor: 'Microsoft', type: 'Comms', lifecycle: 'Active', risk: 10, cost: 150000, bu: 'IT' },
    { name: 'Webex', vendor: 'Cisco', type: 'Comms', lifecycle: 'Maintenance', risk: 15, cost: 80000, bu: 'IT' },
    { name: 'Five9', vendor: 'Five9', type: 'Comms', lifecycle: 'Active', risk: 10, cost: 120000, bu: 'Sales' },
    { name: 'SharePoint', vendor: 'Microsoft', type: 'Content', lifecycle: 'Active', risk: 15, cost: 100000, bu: 'IT' },
    { name: 'OneDrive', vendor: 'Microsoft', type: 'Content', lifecycle: 'Active', risk: 10, cost: 80000, bu: 'IT' },
    { name: 'Box', vendor: 'Box', type: 'Content', lifecycle: 'Active', risk: 10, cost: 60000, bu: 'IT' },
    { name: 'SAP SuccessFactors', vendor: 'SAP', type: 'HR', lifecycle: 'Planning', risk: 25, cost: 200000, bu: 'HR' },
    { name: 'ADP', vendor: 'ADP', type: 'HR', lifecycle: 'Active', risk: 20, cost: 180000, bu: 'HR' },
    { name: 'LinkedIn Talent', vendor: 'Microsoft', type: 'HR', lifecycle: 'Active', risk: 10, cost: 100000, bu: 'HR' },
    { name: 'SAP IBP', vendor: 'SAP', type: 'Supply Chain', lifecycle: 'Planning', risk: 30, cost: 250000, bu: 'Supply Chain' },
    { name: 'Blue Yonder', vendor: 'Blue Yonder', type: 'Supply Chain', lifecycle: 'Active', risk: 25, cost: 200000, bu: 'Supply Chain' },
    { name: 'Oracle SCM', vendor: 'Oracle', type: 'Supply Chain', lifecycle: 'Planning', risk: 35, cost: 300000, bu: 'Supply Chain' },
  ];

  const appMap = {};
  const costTypes = ['License', 'Maintenance', 'Support', 'Infrastructure', 'Professional Services'];

  for (const appData of apps) {
    const existing = await prisma.application.findFirst({
      where: { tenant_id: tenant.id, name: appData.name },
    });

    let app;
    if (existing) {
      app = existing;
    } else {
      app = await prisma.application.create({
        data: {
          tenant_id: tenant.id,
          name: appData.name,
          description: `${appData.vendor} ${appData.type} application`,
          vendor: appData.vendor,
          technology_type: appData.type,
          lifecycle_state: appData.lifecycle,
          risk_score: appData.risk,
          business_unit_id: buMap[appData.bu] || null,
          created_by: admin.id,
          updated_by: admin.id,
        },
      });
    }
    appMap[appData.name] = app.id;

    // Create cost entry
    const existingCost = await prisma.applicationCost.findFirst({
      where: { tenant_id: tenant.id, application_id: app.id },
    });

    if (!existingCost) {
      await prisma.applicationCost.create({
        data: {
          tenant_id: tenant.id,
          application_id: app.id,
          cost_type: costTypes[Math.floor(Math.random() * costTypes.length)],
          amount: appData.cost,
          currency: 'USD',
          billing_cycle: 'Annual',
          effective_date: new Date('2026-01-01'),
          created_by: admin.id,
        },
      });
    }
  }

  console.log('Applications created:', apps.length);

  // Create interfaces (dependencies)
  const interfaces = [
    { source: 'SAP ERP', target: 'Oracle Financials', type: 'Data', protocol: 'JDBC' },
    { source: 'SAP ERP', target: 'MuleSoft', type: 'API', protocol: 'REST' },
    { source: 'Salesforce CRM', target: 'MuleSoft', type: 'API', protocol: 'REST' },
    { source: 'MuleSoft', target: 'Oracle Financials', type: 'Data', protocol: 'JDBC' },
    { source: 'Tableau', target: 'Snowflake', type: 'Data', protocol: 'JDBC' },
    { source: 'Power BI', target: 'PostgreSQL', type: 'Data', protocol: 'ODBC' },
    { source: 'Databricks', target: 'Snowflake', type: 'Data', protocol: 'Snowflake Connector' },
    { source: 'Informatica', target: 'Oracle Financials', type: 'Data', protocol: 'JDBC' },
    { source: 'Jira', target: 'Slack', type: 'API', protocol: 'Webhook' },
    { source: 'GitLab', target: 'Jenkins', type: 'API', protocol: 'Webhook' },
    { source: 'Jenkins', target: 'Ansible', type: 'API', protocol: 'SSH' },
    { source: 'Docker', target: 'Kubernetes', type: 'API', protocol: 'Kubernetes API' },
    { source: 'Kubernetes', target: 'Nginx', type: 'API', protocol: 'HTTP' },
    { source: 'MySQL', target: 'PostgreSQL', type: 'Replication', protocol: 'Binlog' },
    { source: 'MongoDB', target: 'Databricks', type: 'Data', protocol: 'MongoDB Connector' },
    { source: 'Redis', target: 'Docker', type: 'API', protocol: 'Redis Protocol' },
    { source: 'Elasticsearch', target: 'Splunk', type: 'Data', protocol: 'REST API' },
    { source: 'Active Directory', target: 'Okta', type: 'Identity', protocol: 'LDAP' },
    { source: 'Okta', target: 'Duo', type: 'Identity', protocol: 'RADIUS' },
    { source: 'CrowdStrike', target: 'Splunk', type: 'Security', protocol: 'Syslog' },
    { source: 'Qualys', target: 'Splunk', type: 'Security', protocol: 'API' },
    { source: 'Zscaler', target: 'CrowdStrike', type: 'Security', protocol: 'API' },
    { source: 'Miro', target: 'Slack', type: 'API', protocol: 'Webhook' },
    { source: 'Figma', target: 'Slack', type: 'API', protocol: 'Webhook' },
    { source: 'SAP Ariba', target: 'SAP ERP', type: 'Data', protocol: 'RFC' },
    { source: 'Coupa', target: 'Oracle Financials', type: 'Data', protocol: 'REST API' },
    { source: 'Concur', target: 'SAP ERP', type: 'Data', protocol: 'REST API' },
    { source: 'DocuSign', target: 'Salesforce CRM', type: 'API', protocol: 'REST' },
    { source: 'iManage', target: 'SharePoint', type: 'Data', protocol: 'WebDAV' },
    { source: 'Zoom', target: 'Slack', type: 'API', protocol: 'Webhook' },
    { source: 'Teams', target: 'SharePoint', type: 'API', protocol: 'Graph API' },
    { source: 'Five9', target: 'Salesforce CRM', type: 'API', protocol: 'REST' },
    { source: 'SharePoint', target: 'OneDrive', type: 'Data', protocol: 'Graph API' },
    { source: 'Box', target: 'SharePoint', type: 'Data', protocol: 'REST API' },
    { source: 'SAP SuccessFactors', target: 'SAP ERP', type: 'Data', protocol: 'OData' },
    { source: 'ADP', target: 'SAP ERP', type: 'Data', protocol: 'SFTP' },
    { source: 'LinkedIn Talent', target: 'SAP SuccessFactors', type: 'API', protocol: 'REST' },
    { source: 'SAP IBP', target: 'SAP ERP', type: 'Data', protocol: 'RFC' },
    { source: 'Blue Yonder', target: 'SAP ERP', type: 'Data', protocol: 'REST API' },
    { source: 'Oracle SCM', target: 'Oracle Financials', type: 'Data', protocol: 'JDBC' },
  ];

  for (const iface of interfaces) {
    const sourceId = appMap[iface.source];
    const targetId = appMap[iface.target];

    if (sourceId && targetId) {
      const existing = await prisma.interface.findFirst({
        where: {
          tenant_id: tenant.id,
          source_application_id: sourceId,
          target_application_id: targetId,
        },
      });

      if (!existing) {
        await prisma.interface.create({
          data: {
            tenant_id: tenant.id,
            name: `${iface.source} → ${iface.target}`,
            interface_type: iface.type,
            source_application_id: sourceId,
            target_application_id: targetId,
            protocol: iface.protocol,
            status: 'Active',
            created_by: admin.id,
          },
        });
      }
    }
  }

  console.log('Interfaces created:', interfaces.length);

  // Create root capability node
  const rootCap = await prisma.capabilityNode.upsert({
    where: { id: 'root-cap-id' },
    update: {},
    create: {
      id: 'root-cap-id',
      tenant_id: tenant.id,
      name: 'Business Capabilities',
      level: 1,
      strategic_importance: 'High',
    },
  });

  // Create capability nodes
  const capabilities = [
    { name: 'Financial Management', level: 2, strategic: 'High' },
    { name: 'Human Resources', level: 2, strategic: 'High' },
    { name: 'Supply Chain', level: 2, strategic: 'High' },
    { name: 'IT Infrastructure', level: 2, strategic: 'Medium' },
    { name: 'Security & Compliance', level: 2, strategic: 'High' },
    { name: 'Customer Management', level: 2, strategic: 'High' },
    { name: 'Data & Analytics', level: 2, strategic: 'High' },
    { name: 'Collaboration', level: 2, strategic: 'Medium' },
    { name: 'Procurement', level: 2, strategic: 'Medium' },
    { name: 'Legal', level: 2, strategic: 'Low' },
  ];

  for (const cap of capabilities) {
    const existing = await prisma.capabilityNode.findFirst({
      where: { tenant_id: tenant.id, name: cap.name, parent_id: rootCap.id },
    });

    if (!existing) {
      await prisma.capabilityNode.create({
        data: {
          tenant_id: tenant.id,
          parent_id: rootCap.id,
          name: cap.name,
          level: cap.level,
          strategic_importance: cap.strategic,
          created_by: admin.id,
        },
      });
    }
  }

  console.log('Seed completed!');
  console.log(`Created ${apps.length} applications with interfaces and capabilities.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
