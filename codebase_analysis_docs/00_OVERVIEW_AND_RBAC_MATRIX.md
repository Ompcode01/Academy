# Harbinger Academy LMS - System Overview & RBAC Architecture

## 1. Executive Summary

**Harbinger Academy LMS** is an enterprise Learning Management System (LMS) designed for corporate training management, department-scoped course distribution, employee skill tracking, and ERP integration (Darwinbox sync).

The system enforces strict **Role-Based Access Control (RBAC)** across both the Express backend API layer and the Next.js frontend UI layer, ensuring users can only access features and data appropriate to their designated system role.

---

## 2. The 5 System Roles

The LMS operates on **5 defined user roles**:

```
+-------------------------------------------------------------------------+
|                                5 ROLES                                  |
+---------------+---------------+---------------+---------------+---------+
|  SUPER_ADMIN  |     ADMIN     |    TEACHER    |    LEARNER    |  GUEST  |
+---------------+---------------+---------------+---------------+---------+
```

### 1. `SUPER_ADMIN`
- **Scope:** Platform-wide global access across all departments and system settings.
- **Key Responsibilities:**
  - Full system administration & security monitoring.
  - Access to platform-wide telemetry, user management, and global audit logs.
  - Ability to create, edit, delete, and publish courses across *any* department.
  - Can manage roles, permissions, department assignments, and Darwinbox ERP sync settings.
- **Who can see what:** Sees ALL sidebar navigation items (Dashboard, Organization, Users, Courses, Certificates, Events, Reports, Darwinbox Sync, Settings).

### 2. `ADMIN`
- **Scope:** Department-scoped or Organization-wide administrative access.
- **Key Responsibilities:**
  - Provisioning employees and managing user accounts within assigned departments.
  - Assigning roles and managing user enrollments.
  - Overseeing course creation, approval, and department catalog organization.
  - Viewing department-level analytics and reports.
- **Who can see what:** Sees Dashboard, Organization, Users, Courses, Certificates, Events, and Reports. Restricted from global system settings.

### 3. `TEACHER`
- **Scope:** Course curation, section management, and learner assessment.
- **Key Responsibilities:**
  - Designing & creating courses (video content, documents, quizzes/MCQs).
  - Editing courses where they are designated as creator or assigned instructor.
  - Viewing analytics and progress reports for learners enrolled in their courses/sections.
  - Publishing or archiving their owned courses.
- **Who can see what:** Sees Dashboard, Courses (with Create/Edit privileges), Certificates, Events, and Reports. Cannot access user provisioning, organization tree, or admin settings.

### 4. `LEARNER`
- **Scope:** Consumption of assigned & department-scoped learning content.
- **Key Responsibilities:**
  - Viewing enrolled courses, tracking personal course completion percentage, and viewing progress bars.
  - Browsing the department course catalog and requesting/self-enrolling in available courses.
  - Completing course sections, quizzes, and downloading earned certificates.
- **Who can see what:** Sees Dashboard (learner view with progress trackers), Courses (learner catalog view with "Enroll" / "Continue" buttons), Certificates, and Skill Cloud. Cannot see course creation controls or admin reports.

### 5. `GUEST`
- **Scope:** Public catalog preview and platform demo access.
- **Key Responsibilities:**
  - Browsing public course previews and catalog items.
  - Viewing basic course details without accessing internal section assessments or corporate user data.
  - Prompted with login / enrollment request triggers.
- **Who can see what:** Sees Guest Preview Dashboard and Public Course Catalog. Excluded from internal reports, creation forms, user directories, and certificates.

---

## 3. Comprehensive RBAC Matrix (Who Can See & Do What)

| Feature / Action | `SUPER_ADMIN` | `ADMIN` | `TEACHER` | `LEARNER` | `GUEST` |
|---|:---:|:---:|:---:|:---:|:---:|
| **Platform Settings & Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Darwinbox ERP Sync** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **User Directory & Provisioning** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Department Management** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create New Course** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit Any Course** | ✅ | ✅ | ❌ (Own only) | ❌ | ❌ |
| **Delete Course** | ✅ | ✅ | ❌ (Own only) | ❌ | ❌ |
| **View All Department Courses** | ✅ | ✅ | ✅ | Department catalog | Public catalog |
| **View Analytics & Reports** | Global | Dept-wide | Course-scoped | Personal progress | ❌ |
| **Enroll in Course** | Auto / Any | Auto / Any | Auto / Any | Self-enroll | ❌ |
| **Complete Content & Quizzes** | ✅ | ✅ | Preview | ✅ | Preview |
| **Download Certificates** | Any | Any | Course | Earned only | ❌ |

---

## 4. RBAC Enforcers in Code Logic

### A. Backend Enforcement (`backend/src/`)
1. **Authentication Middleware (`middleware/auth.middleware.ts`)**:
   - Extracts JWT token from the `Authorization: Bearer <token>` HTTP header.
   - Decodes token payload containing `userId`, `role`, `departmentId`, and `email`.
   - Attaches `req.user` to Express Request object.
2. **Role & Permission Verification Helpers**:
   - Routes check `req.user.role` before invoking controllers.
   - Course service queries apply role filters (`where: { departmentId: user.departmentId }` for non-Super-Admins, or creator filter for Teachers).

### B. Frontend Enforcement (`frontend/`)
1. **RBAC Rules Engine (`lib/rbac.ts`)**:
   - Defines boolean guard functions: `canCreateCourse(role)`, `canManageDepartments(role)`, `canManageUsers(role)`, `canManageSettings(role)`, and `canUserEditCourse(user, course)`.
2. **Declarative Component Gate (`components/common/RoleGate.tsx` or `lib/RoleGate.tsx`)**:
   - Wraps sensitive UI elements (buttons, edit modals, admin tables) to conditionally render only if the logged-in user possesses the required role.
3. **Dynamic Navigation Filtering (`components/layout/Sidebar.tsx`)**:
   - Filters sidebar navigation links based on `hasRole(user.role, ...allowedRoles)`.
4. **Dashboard View Router (`app/(dashboard)/dashboard/page.tsx`)**:
   - Dynamically renders `SuperAdminDashboard`, `AdminDashboard`, `TeacherDashboard`, or `LearnerDashboard` component based on `user.role`.
