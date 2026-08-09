# Academy LMS — Comprehensive Implementation Report (`priyanka.md`)

This document summarizes all completed modules, technical architecture updates, and department-level security enhancements achieved across the **Academy LMS** platform.

---

## 1. Authentication & Role-Based Authorization (RBAC) System

### Authentication Engine & Session Management
- **JWT-Based Authentication**: Secure token-based authentication (`auth.service.ts`, `auth.middleware.ts`) with password hashing powered by `bcrypt`.
- **Flexible Login Identification**: Login support accepting either **Username** (e.g. `Priyanka Davhare`, `omprakash`, `Employee15 User`) or **Official Corporate Email**.
- **Session Persistence**: Automatic token validation, HTTP header authorization bearer guard, and local session sync across reloads.

### Role Hierarchy & Access Boundaries
The platform enforces 4 distinct system roles with dynamic permission middleware (`permission.middleware.ts`):
1. **Super Admin (`SUPER_ADMIN`)**:
   - Organization-wide privileges.
   - Can create global or department-targeted courses and events.
   - Can view, approve, or reject skill cloud requests across all departments.
   - Access to full administrative management, bulk enrollments, and global reports.
2. **Department Admin (`ADMIN`)**:
   - Department-scoped privileges.
   - Course creation is automatically locked to their assigned department (e.g. HR Admin creates HR courses only).
   - Event creation is restricted to their assigned department.
   - Skill cloud approvals are strictly scoped to employees in their own department.
3. **Teacher / Instructor (`TEACHER`)**:
   - Curriculum creation, content upload, interactive quiz/assignment management.
   - Access to the submission grading workspace (`/courses/teacher/submissions`) to review learner answers and assign letter grades (`A+`, `A`, `B`, `C`).
4. **Learner / Employee (`LEARNER`)**:
   - Department-scoped course catalog access.
   - Option 1 Self-Enrollment, interactive video player, quiz taking, assignment submission, and certificate claiming.

### Seeded Multi-Role Test Accounts
The database contains seeded test accounts across all roles and departments for end-to-end verification:
- **Super Admins**: `Priyanka Davhare`, `Omprakash Pandey`
- **Department Admins**: HR Admin, Management Admin, Finance Admin
- **Teachers & Instructors**: System Instructors
- **Employees / Learners**: Seeded accounts (`Employee1 User` through `Employee20 User`)

---

## 2. Skill Cloud Dashboard & Endorsement System

### Department-Scoped Requests & Approvals
- **Super Admin (`SUPER_ADMIN`)**: Can view, approve, or reject skill and project endorsement requests across all departments in the organization.
- **Department Admin (`ADMIN`)**: Can **only** view, approve, or reject skill and project requests submitted by employees belonging to their assigned department. Skill requests from other departments (e.g., HR requests when logged in as a Management Admin) are strictly hidden.

### Targeted Approval Notifications
- When a learner or employee submits a skill or project for endorsement, the system retrieves the submitter's `departmentId`.
- Approval notifications (`SKILL_SUBMITTED`, `PROJECT_SUBMITTED`) are dispatched **only to Super Admins and the Department Admins of that specific department**. Admins in other departments do not receive irrelevant approval notifications.

### Backend Authorization Guards
- In `skill.service.ts` (`handleApprovalAction`), an explicit authorization check prevents non-SuperAdmin reviewers from approving or rejecting requests for users outside their assigned department.

---

## 3. Course Management & Department Scoping

### Creator Department Lock during Course Creation
- **Department Admin (`ADMIN`)**: When an Admin creates a course, the **Department** field in Step 1 (`BasicInfoForm.tsx`) is automatically locked to their assigned department (e.g., Finance Admin $\rightarrow$ Finance Department). The selection is disabled with a lock indicator (`Fixed (Your Dept)`).
- **Super Admin (`SUPER_ADMIN`)**: Super Admins can assign a course to a specific department or select **"Global (All Departments)"** to make it accessible company-wide.

### Dynamic Department Isolation
- Courses are filtered in the backend query layer (`course.service.ts` - `buildScopeFilter`):
  - **Admins & Teachers**: View global courses, courses in their department, courses they created, or courses where assigned as an instructor.
  - **Learners**: View published global courses, published department-specific courses, or courses where explicitly enrolled.
  - **Isolation**: HR department courses (e.g. `HRRR`) are hidden from Management Admins and learners in other departments.

