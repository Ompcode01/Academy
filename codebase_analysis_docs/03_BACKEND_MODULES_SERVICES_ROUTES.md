# Backend Services, Controllers & API Routes

## 1. Directory Structure

```
backend/src/
├── controllers/          # Express Request/Response handlers
│   ├── auth.controller.ts
│   ├── dashboard.controller.ts
│   ├── department.controller.ts
│   ├── employee.controller.ts
│   └── userAccount.controller.ts
├── services/             # Core Business & Database logic
│   ├── auth.service.ts
│   ├── dashboard.service.ts
│   └── guestGrant.service.ts
├── modules/
│   └── course/           # Self-contained Course Domain Module
│       ├── course.controller.ts
│       ├── course.repository.ts
│       ├── course.routes.ts
│       └── course.service.ts
└── routes/               # Express Router mapping paths to Controllers
    ├── auth.routes.ts
    ├── dashboard.routes.ts
    └── department.routes.ts
```

---

## 2. Course Module Logic (`backend/src/modules/course/`)

The Course Module manages course authoring, 9-step wizard state persistence, multi-format media attachment uploads, and section/quiz configuration.

### A. Role-Scoped Query Engine (`course.service.ts -> buildScopeFilter`)
When any client requests `/api/courses`, the backend applies role-scoped filtering before fetching records from MySQL:

```typescript
switch (userContext.role) {
  case "SUPER_ADMIN":
    // Returns ALL courses across all departments (Drafts + Published + Archived)
    return {};

  case "ADMIN":
    // Returns department courses, global courses (null departmentId), or courses created by themselves
    return { OR: [{ departmentId: null }, { departmentId: userContext.departmentId }, { creatorId: userContext.employeeId }] };

  case "TEACHER":
    // Returns department courses, assigned courses, or courses created by themselves
    return { OR: [{ departmentId: null }, { departmentId: userContext.departmentId }, { creatorId: userContext.employeeId }, { teachers: { some: { teacherId: userContext.employeeId } } }] };

  case "LEARNER":
    // Returns ONLY PUBLISHED courses in their department or enrolled courses
    return { status: "PUBLISHED", OR: [{ departmentId: null }, { departmentId: userContext.departmentId }, { enrollments: { some: { userId: userContext.employeeId } } }] };

  case "GUEST":
    // Returns ONLY PUBLISHED courses allowed via explicit GuestAccessGrant
    return { status: "PUBLISHED", OR: [{ departmentId: null }, ...] };
}
```

### B. Course Creation Wizard & Draft State Engine
- Supports a 9-step wizard process (`draftStep: 1` through `9`).
- Allows teachers/admins to pause and resume course creation at any step.
- Converts raw sections and quiz configuration objects into relational `CourseSection` and `LearningContent` records upon final publishing (`status: "PUBLISHED"`).

---

## 3. Dashboard Metrics Service (`backend/src/services/dashboard.service.ts`)

Serves aggregate platform telemetry for `GET /api/dashboard/stats`:

1. **`SUPER_ADMIN` View Stats**:
   - Total System Users, Active Employees, Global Courses Count, Department Breakdown, Total Enrollments, System Completion Rates.
2. **`ADMIN` View Stats**:
   - Department Total Employees, Department Course Count, Active Enrollments, Pending Approvals.
3. **`TEACHER` View Stats**:
   - Total Created Courses, Total Active Enrolled Students across owned courses, Quiz Pass Rates, Completion Progress.
4. **`LEARNER` View Stats**:
   - Enrolled Courses Count, Completed Courses, In-Progress Courses, Overall Progress percentage, Next Due Dates.

---

## 4. Authentication Service (`backend/src/services/auth.service.ts`)

1. **Login Flow (`POST /api/auth/login`)**:
   - Validates `username` / `officialEmail` and `password`.
   - Fetches user's active role from `UserRole` table.
   - Generates JWT signed payload containing:
     ```json
     {
       "userId": 1,
       "employeeId": 1,
       "email": "superadmin@academy.com",
       "role": "SUPER_ADMIN",
       "departmentId": 1
     }
     ```
2. **Session Verification (`GET /api/auth/me`)**:
   - Verifies active session token and returns full user profile + role capabilities.
