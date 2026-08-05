# Harbinger Academy LMS — Technical Implementation Summary

This technical review provides an architectural overview of the **Harbinger Academy LMS** (Learning Management System), designed for stakeholders and technical team members. It details how the Next.js frontend and Express/MySQL backend interact to support organizational training, sync features, and Role-Based Access Control (RBAC).

---

## 1. Routing & API Mappings

The backend server is structured around Express routes, mounted under the `/api` namespace in [app.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/app.ts). All sensitive routes require JWT validation.

### Key API Endpoint Categories
* **Authentication (`/api/auth`)**: Mounts login handling via [auth.routes.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/routes/auth.routes.ts) to verify credentials, check active status, and issue authorization tokens.
* **Course & Category Management (`/api/courses`, `/api/categories`)**: Exposes endpoints in [course.routes.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/modules/course/course.routes.ts) for:
  * Retrieving courses based on user role and department scope.
  * Adding and editing courses, section chapters, and contents (restricted to `TEACHER`, `ADMIN`, `SUPER_ADMIN`).
  * Enrolling users manually or via bulk `.xlsx`/`.csv` uploads.
* **Learner Progress (`/api/courses/:id/progress`)**: Encompasses routes for updating section completion percentages, quiz scores, and assignment uploads via the [progress.controller.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/modules/course/progress.controller.ts).
* **Notifications (`/api/notifications`)**: Map endpoints in [notification.routes.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/routes/notification.routes.ts) to fetch unread notification badges, mark specific items or all notifications as read, and delete logs.
* **Organizational Structure (`/api/departments`, `/api/employees`, `/api/user-accounts`)**: Manages companies, employees, and accounts synced from Darwinbox or defined internally.
* **Audit & Diagnostics (`/api/admin/audit-logs`, `/api/health`)**: Tracks administrator and security events (e.g. login attempts, course updates) for compliance.

---

## 2. Folder & Directory Layout

The workspace is organized as a monorepo split into standard backend and frontend environments:

```
academy_lms/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma DB schema & relational definitions
│   │   └── seed.ts              # System-wide seeding script
│   └── src/
│       ├── app.ts               # Express configuration, CORS, and routing middleware
│       ├── server.ts            # Entrypoint (port 5000)
│       ├── config/              # Setup files (e.g., Prisma Client instantiation)
│       ├── middleware/          # Security filters (authenticate, authorizeRoles)
│       ├── controllers/         # General Express handlers
│       ├── services/            # Main core business services (e.g., auth, employee)
│       ├── modules/             # Feature-grouped domains (contains route/controller/service/repository)
│       │   ├── course/          # Course management and progress execution
│       │   └── notification/    # Notification modules
│       └── utils/               # AppError, BigInt serialization, logger helpers
└── frontend/
    ├── app/                     # Next.js App Router directories
    │   ├── (auth)/              # Secure authentication layouts & login portal
    │   └── (dashboard)/         # Nested dashboards and control tools
    ├── components/              # UI widgets (layout topbars, modals, progress builders)
    ├── services/                # Axios connector clients linking to API endpoints
    └── store/                   # Zustand store state management (auth, notification, events)
```

---

## 3. Core Code Components & Responsibilities

The codebase relies on modular separation of concerns. The primary components are:

* **Middlewares (Security & Validation)**:
  * `authenticate` in [auth.middleware.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/middleware/auth.middleware.ts) decrypts incoming requests and verifies bearer tokens.
  * `authorizeRoles(...)` in [role.middleware.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/middleware/role.middleware.ts) blocks users who do not possess the required system clearance.
* **Feature Module Pattern**:
  * Modules like `course` and `notification` separate controller logic from direct data queries.
  * Controllers (e.g., [course.controller.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/modules/course/course.controller.ts)) decode API parameters, while Services (e.g., [course.service.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/modules/course/course.service.ts)) coordinate business rules.
  * Repository layers (e.g., [course.repository.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/modules/course/course.repository.ts)) isolate database commands using Prisma ORM.
* **State Management**:
  * [auth.store.ts](file:///c:/Users/ompra/Desktop/academy_lms/frontend/store/auth.store.ts) utilizes Zustand with persistence, caching user context, active department filters, and authentication tokens in browser local storage.
  * `notification.store.ts` handles the frontend unread count state and updates user notification sidebars.

---

## 4. End-to-End Data Flow

Data moves through a synchronous request-response flow:

1. **Client Request**: The frontend issues requests via Axios, incorporating authorization headers automatically via Zustand stores.
2. **Security & Guarding**: Middlewares verify JSON Web Tokens (`authenticate`) and cross-reference roles (`authorizeRoles`) against the request.
3. **Route Dispatching**: Express routing maps the request to the matching controller module.
4. **Validation & Handling**: Controllers retrieve body/query parameters and validate format and boundaries.
5. **Business Logic & Persistence**: The service executes core LMS rules and communicates with MySQL tables using Prisma ORM.
6. **Serialization & Response**: Large entities (converting data types like `BigInt` to safe string types) are formatted, returning standard HTTP JSON results back to the client.

---

## 5. Configuration, Environment & Core Dependencies

The system integrates security, ORM, and styling tooling.

### Environmental Configuration
Configured inside [backend/.env](file:///c:/Users/ompra/Desktop/academy_lms/backend/.env):
* `DATABASE_URL`: Prisma connection string (targets MySQL host, port `3307`).
* `JWT_SECRET`: Signature key for signing user sessions.
* `PORT`: Server port (defaults to `5000`).

### Critical Dependencies
* **Backend**: Express (HTTP Router), Prisma ORM (Database query client), JWT (`jsonwebtoken` library), `bcrypt` (password hashing), `multer` (file processing/upload), `xlsx` (parsing bulk enrollment sheets).
* **Frontend**: Next.js, React, Tailwind CSS (styling), Lucide React (icons), Zustand (global store), Axios (client network communication), React Hook Form & Zod (form validation).

---

## 6. Notable Design Choices, Risks & Technical Debt

### Design Strengths
* **Highly Modular Domain Structure**: Grouping schemas, routes, services, and repositories into folder groups (e.g., course, notification) simplifies code expansion.
* **Centralized Database Serialization**: Relies on a unified BigInt utility in [prismaSerializer.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/src/utils/prismaSerializer.ts) to serialize large keys before sending them to the client.
* **Auditability**: Successfully creates log trails via the database `AuditLog` table on critical actions.

### Technical Risks & Potential Debt
* **Lack of Database Transactions on Bulk Operations**: Actions like `bulkEnrollUsers` perform multiple sequential updates. If an error occurs midway, it could cause partial enrolments. Wrapping bulk operations in a Prisma transaction (`prisma.$transaction`) is recommended.
* **Primary Role Simplification**: The auth service resolves multiple roles down to a single `primaryRole` (e.g., `roles[0]`). If a user has both a learner role and a teacher role, their access might depend on array ordering.

---

## 7. Stakeholder & Product Overview

* **Goal**: Harbinger Academy LMS is a corporate LMS designed to manage employee skill profiles, departmental course enrollments, and compliance auditing.
* **Integration**: The platform includes tools to synchronize department metadata and employee roles with external HR systems (such as Darwinbox), maintaining an accurate organization directory.
* **Roles**: Access is managed dynamically based on the employee's role:
  * **Administrators** monitor system health and organizational metrics.
  * **Instructors** manage courses and grade submissions.
  * **Learners** access targeted study materials, complete modules, and track their progress toward certification.
