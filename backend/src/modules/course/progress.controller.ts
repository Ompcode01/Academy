import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import progressService from "./progress.service";

export const getLearnerProgress = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === "GUEST") {
      return res.json({
        success: true,
        data: {
          progressPercent: 0,
          completedLessonIds: [],
          isEnrolled: false,
          isGuest: true,
          sessionsCount: 0,
          timeSpentSeconds: 0,
        },
      });
    }
    const courseId = BigInt(String(req.params.id));
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);

    const data = await progressService.getLearnerCourseProgress(userId, courseId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === "GUEST") {
      return res.json({ success: true, data: [] });
    }
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
    const data = await progressService.getMyEnrollments(userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordHeartbeat = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === "GUEST") {
      return res.status(403).json({ success: false, message: "Guest accounts cannot track lesson completion or progress." });
    }
    const courseId = BigInt(String(req.params.id));
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
    const { contentId, deltaActiveSeconds, deltaWatchedSeconds, lastPosition, isPlaying, isTabActive } = req.body;

    if (!contentId) {
      return res.status(400).json({ success: false, message: "contentId is required" });
    }

    const data = await progressService.recordHeartbeat(
      userId,
      courseId,
      BigInt(contentId),
      Number(deltaActiveSeconds) || 0,
      Number(deltaWatchedSeconds) || 0,
      Number(lastPosition) || 0,
      isPlaying !== undefined ? Boolean(isPlaying) : true,
      isTabActive !== undefined ? Boolean(isTabActive) : true
    );

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markSectionComplete = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === "GUEST") {
      return res.status(403).json({ success: false, message: "Guest accounts cannot track lesson completion or progress." });
    }
    const courseId = BigInt(String(req.params.id));
    const sectionId = BigInt(String(req.params.sectionId));
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);

    const data = await progressService.markSectionComplete(userId, courseId, sectionId);

    res.json({ success: true, message: "Section marked as completed successfully", data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLessonProgress = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === "GUEST") {
      return res.status(403).json({ success: false, message: "Guest accounts cannot track lesson completion or progress." });
    }
    const courseId = BigInt(String(req.params.id));
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
    const { contentId, isCompleted, additionalSeconds } = req.body;

    if (!contentId) {
      return res.status(400).json({ success: false, message: "contentId is required" });
    }

    const data = await progressService.updateLessonProgress(
      userId,
      courseId,
      BigInt(contentId),
      Boolean(isCompleted),
      Number(additionalSeconds) || 0
    );

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordQuizSubmission = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === "GUEST") {
      return res.status(403).json({ success: false, message: "Guest accounts cannot attempt quizzes." });
    }
    const courseId = BigInt(String(req.params.id));
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
    const { contentId, score, maxScore, answersJson } = req.body;

    const data = await progressService.recordQuizSubmission(
      userId,
      courseId,
      contentId ? BigInt(contentId) : null,
      Number(score) || 0,
      Number(maxScore) || 100,
      answersJson
    );

    res.json({ success: true, message: "Quiz submitted successfully", data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminLearnerProgressMatrix = async (req: AuthRequest, res: Response) => {
  try {
    const matrix = await progressService.getAdminLearnerProgressMatrix(req.user);
    res.json({ success: true, data: matrix });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordAssignmentSubmission = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === "GUEST") {
      return res.status(403).json({ success: false, message: "Guest accounts cannot submit assignments." });
    }
    const courseId = BigInt(String(req.params.id));
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
    const { contentId, submissionText, fileUrl } = req.body;

    const data = await progressService.recordAssignmentSubmission(
      userId,
      courseId,
      contentId ? BigInt(contentId) : null,
      submissionText || "",
      fileUrl || ""
    );

    res.json({ success: true, message: "Assignment submitted successfully and queued for grading", data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.employeeId ? BigInt(req.user.employeeId) : undefined;
    const data = await progressService.getTeacherSubmissions(teacherId, req.user?.role);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const gradeAssessmentSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const submissionId = BigInt(String(req.params.submissionId));
    const { grade, score, feedback, status } = req.body;

    const graderName = req.user ? `${req.user.username}` : "Instructor Admin";

    const data = await progressService.gradeAssessmentSubmission(
      submissionId,
      grade || "Passed",
      Number(score) || 0,
      feedback || "",
      graderName,
      status || "GRADED",
      req.user?.role
    );

    res.json({ success: true, message: `Assessment ${status === 'NEEDS_REVISION' ? 'marked for revision' : 'graded'} successfully`, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
