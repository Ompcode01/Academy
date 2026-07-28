# Harbinger Academy LMS — Features Documentation

This document describes the key features, pages, components, and workflows built into the **Harbinger Academy LMS** full-stack application.

---

## 1. Authentication & Security
- **Secure Portal Login**: Located at `/login`. Features form validations via React Hook Form and Zod to verify credentials.
- **JWT Authorization Interceptor**: Frontend automatically manages user sessions via Zustand. An Axios request interceptor injects the JWT token as a `Bearer` token in the header of all outgoing API calls.
- **Role-Based Access Control (RBAC)**: Backend validates routes using custom authorization middlewares:
  - `authenticate`: Verifies the validity of the JWT token.
  - `authorizeRoles(...)`: Restricts specific actions (like creating departments) to particular roles (e.g., `SUPER_ADMIN`).

---

## 2. Dashboard Home (`/dashboard`)
- **Key Metrics Overview**: Real-time widgets tracking key performance indicators (KPIs) loaded dynamically from database endpoints:
  - **Total Learners**: Count of registered employees.
  - **Total Courses**: Count of courses currently active.
  - **Active Departments**: Total departments initialized.
  - **Completion Rate**: Analytical widget (percentage tracking).
- **Recent Activity Feed**: Logs recent learning milestones and administrator logs (e.g. course completions, new uploads).
- **Quick Actions Panel**: Direct navigation links for creating courses, managing directory logs, and synchronizing external systems.

---

## 3. Course Management & List (`/courses`)
- **Course List Table**: Searchable and paginated records showing course codes, titles, category labels, mapped departments, and active instructors.
- **Aesthetic Classification Badges**: Color-coded category indicators:
  - *Technical* (Blue)
  - *Management* (Purple)
  - *Soft Skills* (Emerald)
  - *HR* (Slate)
- **Status Indicators**: Status pill variants for *Published* (Green), *Draft* (Gray), and *Archived* (Amber).
- **Interactive Filters**: Dynamic sorting and search filters mapping courses by status, category, and department fields.

---

## 4. Create Course Wizard (`/courses/create`)
A 9-step administrative course configuration tool guiding instructors through:
1. **Basic Info**: Course title, Level (Beginner/Intermediate/Advanced), Language, short description, rich text editor for detailed descriptions, and drag-and-drop course thumbnail.
2. **Modules & Lessons (Structure Builder)**:
   - **Interactive Tree Hierarchy**: Expandable module list with drag-and-drop handles for course sections.
   - **Lesson Detail Editor**: Configure lesson name, duration, description, and type (Video, Text, Video + Text, or Other).
3. **Assessments & Quizzes**:
   - **Question Bank**: Form to build custom questions (MCQ, True/False, Short Answer).
   - **MCQ Editor**: Options input, correct answer highlighting, mark settings, negative marks, and question explanation box.
   - **Quiz Controls**: Preferences tab to toggle options like shuffling questions, showing results, and allowing retakes.

---

## 5. Course Preview — Learner View (`/courses/[id]/preview`)
- **Interactive Media Player**: Centered responsive video player layout showing lesson titles and progression overlays.
- **Progress Tracking**: Progress status bar indicating the exact percentage completion of the learner.
- **Interactive Accordion Sidebar**: Displays course sections and lessons. Checked icons represent completed lessons, play icons denote active lessons, and fraction tracking shows completion rate per module (e.g. `3/5`).
- **Context Tabs**: Bottom tabs contextually rendering course *Overview*, *Resources* links, and a personal *Notes* notepad.
- **Take Quiz Portal**: Direct redirection to assessments.

---

## 6. Organization Directory (`/organization`)
- **Department Inventory**: Live table displaying departments fetched directly from the database schema.
- **ERP Synchronization**: Lists department codes (e.g. `ENG`, `HR`, `MGT`) alongside active status indicators.
- **Department Creation**: Popup dialog enabling Super Admins to manually insert department codes and official titles.

---

## 7. Employee Management (`/users`)
- **Directory Records**: Table showing employee profiles from the database, listing designation, department affiliation badges, and official dates of joining.
- **Profile Cards**: Displays initials inside fallback avatars.
- **Status Tracking**: Status badges highlighting current employment state (`ACTIVE`, `INACTIVE`, `RESIGNED`).

---

## 8. Classification & Pathing
- **Categories Portal** (`/courses/categories`): Directory grouping topics and training tracks. Allows adding new categories with descriptive summaries.
- **Learning Paths** (`/courses/learning-paths`): High-level study maps combining multiple courses in order. Shows total course counts, estimated time durations, and skill levels.

---

## 9. Integration & Auditing (`/darwinbox-sync`)
- **ERP Sync Tool**: Direct manual sync control linked to a running progress bar.
- **Audit Logs Table**: Scrollable inventory tracking synchronizations. Records log IDs, timestamps, categories, record counts, and status indicators (*Success*, *Warning*, or *Failed*).