### Dashboard & Sidebar Purging
- Deleted courses are automatically purged from local storage and dashboard tiles (`purgeDeletedRecentCourses`). Static mock fallback data was eliminated from `Sidebar.tsx`.

---

## 4. Course Enrollment Module & Access Control

### Option 1: Self Enrollment (`SELF`)
- **Native LMS Player Layout**: Preserves 100% of the platform's native layout (Left Curriculum Content Sidebar, Top Header Bar, Right Navigation Sidebar, and Theme styling).
- **Restricted Access & Lock Screen**:
  - Unenrolled learners view locked icons (`<Lock className="text-amber-500" />`) on sidebar curriculum items with click guards.
  - The center video player box displays an integrated platform-themed Hero Overlay card with a Lock badge, course summary, and green **"Enroll Now To Access Course"** action button.
- **Database Persistence**: Clicking **"Enroll Now"** executes `selfEnrollCourse(courseId)`, saving an `Enrollment` record (`status: "IN_PROGRESS"`, `progress: 0`) in MySQL, replacing lock icons with interactive Play buttons, and unlocking full video lessons, quizzes, assignments, and notes.

### Option 2: Single Admin Direct Enrollment (`ADMIN`)
- **Single User Lookup**: Admin/SuperAdmin inputs an employee by Username, Official Email, or Employee Code (e.g., `priyanka`, `omprakash@company.com`, `EMP001`).
- **Real-Time DB Verification**: Verified via `/api/courses/verify-user` against `user_accounts` and `employees` database tables.
- **Direct Access**: Enrolled learners directly access course modules without encountering an "Enroll Now" prompt.

### Option 3: Group / Bulk Excel Enrollment (`BULK`)
- **Batch Excel Parser**: Admin/SuperAdmin uploads an Excel file (`.xlsx`, `.xls`, `.csv`) containing employee usernames. Verified row-by-row via `/api/courses/verify-bulk-file`.
- **Partial Success & Failure Breakdown**:
  - **Valid Employees**: Validated usernames are enrolled in the database for that specific course.
  - **Invalid Breakdown**: Invalid or missing usernames are separated into a detailed error summary table displaying the exact username and reason (e.g. *"User not found in system database"*) for easy admin review.

### Wizard State Isolation & Auto-Enrollment Removal
- **State Reset (`create/page.tsx` & `ReviewPublishForm.tsx`)**: Fresh course creation sessions reset `enrolledUsersList` to an empty array (`[]`). Option 1 (`SELF`) courses publish with `enrolledUserIds: []`, preventing CSV lists from bleeding into newly created courses.
- **Backend Progress Query (`progress.service.ts`)**: Removed automatic enrollment creation on `getLearnerCourseProgress` queries, ensuring stable unenrolled views without page flashes.

---

## 5. Curriculum Persistence & Active Learning Timer

### Real-Time Curriculum Section Persistence
- When creating or updating a course, curriculum sections, video lessons, quizzes, and assignments are saved directly to MySQL tables (`CourseSection` and `LearningContent`).
- Assessment configuration JSON strings (`quizConfigJson` and `assignmentConfigJson`) are stored for dynamic rendering.

### Interaction-Driven Learning Timer
- The learning timer (`isLearningActive`) ticks **only when a user actively interacts with a lesson unit** (e.g. watching a video or opening a quiz/assignment). Opening the page idle does not consume learning time.
- Time spent is automatically synchronized to the database every 30 seconds.

### Scoped Admin Time Spent Display
- Raw time spent statistics (`Admin Tracking — Time Spent: Xh Ym`) are visible strictly to `SUPER_ADMIN`, `ADMIN`, and `TEACHER` roles.

---

## 6. Department-Scoped Event & Calendar System

### Database Schema Relation
- Added `departmentId` field and relation linking `Event` to the `Department` model in `schema.prisma`.

### Event Scoping Rules
- **Super Admin (`SUPER_ADMIN`)**: Access to all events across all departments. Can publish events globally or target specific departments.
- **Department Admin (`ADMIN`)**: Events created by an Admin default to their department. Admins can only view global events or events matching their department.

### Interactive Calendar Scope Selector
- Integrated a **Target Department Scope Selector** into the **Add Event** modal on the `/events` page.

---

## 7. Assessment, Submission & Grading System

