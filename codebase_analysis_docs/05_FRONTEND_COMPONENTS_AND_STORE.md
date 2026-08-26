# Frontend Components, State & Services

## 1. Directory Structure

```
frontend/
├── store/
│   └── auth.store.ts       # Zustand auth store with localStorage persistence
├── lib/
│   ├── rbac.ts             # Helper permissions functions
│   ├── RoleGate.tsx        # Conditional component renderer wrapper
│   ├── api.ts              # Axios instance configured with JWT interceptor
│   └── utils.ts            # Tailwind class merger (clsx + tailwind-merge)
├── services/
│   ├── auth.service.ts     # Login & current user API requests
│   ├── course.service.ts   # Catalog fetching, course creation, draft saving
│   └── org.service.ts      # Department & user management requests
└── components/
    ├── layout/
    │   ├── TopBar.tsx      # User avatar, initials, role badge & logout
    │   ├── Sidebar.tsx     # Role-filtered navigation links
    │   ├── SecondaryNav.tsx# Breadcrumbs & action buttons
    │   └── Footer.tsx      # Responsive footer
    ├── courses/
    │   ├── CourseCatalog.tsx
    │   ├── CourseCard.tsx
    │   ├── CreateCourseModal.tsx
    │   └── CoursePreviewView.tsx
    └── common/
        └── SakshamLogo.tsx # Brand asset component
```

---

## 2. Authorization State & Storage (`store/auth.store.ts`)

- Uses **Zustand** with `persist` middleware stored under key `"lms-auth-storage"`.
- Keeps `token`, `user` object (`id`, `username`, `role`, `employeeId`, `departmentId`), and `isAuthenticated` boolean in synced local state.
- Automatically attaches `Authorization: Bearer <token>` to all HTTP API requests via `lib/api.ts` Axios request interceptor.

---

## 3. UI Navigation & Role Gate Enforcement

### A. Dynamic Navigation Filter (`components/layout/Sidebar.tsx`)
Filters items using `hasRole()` checks:
- **`SUPER_ADMIN`**: Shows all 9 links (Dashboard, Organization, Users, Courses, Certificates, Events, Reports, Darwinbox Sync, Settings).
- **`ADMIN`**: Shows 7 links (Dashboard, Organization, Users, Courses, Certificates, Events, Reports).
- **`TEACHER`**: Shows 5 links (Dashboard, Courses, Certificates, Events, Reports).
- **`LEARNER`**: Shows 4 links (Dashboard, Courses, Certificates, Skill Cloud).
- **`GUEST`**: Shows Preview Catalog link only.

### B. Declarative Role Gate Helper (`lib/RoleGate.tsx`)
Allows clean conditional rendering without scattering `if` statements inside JSX:

```tsx
<RoleGate allowedRoles={["SUPER_ADMIN", "ADMIN", "TEACHER"]}>
  <Button onClick={openCreateModal}>+ Create Course</Button>
</RoleGate>
```

---

## 4. Course Components & Learner Player (`components/courses/`)

1. **`CourseCatalog.tsx` & `CourseCard.tsx`**:
   - Renders course cards with category pill, duration badge, status badge (`DRAFT`/`PUBLISHED`), department badge, and dynamic action buttons ("Continue", "Edit", "Preview").
2. **`CreateCourseModal.tsx`**:
   - Quick course creation dialog validating course title, category, department, and initial status.
3. **`CoursePreviewView.tsx`**:
   - Interactive media player rendering video lessons, section navigation, document attachments, and quiz modals.
