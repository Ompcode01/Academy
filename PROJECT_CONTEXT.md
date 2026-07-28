# Project Master Context & Architecture Log

## 1. Project Overview & Vision
- **Project Name:** Harbinger Academy LMS
- **Core Purpose:** An Enterprise Learning Management System designed to handle corporate training progress, department-scoped course tracking, employee directory lookups, and Darwinbox ERP sync checks.
- **Key Roles & Permissions:**
  1. **SUPER_ADMIN:** System-wide metrics, logs, user management, and global course oversight.
  2. **ADMIN:** Department-level overview, user provisioning, and approval workflows.
  3. **TEACHER:** Curates courses/curriculum, creates sections, edits quizzes, and views department section analytics.
  4. **LEARNER:** Views enrolled courses, tracks progress, submits assignments, and views available courses in their department.
  5. **GUEST:** Preview dashboard, public course catalog, and enrollment prompts.

---

## 2. Tech Stack & Architecture
- **Frontend:**
  - Next.js (React 19, Tailwind CSS v4, Lucide-React icons)
  - Zustand for authorization state management
  - React Hook Form + Zod for field level validations
  - shadcn/ui components (Select, Table, Card, Dialog, Avatar, Tooltip, custom dropdowns)
  - Strict layout rule: Zero horizontal scroll (`overflow-x: hidden`) on viewport container; full height scaling (`min-h-screen`, `100vh`).
- **Backend:**
  - Express.js + Node.js (TypeScript)
  - Prisma ORM + MySQL Database (docker-hosted or native)
  - JSON Web Tokens (JWT) for session management
  - Custom RBAC Express middlewares (`authenticate`, `authorizeRoles`, `authorizePermissions`)
- **Integrations:**
  - Darwinbox Sync client (mock ERP data importer)

---

## 3. Repository & Directory Map

```
academy_lms/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # MySQL Prisma Schema (models, indexes, enums)
│   │   └── seed.ts         # Database seeding script with mock data
│   └── src/
│       ├── app.ts          # Express App setup & middleware mappings
│       ├── server.ts       # Backend entrypoint (port 5000)
│       ├── config/         # Database / Prisma connection initialization
│       ├── controllers/    # Express controllers (auth, user, dept, dashboard)
│       ├── middleware/     # Auth checks, error handling, role parsing
│       ├── modules/
│       │   └── course/     # Course routing, controller, service, repo layers
│       ├── routes/         # Endpoint mappings for API actions
│       ├── services/       # Business logic (database mapping, JWT generation)
│       └── utils/          # Logger, password hashing, BigInt serialization
└── frontend/
    ├── app/
    │   ├── layout.tsx      # Root html/body layout wrapper
    │   ├── globals.css     # Tailwind imports and theme styling variables
    │   ├── (auth)/         # Login portal files
    │   └── (dashboard)/    # Layout and dashboards (organization, courses, sync)
    ├── components/
    │   ├── ui/             # Reusable shadcn/ui components
    │   ├── layout/         # Navigation components (Sidebar, TopBar)
    │   └── courses/        # Course lists, tables, wizard forms, modals
    ├── lib/                # Tailwind helper classes & validation schemas
    ├── services/           # Axios API connectors (auth, course, org)
    └── store/              # Zustand state containers (auth.store.ts)
```

---

## 4. Current Implementation State

- **Completed Modules:**
  - JWT auth session management (Axios request headers automatically get JWT token).
  - Schema extension with `creatorId`, `departmentId`, and `status` (`DRAFT`/`PUBLISHED`/`ARCHIVED`) on Courses.
  - Role-scoped backend course service and database repository queries.
  - Dynamic Dashboard stats backend route (`GET /api/dashboard/stats`).
  - Native database setup support on MySQL port 3306 or Docker on port 3307.
  - Zustand auth store with persistent local storage support.
  - Frontend Role-Based Access Control logic (`lib/rbac.ts` and `<RoleGate>` wrapping helper).
  - Next.js root layout and dashboard layout adjustments for strict zero horizontal scroll.
  - Sidebar links dynamically rendered and filtered by user role.
  - TopBar displaying dynamic user credentials, initials, role badges, and a custom logout button.
  - Role-scoped home dashboard UI layouts (SUPER_ADMIN/ADMIN, TEACHER, LEARNER, GUEST layouts).
  - Clean dynamic catalog catalog fetching and delete commands inside `/courses/page.tsx`.
  - CreateCourseModal modal form integrated with input validation and catalog auto-refreshes.
- **Data Models:**
  - `Department`, `Employee`, `UserAccount`, `Role`, `Permission`, `UserRole`, `RolePermission`
  - `Category`, `Course` (with status, department, creator), `CourseSection`, `LearningContent`, `Enrollment`
- **Hardcoded Data Cleaned:**
  - Seeding logic is updated to create courses with real department and creator ids.
  - Course and category backend endpoints query MySQL dynamically.
  - Replaced hardcoded courses list with dynamic fetching in `/courses` catalog page.

---

## 5. Ongoing Tasks & Next Steps

### Chronological Feature Log
1. Migrated `schema.prisma` Course model to add status enum, `departmentId`, and `creatorId`.
2. Expanded JWT payload inside `backend/src/services/auth.service.ts` to expose `role` and `departmentId`.
3. Created a role-scoped dashboard metrics service (`backend/src/services/dashboard.service.ts`).
4. Mounted `/api/dashboard/stats` endpoint inside backend server.
5. Added Zustand store state persistence and Login page parameter mappings.
6. Implemented frontend RBAC gate definitions (`rbac.ts` and `RoleGate.tsx`).
7. Cleaned up Tailwind stylesheet and Next.js layout parameters to enforce strict viewport constraints.
8. Filtered layout sidebars and populated dynamic user data inside TopBars.
9. Refactored the dashboard page to render custom layouts according to the logged-in role.
10. Added dynamic endpoints fetching in courses page and designed the quick `CreateCourseModal` dialog.

### Immediate Backlog (Upcoming Tasks)
- [ ] Connect the 9-step administrative course configuration tool wizard at `/courses/create` to save dynamic sections and MCQ questions to MySQL database.
- [ ] Implement media player lesson details editor inside learner preview page (`/courses/[id]/preview`).

