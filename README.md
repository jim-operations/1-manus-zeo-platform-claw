# ZEO Embilipitiya Digital Platform

An all-in-one digital platform for the Zonal Education Office (ZEO) in Embilipitiya, Sri Lanka. This platform connects all stakeholders, from the Zonal Director to teachers, parents, and students, and streamlines administrative workflows across the education zone.

## Overview

The ZEO Platform digitizes and automates the administrative functions of the Zonal Education Office, serving approximately 200+ schools, 5,000+ teachers, and 100,000+ students in the Embilipitiya education zone. It is built as a Progressive Web App (PWA). Advanced offline-first capabilities (service worker, IndexedDB cache, background sync) are planned for a later phase.

## Phase 1 Scope

Phase 1 delivers the foundational infrastructure and two core modules:

| Module | Description |
|--------|-------------|
| **Core Infrastructure** | RBAC with 10 hierarchical roles, Manus OAuth authentication, PWA shell, multi-language support (Sinhala, Tamil, English) |
| **HRM Module** | Centralized staff database, service records, leave management, teacher transfer workflows, professional development tracking |
| **Communication Hub** | Announcements system, multi-channel notifications, secure messaging, emergency alerts |

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Tailwind CSS 4, Shadcn/UI |
| Backend | Node.js, Express, tRPC 11 |
| Database | MySQL/TiDB (via Drizzle ORM) |
| Auth | Manus OAuth |
| PWA | PWA shell (service worker + IndexedDB planned) |
| i18n | i18next |
| Testing | Vitest |

## Architecture

The platform follows a modular, service-oriented architecture:

- **Frontend:** Single-page PWA with role-based dashboard views
- **Backend:** tRPC procedures with role-based middleware
- **Database:** Normalized schema with audit logging
- **Offline:** Planned service workers with IndexedDB for offline data access

## Roles & Hierarchy

1. Admin - Full system-wide access
2. Zonal Director - Zone-wide oversight
3. Deputy Director (Development) - Development and planning
4. Branch Head - Department-level management
5. In-Service Advisor (ISA) - School supervision and quality assurance
6. Principal - School-level administration
7. Teacher - Classroom management and self-service
8. Parent - View access to linked child information
9. Student - View-only access to own records
10. User - Minimal authenticated access

## Getting Started

```bash
pnpm install
pnpm db:push
pnpm dev
```

## Author

**Rajantha R Ambegala**
- GitHub: [https://github.com/RajanthaR/](https://github.com/RajanthaR/)
- Email: rajantha.rc@gmail.com

## License

Copyright (c) 2026 Rajantha R Ambegala. All Rights Reserved.

This software and associated documentation files are the exclusive property of Rajantha R Ambegala. No part of this software may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the copyright holder.
