# BaseMap - Enterprise Architecture Management Tool

A full-stack Enterprise Architecture Management (EAM) tool built with NestJS, Next.js, and PostgreSQL.

## Features

- **Dashboard** - Executive, Financial, and Risk dashboards with real-time metrics
- **Application Management** - Track and manage enterprise applications with lifecycle states
- **Capabilities Mapping** - Business capability tree visualization and management
- **SaaS & Cloud Management** - Track SaaS applications, contracts, and licensing
- **User Management** - Role-based access control with multi-tenant support
- **Import/Export** - Bulk import and export functionality
- **Notifications** - Real-time alerts for lifecycle changes and EOL notifications

## Tech Stack

- **Backend**: NestJS with Prisma ORM
- **Frontend**: Next.js 16 with React and TailwindCSS
- **Database**: PostgreSQL
- **Authentication**: JWT with Passport

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the development servers
npm run dev
```

The application will be available at:
- Web UI: http://localhost:3005
- API: http://localhost:4001

### Database Setup

```bash
# Run migrations
cd apps/api
npx prisma migrate deploy

# Seed the database
node run-seed.js
```

### Default Credentials

- Email: admin@basemap.com
- Password: admin123
- Tenant: default

## Project Structure

```
apps/
├── api/                 # NestJS backend
│   ├── src/
│   │   ├── auth/       # Authentication
│   │   ├── users/     # User management
│   │   ├── applications/
│   │   ├── capabilities/
│   │   ├── dashboards/
│   │   └── ...
│   └── prisma/        # Database schema
│
└── web/               # Next.js frontend
    ├── src/
    │   ├── app/       # Pages
    │   ├── components/
    │   └── lib/      # API client
```

## API Endpoints

- `/auth/login` - User authentication
- `/users` - User CRUD operations
- `/applications` - Application management
- `/capabilities` - Capability mapping
- `/dashboards/*` - Dashboard data
- `/saas` - SaaS applications
- `/notifications` - Real-time alerts

## License

UNLICENSED