import api from "./auth.service";

export interface LearnerProgressData {
  enrollment: {
    id: number;
    userId: number;
    courseId: number;
    status: string;
    progress: number;
    timeSpentSeconds: number;
    enrolledAt: string;
    completedAt?: string | null;
  };
  completedLessonIds: number[];
  submissions: Array<{
    id: number;
    submissionType: string;
    status?: string;
    submissionText?: string;
    fileUrl?: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade?: string | null;
    feedback?: string | null;
    attemptNumber: number;
    submittedAt: string;
  }>;
  certificate?: {
    id: number;
    certificateCode: string;
    recipientName: string;
    courseTitle: string;
    issuedAt: string;
  } | null;
}

export interface AdminLearnerMatrixItem {
  id: number;
  userId: number;
  courseId: number;
  employeeName: string;
  employeeCode: string;
  designation: string;
  courseTitle: string;
  progress: number;
  status: string;
  timeSpentSeconds: number;
  enrolledAt: string;
  completedAt?: string | null;
  latestScore?: number | null;
  latestMaxScore?: number | null;
  latestPercentage?: number | null;
  grade?: string | null;
  feedback?: string | null;
  submissionId?: number | null;
  hasCertificate: boolean;
  certificateCode?: string | null;
}

export interface UserEnrollmentItem {
  courseId: number;
  progress: number;
  status: string;
  completedAt?: string | null;
  timeSpentSeconds: number;
}

export async function getMyEnrollments(): Promise<UserEnrollmentItem[]> {
  try {
    const res = await api.get(`/courses/my-enrollments`);
    return res.data?.data || [];
  } catch (err) {
    console.error("Failed to fetch my enrollments:", err);
    return [];
  }
}

export async function getLearnerCourseProgress(courseId: number): Promise<LearnerProgressData | null> {
  try {
    const res = await api.get(`/courses/${courseId}/my-progress`);
    return res.data?.data || null;
  } catch (err) {
    console.error("Failed to fetch learner progress:", err);
    return null;
  }
}

export async function updateLessonProgress(
  courseId: number,
  contentId: number,
  isCompleted: boolean,
  additionalSeconds: number = 0
) {
  try {
    const res = await api.post(`/courses/${courseId}/progress`, {
      contentId,
      isCompleted,
      additionalSeconds,
    });
    return res.data;
  } catch (err) {
    console.error("Failed to update lesson progress:", err);
    return null;
  }
}

export async function recordQuizSubmission(
  courseId: number,
  contentId: number | null,
  score: number,
  maxScore: number,
  answersJson?: string
) {
  const res = await api.post(`/courses/${courseId}/quiz/submit`, {
    contentId,
    score,
    maxScore,
    answersJson,
  });
  return res.data;
}

export async function getAdminLearnerProgressMatrix(): Promise<AdminLearnerMatrixItem[]> {
  try {
    const res = await api.get("/courses/admin/learner-matrix");
    return res.data?.data || [];
  } catch (err) {
    console.error("Failed to fetch admin learner matrix:", err);
    return [];
  }
}

export async function gradeAssessmentSubmission(
  submissionId: number,
  grade: string,
  score: number,
  feedback: string
) {
  const res = await api.post(`/courses/admin/grade-submission/${submissionId}`, {
    grade,
    score,
    feedback,
  });
  return res.data;
}
