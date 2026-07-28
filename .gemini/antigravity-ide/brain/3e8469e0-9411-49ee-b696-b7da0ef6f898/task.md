# Implementation Tasks

## Component 1: Prisma Schema & Database
- [x] Update `schema.prisma` — add `CourseStatus` enum, `departmentId`, `creatorId` to Course, reverse relations
- [x] Update `seed.ts` — seed categories and sample courses
- [x] Run `prisma db push` and `prisma generate`
- [x] Run `npm run seed`

## Component 2: Backend Auth — Enrich JWT
- [x] Update `jwt.ts` — add `role`, `departmentId` to `JwtPayload`
- [x] Update `auth.service.ts` — include role/dept in token

## Component 3: Backend Course Module — RBAC Routes & Scoped Queries
- [x] Update `course.routes.ts` — add auth/role middleware
- [x] Update `course.controller.ts` — read user context, pass to service
- [x] Update `course.service.ts` — role-scoped queries
- [x] Update `course.repository.ts` — new fields, relations, scoped filters
- [x] Update `category.routes.ts` — protect POST

## Component 4: Backend Dashboard Stats
- [x] Create `dashboard.service.ts`
- [x] Create `dashboard.controller.ts`
- [x] Create `dashboard.routes.ts`
- [x] Register in `app.ts`

## Component 5: Frontend Auth Store
- [x] Update `auth.store.ts` — expand User, add persist
- [x] Update `login-form.tsx` — pass employeeId/departmentId

## Component 6: Frontend RBAC Utilities
- [x] Create `lib/rbac.ts`
- [x] Create `components/auth/RoleGate.tsx`

## Component 7: Frontend Layout — Viewport Containment
- [x] Update `globals.css` — overflow-x hidden
- [x] Update root `layout.tsx` — overflow classes
- [x] Update dashboard `layout.tsx` — max-w, min-w-0
- [x] Update `Sidebar.tsx` — role-filtered nav, shrink-0
- [x] Update `TopBar.tsx` — dynamic user info, logout

## Component 8: Frontend Dynamic Dashboard
- [x] Create `services/api/dashboard.service.ts`
- [x] Refactor `dashboard/page.tsx` — role-based views, dynamic stats

## Component 9: Frontend Courses Page
- [x] Update `courses/page.tsx` — remove mocks, fetch dynamic
- [x] Update `CourseFilters.tsx` — dynamic dropdowns
- [x] Update `CourseTable.tsx` — new interface, role-gated actions
- [x] Update `services/api/course.service.ts` — new fields

## Component 10: Course Creation Modal
- [x] Create `components/courses/CreateCourseModal.tsx`
