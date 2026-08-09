"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = exports.getEmployeeDrilldown = exports.getOrganizationOverviewReport = exports.getTeacherPerformanceReport = exports.getDepartmentPerformanceReport = exports.getEngagementReport = exports.getAssessmentReport = exports.getLearnerPerformanceReport = exports.getCourseCompletionReport = exports.getEnrollmentReport = exports.getFilterOptions = void 0;
const reporting_service_1 = require("../services/reporting.service");
const getFilterOptions = async (req, res) => {
    try {
        const options = await reporting_service_1.ReportingService.getFilterOptions(req.user);
        res.json({ success: true, data: options });
    }
    catch (error) {
        console.error("Error fetching filter options:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch filter options" });
    }
};
exports.getFilterOptions = getFilterOptions;
const getEnrollmentReport = async (req, res) => {
    try {
        const filters = req.query;
        const report = await reporting_service_1.ReportingService.getEnrollmentReport(filters, req.user);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Error fetching enrollment report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch enrollment report" });
    }
};
exports.getEnrollmentReport = getEnrollmentReport;
const getCourseCompletionReport = async (req, res) => {
    try {
        const filters = req.query;
        const report = await reporting_service_1.ReportingService.getCourseCompletionReport(filters, req.user);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Error fetching course completion report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch course completion report" });
    }
};
exports.getCourseCompletionReport = getCourseCompletionReport;
const getLearnerPerformanceReport = async (req, res) => {
    try {
        const filters = req.query;
        const report = await reporting_service_1.ReportingService.getLearnerPerformanceReport(filters, req.user);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Error fetching learner performance report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch learner performance report" });
    }
};
exports.getLearnerPerformanceReport = getLearnerPerformanceReport;
const getAssessmentReport = async (req, res) => {
    try {
        const filters = req.query;
        const report = await reporting_service_1.ReportingService.getAssessmentReport(filters, req.user);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Error fetching assessment report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch assessment report" });
    }
};
exports.getAssessmentReport = getAssessmentReport;
const getEngagementReport = async (req, res) => {
    try {
        const filters = req.query;
        const report = await reporting_service_1.ReportingService.getEngagementReport(filters, req.user);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Error fetching engagement report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch engagement report" });
    }
};
exports.getEngagementReport = getEngagementReport;
const getDepartmentPerformanceReport = async (req, res) => {
    try {
        if (req.user?.role !== "SUPER_ADMIN") {
            res.status(403).json({ success: false, message: "Forbidden: Super Admin role required" });
            return;
        }
        const filters = req.query;
        const report = await reporting_service_1.ReportingService.getDepartmentPerformanceReport(filters, req.user);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Error fetching department performance report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch department performance report" });
    }
};
exports.getDepartmentPerformanceReport = getDepartmentPerformanceReport;
const getTeacherPerformanceReport = async (req, res) => {
    try {
        const filters = req.query;
        const report = await reporting_service_1.ReportingService.getTeacherPerformanceReport(filters, req.user);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Error fetching teacher performance report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch teacher performance report" });
    }
};
exports.getTeacherPerformanceReport = getTeacherPerformanceReport;
const getOrganizationOverviewReport = async (req, res) => {
    try {
        if (req.user?.role !== "SUPER_ADMIN") {
            res.status(403).json({ success: false, message: "Forbidden: Super Admin role required" });
            return;
        }
        const filters = req.query;
        const report = await reporting_service_1.ReportingService.getOrganizationOverviewReport(filters, req.user);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Error fetching organization overview report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch organization overview report" });
    }
};
exports.getOrganizationOverviewReport = getOrganizationOverviewReport;
const getEmployeeDrilldown = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await reporting_service_1.ReportingService.getEmployeeDrilldown(id, req.user);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error("Error fetching employee drilldown:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch employee drilldown" });
    }
};
exports.getEmployeeDrilldown = getEmployeeDrilldown;
const exportReport = async (req, res) => {
    try {
        const type = req.params.type;
        const format = req.query.format || "excel";
        const filters = req.query;
        const fileContent = await reporting_service_1.ReportingService.exportReport(type, format, filters, req.user);
        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=LMS_${type}_report.csv`);
            res.send(fileContent);
        }
        else {
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename=LMS_${type}_report.xlsx`);
            res.send(fileContent);
        }
    }
    catch (error) {
        console.error("Error exporting report:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to export report" });
    }
};
exports.exportReport = exportReport;
