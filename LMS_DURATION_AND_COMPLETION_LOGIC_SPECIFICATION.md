# LMS Duration Calculation & Learner Completion Rules Specification

This document summarizes the exact business rules, formulas, and codebase files governing **Content Duration Calculation** and **Learner Completion Criteria** across the entire LMS platform.

---

## ⏱️ 1. Content Duration Calculation Rules

Whenever a course content item is created or updated, the duration (in minutes and exact seconds) is determined using the following hierarchy:

1. **Top Priority — Admin / SA / Teacher Manual Override**:
   If an Admin, Super Admin, or Teacher specifies a custom duration in minutes during content creation/editing, **that exact value is used** for course total calculations, progress tracking, and section totals.

2. **Automatic Rule Fallbacks (Handwritten Rule Engine)**:
   If no custom duration is specified, the system automatically applies the following formulas based on content type:

| Content Type | Primary Input Metric | Automatic Formula | Default Fallback |
| :--- | :--- | :--- | :--- |
| **PDF Document** | Page Count (`pageCount`) | `pageCount * 30 seconds` | 30 seconds (1 page) |
| **PPT Presentation** | Slide Count (`slideCount`) | `slideCount * 30 seconds` | 30 seconds (1 slide) |
| **Text Article** | Word Count (`wordCount`) | `wordCount * 1 second` (or 250 wpm) | 300 seconds (300 words) |
| **External Link** | Fixed Resource Allocation | `120 seconds` | 2 minutes |
| **Quiz / Assessment** | Question Count (`questionsCount`) | `questionsCount * 60 seconds` | 300 seconds (5 questions) |
| **Assignment / Project** | Admin Effort Allocation | `1,800 seconds` | 30 minutes |
| **Feedback Survey** | Question Count (`questionsCount`) | `questionsCount * 30 seconds` | 150 seconds (5 questions) |
| **YouTube Video** | Scraped Video Duration | Parsed ISO 8601 duration | 600 seconds (10 minutes) |
| **Udemy Course** | External Course Length | Allocated default duration | 36,000 seconds (10 hours) |
| **SCORM Package** | Manifest Duration | Parsed `manifest.xml` duration | 900 seconds (15 minutes) |

### 📂 Codebase Reference Files for Duration Calculation:
- **Backend Calculator**: [`backend/src/utils/durationCalculator.ts`](file:///d:/Harbinger%20Training/LMS/LMS/Academy/backend/src/utils/durationCalculator.ts#L50-L150)
- **Frontend Real-time Preview Helper**: [`frontend/lib/durationHelper.ts`](file:///d:/Harbinger%20Training/LMS/LMS/Academy/frontend/lib/durationHelper.ts#L38-L120)

---

## 🎯 2. Learner Completion Verification Rules

When a learner views a lesson in the Course Player and clicks **"Mark Complete"** or **"Mark Section Complete"**, the system evaluates the following verification criteria:

| Content Type | Completion Requirement | Validation Behavior |
| :--- | :--- | :--- |
| **PDF Document** | Open & view document | Marks complete smoothly without time restrictions |
| **PPT Presentation** | Open & view slides | Marks complete smoothly without time restrictions |
| **Text Article** | Open & read text article | Marks complete smoothly without time restrictions |
| **SCORM Package** | Launch SCORM player | Marks complete smoothly without time restrictions |
| **Udemy Course** | Click "Launch Udemy Course" link | Marks complete smoothly without time restrictions |
| **YouTube Video** | Open video player | Marks complete smoothly without time restrictions |
| **External Link** | Click "Open Resource Link" | Marks complete smoothly without time restrictions |
| **Quiz / Assessment** | **Submit Quiz Answers** | Requires quiz submission prior to completion |
| **Assignment** | **Submit Assignment Work** | Requires uploading & submitting work prior to completion |
| **Feedback Survey** | **Submit Feedback Survey** | Requires submitting feedback survey prior to completion |

### 📂 Codebase Reference File for Learner Completion:
- **Learner Completion Validator**: [`frontend/components/courses/CoursePreviewView.tsx`](file:///d:/Harbinger%20Training/LMS/LMS/Academy/frontend/components/courses/CoursePreviewView.tsx#L359-L470)
