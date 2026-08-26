# Harbinger Academy LMS - Codebase & Architecture Analysis Documentation

Welcome to the comprehensive technical documentation for **Harbinger Academy LMS**.

This documentation suite covers every folder, file, database model, API route, component, and RBAC security logic across both the backend and frontend.

---

## 📚 Documentation Index

| Module / Topic | File Link | Description |
|---|---|---|
| 🔐 **RBAC Architecture & 5 Roles Matrix** | [00_OVERVIEW_AND_RBAC_MATRIX.md](file:///d:/Harbinger%20Training/LMS/LMS/Academy/codebase_analysis_docs/00_OVERVIEW_AND_RBAC_MATRIX.md) | Platform overview, the 5 system roles (`SUPER_ADMIN`, `ADMIN`, `TEACHER`, `LEARNER`, `GUEST`), permission matrix, who can see what. |
| 🗄️ **Database Schema & Prisma ORM** | [01_PRISMA_DATABASE_AND_SEEDING.md](file:///d:/Harbinger%20Training/LMS/LMS/Academy/codebase_analysis_docs/01_PRISMA_DATABASE_AND_SEEDING.md) | MySQL schema, Prisma models, relationships, enums (`CourseStatus`), and seeding logic in `backend/prisma/`. |
| ⚡ **Backend Core & Express Setup** | [02_BACKEND_CORE_SRC.md](file:///d:/Harbinger%20Training/LMS/LMS/Academy/codebase_analysis_docs/02_BACKEND_CORE_SRC.md) | Express app initialization, static asset resolver (`/storage`), JWT utilities, BigInt JSON serializer in `backend/src/`. |
| 🛠️ **Backend Services, Controllers & API Routes** | [03_BACKEND_MODULES_SERVICES_ROUTES.md](file:///d:/Harbinger%20Training/LMS/LMS/Academy/codebase_analysis_docs/03_BACKEND_MODULES_SERVICES_ROUTES.md) | Course module (`course.service.ts -> buildScopeFilter`), Dashboard metrics service, Auth service, and API route mappings. |
| 🌐 **Frontend App Router & Layout System** | [04_FRONTEND_APP_ROUTER_PAGES.md](file:///d:/Harbinger%20Training/LMS/LMS/Academy/codebase_analysis_docs/04_FRONTEND_APP_ROUTER_PAGES.md) | Next.js App Router layout, zero horizontal scroll rule, dynamic role dashboard switcher, login portal in `frontend/app/`. |
| 🎨 **Frontend Components, State & Services** | [05_FRONTEND_COMPONENTS_AND_STORE.md](file:///d:/Harbinger%20Training/LMS/LMS/Academy/codebase_analysis_docs/05_FRONTEND_COMPONENTS_AND_STORE.md) | Zustand auth state persistence, `lib/rbac.ts` helpers, `RoleGate.tsx`, Sidebar role filtering, and Course catalog components in `frontend/components/`. |

---

## 🚀 Quick Summary of the 5 System Roles

1. **`SUPER_ADMIN`**: Global access across all departments, system telemetry, platform audit logs, and settings.
2. **`ADMIN`**: Department-scoped administration, user provisioning, course approvals, and department reports.
3. **`TEACHER`**: Course authoring, section & quiz editing, owned course student analytics.
4. **`LEARNER`**: Enrolled course progress tracking, department catalog self-enrollment, quiz completion, and certificate downloads.
5. **`GUEST`**: Public course catalog preview, demo dashboard, and enrollment prompts.
