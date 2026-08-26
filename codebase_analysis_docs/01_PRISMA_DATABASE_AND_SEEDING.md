# Database Layer: Prisma Schema & Seeding Logic

## 1. Folder Overview: `backend/prisma/`

This folder manages database schema migrations, relational models, object-relational mapping (ORM) via Prisma for MySQL, and seed data initialization.

```
backend/prisma/
├── schema.prisma    # MySQL Database Schema definitions
└── seed.ts          # Seeding script populating initial roles, departments, employees & courses
```

---

## 2. Core Data Models (`schema.prisma`)

### A. Organization & User Management
1. **`Department` (`departments` table)**
   - Fields: `id` (BigInt PK), `departmentCode` (Unique), `departmentName` (Unique), `isActive`.
   - Relations: Has many `Employee`, `Course`, `Event`, `GuestAccessGrant`.

2. **`Employee` (`employees` table)**
   - Fields: `id` (BigInt PK), `employeeCode`, `firstName`, `lastName`, `officialEmail` (Unique), `designation`, `departmentId` (FK), `managerId` (Self-relation FK for organizational hierarchy), `employmentStatus`.
   - Relations: Belongs to `Department`, optional `manager`, has `UserAccount`, assigned roles, created courses, course enrollments.

3. **`UserAccount` (`user_accounts` table)**
   - Fields: `id` (BigInt PK), `employeeId` (FK, Unique), `username` (Unique), `passwordHash`, `lastLogin`, `failedLoginAttempts`, `accountLocked`, `isActive`.
   - Security: One-to-one relation with `Employee`. Stores bcrypt password hashes.

### B. RBAC Subsystem
4. **`Role` (`roles` table)**
   - Fields: `id`, `roleName` (e.g. `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `LEARNER`, `GUEST`), `roleCode`, `description`, `isActive`.
5. **`Permission` (`permissions` table)**
   - Fields: `id`, `permissionName`, `permissionCode`, `moduleName`, `description`.
6. **`UserRole` (`user_roles` table)**
   - Fields: Join table connecting `Employee` to `Role`.
7. **`RolePermission` (`role_permissions` table)**
   - Fields: Join table connecting `Role` to `Permission`.

### C. Learning & Course Subsystem
8. **`Category` (`categories` table)**
   - Categorizes courses (e.g. "Software Engineering", "Compliance", "Management").

9. **`Course` (`courses` table)**
   - Fields:
     - `id` (Unsigned BigInt PK)
     - `categoryId` (FK to Category)
     - `departmentId` (Nullable FK to Department - `null` means organization-wide course)
     - `creatorId` (FK to Employee)
     - `title`, `shortName`, `courseCode`, `shortDescription`, `description`, `thumbnail`
     - `duration` (minutes), `level` (Beginner/Intermediate/Advanced), `language`
     - `status`: Enum (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
     - `draftStep`: Integer tracking the wizard creation progress (1-9)
     - `enrollmentType`, `isMandatory`, `isActive`
   - Relations: Belongs to `Category`, `Department`, `Employee` (creator); Has many `CourseSection`, `CourseTeacher`, `Enrollment`.

10. **`CourseTeacher` (`course_teachers` table)**
    - Secondary teachers/instructors assigned to a course.

11. **`CourseSection` (`course_sections` table)**
    - Modules/chapters within a course. Stores `sectionOrder` and `isPublished`.

12. **`LearningContent` (`learning_contents` table)**
    - Lessons within a section. Types: `VIDEO`, `DOCUMENT`, `QUIZ`, `ASSIGNMENT`.
    - Stores `quizConfigJson` and `assignmentConfigJson` for dynamic interactive content.

13. **`Enrollment` (`enrollments` table)**
    - Connects `Employee` (learner) to `Course`.
    - Tracks `progress` (Decimal 0-100%), `status` (`ENROLLED`, `IN_PROGRESS`, `COMPLETED`), `timeSpentSeconds`, `startDate`, and `completedAt`.

14. **`UserLessonProgress` & `AssessmentSubmission`**
    - Granular tracking for video timestamp positions (`watchedSeconds`, `lastPosition`) and quiz response scoring.

---

## 3. Database Enums

```prisma
enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum EmploymentStatus {
  ACTIVE
  ON_LEAVE
  TERMINATED
}
```

---

## 4. Seeding Logic (`seed.ts`)

The database seeding script (`backend/prisma/seed.ts`) automates initial data population:
1. Creates predefined **Departments**: Engineering, Human Resources, Operations, Product, Sales.
2. Populates core **Roles**: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `LEARNER`, `GUEST`.
3. Populates **Permissions**: Granular action permissions grouped by module (`USER_MANAGEMENT`, `COURSE_MANAGEMENT`, `REPORTS`).
4. Creates default **Employees** and linked **UserAccounts** for each of the 5 roles with hashed credentials (`Password123!`).
5. Populates default course **Categories** and sample **Courses** tied to real `departmentId` and `creatorId` references.
