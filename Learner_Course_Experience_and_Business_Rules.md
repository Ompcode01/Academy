# Learner Course Experience & Business Rules Documentation

This document summarizes the complete **Udemy-Style Learner Course Experience** and all **Core Business Rules & Technical Guardrails** implemented in the LMS platform.

---

## 1. Executive Summary

The Learner Course Experience has been refactored into a full **Udemy-style course flow** (`Course Catalog → Course Overview Landing Page → Enrolment Validation → Course Player → Module & Lesson Execution → Progress Tracking → Certificate Export`). All learner interactions strictly enforce administrative oversight, zero-degradation progress tracking, and flexible certificate export options.

---

## 2. Learner Course Flow & Navigation Experience

### A. Course Discovery & Landing Page Overview (`viewMode === "overview"`)
When a learner selects a course from the catalog or dashboard, the system renders a dedicated **Course Overview Landing Page** before launching lesson content:
- **Hero Metadata Header**: Displays Category Tag, Level (`Beginner`, `Intermediate`, `Advanced`), Course Status (`PUBLISHED`), Title, Short & Full Description, Department Target Audience, and Course Duration.
- **Dynamic Curriculum Metrics**: Computes exact dynamic counts directly from active curriculum items (`course.sections`):
  - Number of Sections / Modules
  - Number of Lessons / Contents
  - Number of Quizzes
  - Number of Assignments
- **Course Creator & Instructor Cards**:
  - **`Created by`**: Displays the Admin or Super Admin who created the course.
  - **`Instructor Information`**: Displays the assigned Certified Course Faculty/Teacher.
- **Action Card & Enrolment Logic**:
  - **`SELF` Enrolment**: Renders an **"Enroll Now (Free)"** button. On click, executes self-enrollment and immediately unlocks the course player.
  - **`ADMIN_ASSIGNED` Enrolment**: Displays an **"Admin Enrolment Required"** notice and locks lesson access until assigned by an administrator.
  - **Already Enrolled**: Displays **"Continue Learning"** button with a live progress bar (`X% Completed`).

### B. Interactive Course Player (`viewMode === "player"`)
- **Top Sticky Header**:
  - `< Overview` button to navigate back to the Course Landing Page.
  - Course title & current lesson breadcrumbs.
  - Overall progress bar (`X% Completed`).
  - **"Claim Certificate" / "Certificate (Locked)"** button.
- **Main Player Viewport**:
  - Multi-content player for Videos, PDF documents, External Links, Quizzes, and Assignments.
  - Lesson title, mandatory badge, and **"Mark as Completed"** toggle button.
  - Navigation controls (`← Previous Lesson` and `Next Lesson →`).
  - Tabbed bottom panel (`Lesson Details` and `Submissions & Feedback`).
- **Collapsible Curriculum Sidebar**:
  - Section accordions with lesson counts and module-level **"Mark Section"** completion buttons.
  - Lesson items with content type icons (`Play`, `FileText`, `HelpCircle`, `FileCheck2`), durations, completion checkmarks, and active lesson highlights.

---

## 3. Implemented Core Business Rules & Guardrails

| # | Business Rule | Technical Implementation & Behavior |
|---|---|---|
| **1** | **Course Creator vs Assigned Teacher Attribution** | `Created by` in the hero banner strictly displays `creatorName` (Admin/SA who created the database record). `Instructor Information` displays the assigned `CourseTeacher` (or falls back to creator if unassigned). Editing curriculum by teachers never overwrites `Created by`. |
| **2** | **Positive Dynamic Duration Calculation** | Total course duration evaluates strictly as a positive integer (`displayDurationHours = Math.max(1, Math.abs(course.duration))`), preventing negative duration displays (e.g. `-8 Hours Duration`). |
| **3** | **Active Curriculum Progress Calculation** | Progress calculations filter sections and contents strictly by `where: { isActive: true }`. Inactive soft-deleted items from previous course edits are excluded, ensuring 1 out of 1 active lesson evaluates to **100% Completed**. |
| **4** | **High-Water Mark & 100% Completion Permanence** | Course progress strictly follows a High-Water Mark (`Math.max(currentProgress, calculatedProgress)`). Re-clicking or reviewing completed lessons never decreases progress. Once 100% completed, the course progress locks permanently at **100% Completed**. |
| **5** | **Quiz Attempt History Isolation** | Repeated quiz attempts are saved in `AssessmentSubmission` with incremented attempt numbers (`attemptNumber`, `score`, `percentage`, `grade`, `submittedAt`). Re-taking a quiz records a new attempt entry without degrading or altering overall course progress. |
| **6** | **Un-intrusive Real-Time Time Tracking** | Learners enjoy a clean, distraction-free player UI. In the background, `15s` active player pings save accumulated viewing time (`timeSpentSeconds`) for Admin, SA, and Teacher supervision reporting. Time tracking is suppressed on already-completed courses to prevent duplicate padding. |
| **7** | **Permanent Certificate Button & Dual Export (PDF & PNG)** | The Certificate button is **ALWAYS VISIBLE** in the player header. If progress < 100%, clicking it displays a guidance toast (`"Certificate Locked — Complete 100%"`). Once 100% completed, it turns gold/amber (**"Claim Certificate"**) and opens the modal with 2 export options: **Download PDF** (print stream) and **Download PNG** (2x retina canvas rasterizer image download). |

---

## 4. Verification & System Health

- **Backend Build (`tsc`)**: Passed with **0 errors**.
- **Frontend Type Check (`npx tsc --noEmit`)**: Passed with **0 errors**.
