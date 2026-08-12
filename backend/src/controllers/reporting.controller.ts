import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ReportingService, ReportFilterParams } from "../services/reporting.service";

export const getFilterOptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const options = await ReportingService.getFilterOptions(req.user);
    res.json({ success: true, data: options });
  } catch (error: any) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch filter options" });
  }
};

export const getEnrollmentReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getEnrollmentReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching enrollment report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch enrollment report" });
  }
};

export const getCourseCompletionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getCourseCompletionReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching course completion report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch course completion report" });
  }
};

export const getLearnerPerformanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getLearnerPerformanceReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching learner performance report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch learner performance report" });
  }
};

export const getAssessmentReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getAssessmentReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching assessment report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch assessment report" });
  }
};

export const getEngagementReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getEngagementReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching engagement report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch engagement report" });
  }
};

export const getDepartmentPerformanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "SUPER_ADMIN") {
      res.status(403).json({ success: false, message: "Forbidden: Super Admin role required" });
      return;
    }
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getDepartmentPerformanceReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching department performance report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch department performance report" });
  }
};

export const getTeacherPerformanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getTeacherPerformanceReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching teacher performance report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch teacher performance report" });
  }
};

export const getOrganizationOverviewReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "SUPER_ADMIN") {
      res.status(403).json({ success: false, message: "Forbidden: Super Admin role required" });
      return;
    }
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getOrganizationOverviewReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching organization overview report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch organization overview report" });
  }
};

export const getEmployeeDrilldown = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = await ReportingService.getEmployeeDrilldown(id, req.user);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching employee drilldown:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch employee drilldown" });
  }
};

export const exportReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const type = req.params.type as string;
    const format = (req.query.format as string) || "excel";
    const filters: ReportFilterParams = req.query as any;

    const fileContent = await ReportingService.exportReport(type, format, filters, req.user);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=LMS_${type}_report.csv`);
      res.send(fileContent);
    } else {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=LMS_${type}_report.xlsx`);
      res.send(fileContent);
    }
  } catch (error: any) {
    console.error("Error exporting report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to export report" });
  }
};

export const getLearnerProgressReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getLearnerProgressReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching learner progress report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch learner progress report" });
  }
};

export const getQuizAssessmentReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getQuizAssessmentReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching quiz assessment report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch quiz assessment report" });
  }
};

export const getAssignmentSubmissionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: ReportFilterParams = req.query as any;
    const report = await ReportingService.getAssignmentSubmissionReport(filters, req.user);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error fetching assignment submission report:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch assignment submission report" });
  }
};

export const evaluateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submissionId = req.params.id as string;
    const { score, grade, feedback } = req.body;
    const result = await ReportingService.evaluateAssignmentSubmission(
      submissionId,
      { score, grade, feedback },
      req.user,
      req.ip
    );
    res.json({ success: true, data: result, message: "Assignment submission evaluated successfully!" });
  } catch (error: any) {
    console.error("Error evaluating assignment submission:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to evaluate assignment submission" });
  }
};