### Interactive Quiz & Assignment Workspaces
- Integrated `LearnerQuizModal` for interactive multiple-choice evaluations and immediate score displays.
- Integrated `LearnerAssignmentModal` for practical task submissions (text responses and external file URLs).

### Teacher & Admin Grading Interface
- Provided the `/courses/teacher/submissions` review workspace where instructors and admins can view pending submissions, assign letter grades (`A+`, `A`, `B`, `C`), and provide written feedback.

---

## 8. Udemy-Style Learner Experience Refactoring (`preview/page.tsx`)

### Course Discovery & Landing Page Overview (`viewMode === "overview"`)
- Renders a rich **Course Overview Landing Page** when a learner selects a course from the catalog or dashboard.
- **Dynamic Metadata & Counts**: Title, Short & Full Description, Thumbnail, Target Audience/Department, Category Tag, Level (`Beginner`, `Intermediate`, `Advanced`), Course Status (`PUBLISHED`), Total Duration, and dynamic curriculum metrics (Total Sections, Total Lessons, Total Quizzes, Total Assignments).
- **Creator vs Instructor Distinction**:
  - `Created by`: Strictly displays `creatorName` (Admin/SA creator, e.g. `Sneha Patil`). Curriculum updates by teachers never overwrite course creator attribution.
  - `Instructor Information`: Displays assigned faculty teacher (`instructorName`).
- **Enrolment Action Box**:
  - Displays **"Enroll Now (Free)"** for `SELF` courses (executes self-enrollment and opens player).
  - Displays **"Admin Enrolment Required"** for `ADMIN_ASSIGNED` courses (restricts player access until assigned).
  - Displays **"Continue Learning"** with a live progress bar (`X% Completed`) for enrolled learners.

### Interactive Course Player (`viewMode === "player"`)
- Sticky top header with progress bar (`X% Completed`), lesson breadcrumbs, `< Overview` button, and permanent **"Claim Certificate" / "Certificate (Locked)"** button.
- Main viewport for Video, PDF, External Links, Quizzes, and Assignments.
- Section accordions in the sidebar with module-level **"Mark Section"** completion buttons.

---

## 9. Business Rules, Progress Enforcement & Certificate Export

### High-Water Mark & 100% Course Completion Permanence
- **High-Water Mark Calculation**: Progress strictly evaluates as `Math.max(currentProgress, calculatedProgress)`. Re-clicking or reviewing completed lessons never decreases progress.
- **100% Completion Lock**: Once a course reaches 100% completion (`status: "COMPLETED"`, `progress: 100`), its score locks permanently at **100% Completed** across dashboard tiles and the player.

### Active Curriculum Calculation (`isActive: true`)
- Restricts total lesson and progress calculation strictly to active published sections and contents (`isActive: true`). Soft-deleted items from previous course edits are excluded, ensuring 1 out of 1 active lesson evaluates to **100% Completed**.

### Quiz Attempt History Isolation
- Stores all quiz attempts in `AssessmentSubmission` with attempt numbers (`attemptNumber`, `score`, `percentage`, `grade`, `submittedAt`). Taking a quiz multiple times records attempt history without degrading overall progress.

### Un-intrusive Background Real-Time Time Tracking
- Background pings (`15s` active player heartbeats) continuously record accumulated viewing time (`timeSpentSeconds`) in the database for Admin, Super Admin, and Teacher supervision reporting. Time tracking is suppressed on completed courses to prevent duplicate padding.

### Dashboard & Catalog Progress Overlay Badges
- Integrated `GET /courses/my-enrollments` endpoint.
- Every course card on the **Learner Dashboard** (`/dashboard`) and **Academy Curriculum Catalog** (`/courses`) displays a dynamic progress badge overlay:
  - **Completed Courses**: Green **`✓ 100% Done`** badge overlay.
  - **In-Progress Courses**: Amber **`X% Progress`** badge overlay with progress bar.

### High-Definition Vector PDF Certificate Download
- Streamlined certificate export in `LearnerCertificateModal.tsx` to native browser print/PDF rendering (`window.print()`), completely resolving DOM SVG XML parsing errors (`EntityRef: expecting ';'`) and CORS canvas tainting (`toDataURL` SecurityError).
- Produces high-definition vector PDF certificate documents displaying exact ornate double gold borders, Cinzel/Inter typography, Harbinger logo, signatory details, and verification serial codes.

---

*Report updated on 2026-08-09. All build routes, authentication endpoints, and unit integration tests verified with 0 errors.*
