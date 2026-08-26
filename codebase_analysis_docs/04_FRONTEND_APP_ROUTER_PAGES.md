# Frontend App Router & Page Architecture

## 1. Directory Structure (`frontend/app/`)

The application uses Next.js App Router with React 19, Tailwind CSS v4, and Lucide React icons.

```
frontend/app/
├── layout.tsx                # Root layout wrapper (Inter font, Toaster, TooltipProvider)
├── globals.css               # Global Tailwind CSS tokens & layout constraints
├── page.tsx                  # Root route redirecting to /dashboard or /login
├── (auth)/
│   └── login/
│       └── page.tsx          # Enterprise Login Portal with quick-switch demo profiles
└── (dashboard)/
    ├── layout.tsx            # Protected Dashboard layout (TopBar, SecondaryNav, Sidebar, Footer)
    ├── dashboard/
    │   └── page.tsx          # Dynamic Role-based Dashboard Switcher
    ├── courses/
    │   ├── page.tsx          # Dynamic Course Catalog & Filterable Grid
    │   ├── create/
    │   │   └── page.tsx      # 9-Step Administrative Course Creator Wizard
    │   └── [id]/
    │       ├── page.tsx      # Course Details View
    │       └── preview/
    │           └── page.tsx  # Learner Course Experience & Video Player
    ├── organization/
    │   └── page.tsx          # Department Hierarchy & Employee Tree
    ├── users/
    │   └── page.tsx          # User Directory & Role Assignment Controls
    ├── reports/
    │   └── page.tsx          # Platform Analytics & Export Engine
    └── darwinbox-sync/
        └── page.tsx          # ERP Sync Status & Inspection Matrix
```

---

## 2. Layout Constraints & Design Tokens

### A. Zero Horizontal Scroll Enforcement
To eliminate horizontal scrollbars on desktop and mobile viewports:
- `<html class="h-full w-full overflow-x-hidden">`
- `<body class="min-h-screen w-full overflow-x-hidden flex flex-col font-sans">`
- `max-w-[100vw]` applied to all top-level container divs.

### B. Dynamic Role Dashboard Switcher (`app/(dashboard)/dashboard/page.tsx`)
Inspects active user role from Zustand auth store and renders the corresponding view:

```tsx
export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role || "GUEST";

  switch (role) {
    case "SUPER_ADMIN":
      return <SuperAdminDashboardView />;
    case "ADMIN":
      return <AdminDashboardView />;
    case "TEACHER":
      return <TeacherDashboardView />;
    case "LEARNER":
      return <LearnerDashboardView />;
    case "GUEST":
    default:
      return <GuestDashboardView />;
  }
}
```

---

## 3. Login Portal (`app/(auth)/login/page.tsx`)

- Provides an interactive enterprise login interface.
- Includes quick-switch demo badges for one-click testing as any of the 5 roles:
  - **Super Admin**: `superadmin@academy.com`
  - **Admin**: `admin.eng@academy.com`
  - **Teacher**: `teacher.react@academy.com`
  - **Learner**: `learner.doe@academy.com`
  - **Guest**: `guest.visitor@academy.com`
- Upon authentication, receives JWT, stores token in `localStorage`, updates Zustand `auth.store.ts`, and redirects user to `/dashboard`.
