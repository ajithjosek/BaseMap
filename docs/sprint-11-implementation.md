# Sprint 11 Implementation

**Date:** April 30, 2026  
**Status:** Complete

## Overview

Sprint 11 focuses on implementing Import/Export functionality and Notification Center features for the BaseMap EAM tool.

## What's Been Implemented

### Backend API

#### 1. Import/Export Module (`apps/api/src/import-export/`)

**Files Created:**
- `import-export.service.ts` - Core service for file parsing, validation, job management, and actual import/export processing
- `import-export.controller.ts` - REST API endpoints for import/export operations with multer file upload support
- `import-export.module.ts` - NestJS module configuration
- `dto/import-export.dto.ts` - DTOs with class-validator validation

**Features:**
- CSV/Excel file parsing using `papaparse` and `xlsx`
- File upload via multer (multipart/form-data)
- Import validation with preview generation
- Import job tracking with status management
- **Actual import processing**: Creates/updates applications from CSV/Excel data with duplicate detection
- Export job creation and management
- **Actual export processing**: Fetches applications/costs data with filters and generates CSV/Excel/JSON files
- CSV/Excel/JSON generation for exports
- Pagination for import/export job listings
- Tenant isolation on all operations

**API Endpoints:**
- `POST /import-export/import/preview` - Upload file and preview/validate import data
- `POST /import-export/import/:id/process` - Process import job (creates/updates records)
- `POST /import-export/export` - Create export job
- `POST /import-export/export/:id/process` - Process export job (generates file)
- `GET /import-export/export/:id/download` - Get export file info
- `GET /import-export/import-jobs` - List import jobs with pagination
- `GET /import-export/export-jobs` - List export jobs with pagination

#### 2. Notifications Module (`apps/api/src/notifications/`)

**Files Created:**
- `notifications.service.ts` - Core service for notification management and email sending
- `notifications.controller.ts` - REST API endpoints for notifications
- `notifications.module.ts` - NestJS module configuration
- `dto/notifications.dto.ts` - DTOs with class-validator validation

**Features:**
- Create and retrieve notifications with pagination
- Mark notifications as read (individual and bulk)
- Delete notifications
- Get unread notification count
- **Email integration** via nodemailer with SMTP configuration
- Email logging for tracking delivery status
- Lifecycle change notifications
- EOL alert notifications (90, 60, 30 days before)
- Import/Export completion notifications
- **EOL alert scheduler** that scans applications and sends alerts to owners
- Tenant isolation on all operations

**API Endpoints:**
- `GET /notifications` - Get user notifications with pagination
- `POST /notifications/:id/read` - Mark notification as read
- `POST /notifications/mark-all-read` - Mark all notifications as read
- `DELETE /notifications/:id` - Delete notification
- `GET /notifications/unread-count` - Get unread count
- `POST /notifications/send-lifecycle-change` - Send lifecycle change notification
- `POST /notifications/send-eol-alert` - Send EOL alert notification
- `POST /notifications/schedule-eol-alerts` - Schedule/run EOL alerts

### Database Schema

**Migration File:** `apps/api/prisma/migrations/20260430000000_add_sprint11_features/migration.sql`

**New Tables:**
- `notifications` - Store user notifications
- `import_jobs` - Track import job status and results
- `export_jobs` - Track export job status and results
- `email_logs` - Log email sending attempts

**Schema Updates:**
- Added new models to `apps/api/prisma/schema.prisma`
- Proper indexes on tenant_id, user_id, status columns
- Foreign key constraints for multi-tenancy

### Frontend Components

#### 1. Notification Center (`apps/web/src/components/layout/notification-center.tsx`)

**Features:**
- Bell icon with unread count badge
- Popover dropdown with notification list
- Notification icons by type (lifecycle, EOL, import, export)
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications
- Scrollable notification list
- Responsive design
- Auto-refresh unread count every 30 seconds

**Integration:**
- Added to `apps/web/src/components/layout/sidebar.tsx`

#### 2. Import Wizard (`apps/web/src/components/import-export/import-wizard.tsx`)

**Features:**
- Drag and drop file upload
- File type validation (CSV, XLSX, XLS)
- File preview via backend API
- Error highlighting with detailed error messages
- Import job progress tracking
- Success/failure feedback with row counts
- Actual API integration (FormData upload, preview, process)

## Integration Points

### Lifecycle Change Notifications
- Applications service now triggers notifications on lifecycle state transitions
- Integrated via `NotificationsService` injected into `ApplicationsService`
- Both in-app and email notifications are sent

### Import/Export Completion Notifications
- Import/export services trigger notifications on job completion
- Email notifications sent if SMTP is configured

## Dependencies Installed

```bash
# Backend
npm install papaparse xlsx bullmq nodemailer @nestjs/config

# Frontend
npm install @radix-ui/react-scroll-area @radix-ui/react-progress @radix-ui/react-separator
```

## Environment Variables

Add to `.env` files:

```env
# SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# JWT Secrets
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

## Testing Checklist

- [ ] Import CSV file with valid data
- [ ] Import CSV file with invalid data (validation errors)
- [ ] Export applications to CSV
- [ ] Export applications to Excel
- [ ] View notifications in notification center
- [ ] Mark notification as read
- [ ] Mark all notifications as read
- [ ] Delete notification
- [ ] Get unread count
- [ ] Lifecycle change notification
- [ ] EOL alert notification
- [ ] Import completion notification
- [ ] Export completion notification

## Next Steps (Sprint 12)

1. Background job processing with BullMQ/Redis
2. File storage integration (S3/MinIO)
3. Advanced column mapping UI
4. Scheduled exports
5. Notification preferences
6. WebSocket for real-time notification updates

---

**Status:** Sprint 11 implementation complete  
**Last Updated:** April 30, 2026
