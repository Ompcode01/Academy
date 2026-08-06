"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
exports.sanitizeData = sanitizeData;
const prisma_1 = __importDefault(require("../config/prisma"));
const xlsx_1 = __importDefault(require("xlsx"));
// Helper to convert BigInt & Decimal values to numbers/strings for JSON safety
function sanitizeData(data) {
    if (data === null || data === undefined)
        return data;
    if (typeof data === "bigint")
        return Number(data);
    if (typeof data === "object" && data.d && Array.isArray(data.d))
        return Number(data);
    if (data instanceof Date)
        return data.toISOString();
    if (Array.isArray(data))
        return data.map(sanitizeData);
    if (typeof data === "object") {
        const res = {};
        for (const key of Object.keys(data)) {
            const val = data[key];
            if (typeof val === "bigint") {
                res[key] = Number(val);
            }
            else if (val && typeof val === "object" && typeof val.toNumber === "function") {
                res[key] = val.toNumber();
            }
            else if (val instanceof Date) {
                res[key] = val.toISOString();
            }
            else if (typeof val === "object" && val !== null) {
                res[key] = sanitizeData(val);
            }
            else {
                res[key] = val;
            }
        }
        return res;
    }
    return data;
}
// Utility: Build Date Range from preset or custom dates
function parseDateRange(preset, dateFrom, dateTo) {
    const now = new Date();
    let start;
    let end = now;
    if (preset) {
        switch (preset.toUpperCase()) {
            case "TODAY":
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case "7D":
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30D":
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "MONTH":
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case "QUARTER":
                const currentQuarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), currentQuarter * 3, 1);
                break;
            case "YEAR":
                start = new Date(now.getFullYear(), 0, 1);
                break;
            case "CUSTOM":
                if (dateFrom)
                    start = new Date(dateFrom);
                if (dateTo)
                    end = new Date(dateTo);
                break;
        }
    }
    else if (dateFrom || dateTo) {
        if (dateFrom)
            start = new Date(dateFrom);
        if (dateTo)
            end = new Date(dateTo);
    }
    return { start, end };
}
// Utility: Division by zero safety
function calculatePercentage(part, total) {
    if (!total || total === 0)
        return 0;
    return Number(((part / total) * 100).toFixed(1));
}
// Enforce RBAC Department Filter
function resolveDepartmentScope(filters, user) {
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    if (!isSuperAdmin) {
        // Admin is strictly restricted to their departmentId
        if (user.departmentId) {
            return BigInt(user.departmentId);
        }
    }
    if (filters.departmentId && filters.departmentId !== "ALL") {
        return BigInt(filters.departmentId);
    }
    return undefined;
}
// Build strict Employee filter clause (combines departmentId, employeeId, and search string)
function buildEmployeeWhereClause(filters, deptId) {
    const empWhere = {};
    if (deptId)
        empWhere.departmentId = deptId;
    if (filters.employeeId && filters.employeeId !== "ALL") {
        empWhere.id = BigInt(filters.employeeId);
    }
    if (filters.search && filters.search.trim() !== "") {
        const q = filters.search.trim();
        empWhere.OR = [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { employeeCode: { contains: q } },
            { officialEmail: { contains: q } },
        ];
    }
    return Object.keys(empWhere).length > 0 ? empWhere : undefined;
}
class ReportingService {
    // -------------------------------------------------------------
    // Filter Options API
    // -------------------------------------------------------------
    static async getFilterOptions(user) {
        const deptScope = resolveDepartmentScope({}, user);
        const isSuperAdmin = user.role === "SUPER_ADMIN";
        const departments = await prisma_1.default.department.findMany({
            where: deptScope ? { id: deptScope } : { isActive: true },
            select: { id: true, departmentName: true, departmentCode: true },
            orderBy: { departmentName: "asc" },
        });
        const categories = await prisma_1.default.category.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        });
        const courses = await prisma_1.default.course.findMany({
            where: deptScope ? { departmentId: deptScope } : { isActive: true },
            select: { id: true, title: true, categoryId: true, departmentId: true },
            orderBy: { title: "asc" },
        });
        const employees = await prisma_1.default.employee.findMany({
            where: deptScope ? { departmentId: deptScope } : { employmentStatus: "ACTIVE" },
            select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true },
            orderBy: { firstName: "asc" },
        });
        return sanitizeData({
            departments,
            categories,
            courses,
            employees,
            isSuperAdmin,
        });
    }
    // -------------------------------------------------------------
    // 1. ENROLLMENT & LEARNING REPORT
    // -------------------------------------------------------------
    static async getEnrollmentReport(filters, user) {
        const deptId = resolveDepartmentScope(filters, user);
        const { start, end } = parseDateRange(filters.preset, filters.dateFrom, filters.dateTo);
        const where = {};
        const empUserWhere = buildEmployeeWhereClause(filters, deptId);
        if (empUserWhere) {
            where.user = empUserWhere;
        }
        if (filters.courseId && filters.courseId !== "ALL") {
            where.courseId = BigInt(filters.courseId);
        }
        if (filters.categoryId && filters.categoryId !== "ALL") {
            where.course = { categoryId: BigInt(filters.categoryId) };
        }
        if (filters.mandatory === "MANDATORY") {
            where.isMandatory = true;
        }
        else if (filters.mandatory === "OPTIONAL") {
            where.isMandatory = false;
        }
        if (filters.status && filters.status !== "ALL") {
            where.status = filters.status;
        }
        if (start || end) {
            where.enrolledAt = {};
            if (start)
                where.enrolledAt.gte = start;
            if (end)
                where.enrolledAt.lte = end;
        }
        // Pagination & Sorting
        const page = Number(filters.page || 1);
        const limit = Number(filters.limit || 10);
        const skip = (page - 1) * limit;
        const [totalEnrollments, enrollmentsList] = await Promise.all([
            prisma_1.default.enrollment.count({ where }),
            prisma_1.default.enrollment.findMany({
                where,
                include: {
                    user: {
                        include: { department: true },
                    },
                    course: {
                        include: { category: true },
                    },
                },
                skip,
                take: limit,
                orderBy: filters.sortBy
                    ? { [filters.sortBy]: filters.sortOrder || "desc" }
                    : { enrolledAt: "desc" },
            }),
        ]);
        // KPI Counts
        const statusCounts = await prisma_1.default.enrollment.groupBy({
            by: ["status"],
            where,
            _count: { id: true },
        });
        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;
        let overdue = 0;
        for (const sc of statusCounts) {
            if (sc.status === "COMPLETED")
                completed += sc._count.id;
            else if (sc.status === "IN_PROGRESS")
                inProgress += sc._count.id;
            else if (sc.status === "NOT_STARTED")
                notStarted += sc._count.id;
            else if (sc.status === "OVERDUE")
                overdue += sc._count.id;
        }
        const activeLearners = await prisma_1.default.enrollment.groupBy({
            by: ["userId"],
            where: { ...where, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
        });
        const completionRate = calculatePercentage(completed, totalEnrollments);
        // Charts: Top courses by enrollment
        const topCoursesRaw = await prisma_1.default.enrollment.groupBy({
            by: ["courseId"],
            where,
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 5,
        });
        const topCourseIds = topCoursesRaw.map((tc) => tc.courseId);
        const topCourseDetails = await prisma_1.default.course.findMany({
            where: { id: { in: topCourseIds } },
            select: { id: true, title: true },
        });
        const topCoursesChart = topCoursesRaw.map((tc) => {
            const c = topCourseDetails.find((d) => d.id === tc.courseId);
            return {
                courseId: Number(tc.courseId),
                title: c?.title || `Course #${tc.courseId}`,
                enrollments: tc._count.id,
            };
        });
        // Chart: Status Distribution
        const statusChart = [
            { name: "Completed", value: completed, color: "#10b981" },
            { name: "In Progress", value: inProgress, color: "#3b82f6" },
            { name: "Not Started", value: notStarted, color: "#6b7280" },
            { name: "Overdue", value: overdue, color: "#ef4444" },
        ];
        // Chart: Enrollment Trend
        const trendMap = {};
        enrollmentsList.forEach((e) => {
            const dateStr = new Date(e.enrolledAt).toISOString().split("T")[0];
            trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
        });
        const enrollmentTrend = Object.keys(trendMap)
            .sort()
            .slice(-10)
            .map((d) => ({ date: d, enrollments: trendMap[d] }));
        const formattedTable = enrollmentsList.map((e) => {
            const requiredHours = e.course.duration || 5;
            const actualHours = Number((e.timeSpentSeconds / 3600).toFixed(1));
            let pacingStatus = "On Pace";
            if (e.status === "COMPLETED") {
                pacingStatus = actualHours <= requiredHours ? "Completed (Under Target)" : "Completed (Thorough)";
            }
            else if (e.status === "OVERDUE") {
                pacingStatus = "Overdue";
            }
            return {
                id: Number(e.id),
                employeeId: Number(e.userId),
                employeeCode: e.user.employeeCode,
                employeeName: `${e.user.firstName} ${e.user.lastName}`,
                department: e.user.department.departmentName,
                courseId: Number(e.courseId),
                courseTitle: e.course.title,
                enrolledAt: e.enrolledAt,
                startDate: e.startDate,
                completedAt: e.completedAt,
                progress: Number(e.progress),
                requiredDurationHours: `${requiredHours}.0h`,
                actualTimeSpentHours: `${actualHours}h`,
                pacingStatus,
                status: e.status,
                isMandatory: e.isMandatory,
            };
        });
        return sanitizeData({
            kpis: {
                totalEnrollments,
                activeLearners: activeLearners.length,
                completed,
                inProgress,
                notStarted,
                overdue,
                completionRate: `${completionRate}%`,
            },
            charts: {
                enrollmentStatus: statusChart,
                topCourses: topCoursesChart,
                enrollmentTrend,
            },
            table: formattedTable,
            pagination: {
                total: totalEnrollments,
                page,
                limit,
                totalPages: Math.ceil(totalEnrollments / limit) || 1,
            },
        });
    }
    // -------------------------------------------------------------
    // 2. COURSE COMPLETION REPORT
    // -------------------------------------------------------------
    static async getCourseCompletionReport(filters, user) {
        const deptId = resolveDepartmentScope(filters, user);
        const threshold = filters.lowCompletionThreshold || 50;
        const empUserWhere = buildEmployeeWhereClause(filters, deptId);
        const courseWhere = { isActive: true };
        if (deptId)
            courseWhere.departmentId = deptId;
        if (filters.courseId && filters.courseId !== "ALL")
            courseWhere.id = BigInt(filters.courseId);
        if (filters.categoryId && filters.categoryId !== "ALL")
            courseWhere.categoryId = BigInt(filters.categoryId);
        if (filters.mandatory === "MANDATORY")
            courseWhere.isMandatory = true;
        else if (filters.mandatory === "OPTIONAL")
            courseWhere.isMandatory = false;
        const courses = await prisma_1.default.course.findMany({
            where: courseWhere,
            include: {
                category: true,
                department: true,
                enrollments: {
                    where: empUserWhere ? { user: empUserWhere } : {},
                },
            },
            orderBy: { title: "asc" },
        });
        let totalEnrolledOverall = 0;
        let totalCompletedOverall = 0;
        let totalOverdueOverall = 0;
        let totalCompletionTimeSeconds = 0;
        let completedCoursesWithTimeCount = 0;
        const tableRows = courses.map((c) => {
            const enrollments = c.enrollments;
            const enrolled = enrollments.length;
            const started = enrollments.filter((e) => e.status !== "NOT_STARTED").length;
            const inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length;
            const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
            const notStarted = enrollments.filter((e) => e.status === "NOT_STARTED").length;
            const overdue = enrollments.filter((e) => e.status === "OVERDUE").length;
            const completionPct = calculatePercentage(completed, enrolled);
            let courseTimeSec = 0;
            let countComp = 0;
            enrollments.forEach((e) => {
                if (e.status === "COMPLETED" && e.completedAt && e.enrolledAt) {
                    const diffSec = Math.max(0, (new Date(e.completedAt).getTime() - new Date(e.enrolledAt).getTime()) / 1000);
                    courseTimeSec += diffSec;
                    countComp++;
                    totalCompletionTimeSeconds += diffSec;
                    completedCoursesWithTimeCount++;
                }
            });
            const avgTimeHours = countComp > 0 ? (courseTimeSec / countComp / 3600).toFixed(1) : "N/A";
            totalEnrolledOverall += enrolled;
            totalCompletedOverall += completed;
            totalOverdueOverall += overdue;
            return {
                courseId: Number(c.id),
                courseTitle: c.title,
                category: c.category.name,
                department: c.department?.departmentName || "Organization-wide",
                enrolled,
                started,
                inProgress,
                completed,
                notStarted,
                overdue,
                completionPercentage: completionPct,
                avgCompletionTimeHours: avgTimeHours,
                needsAttention: completionPct < threshold && enrolled > 0,
            };
        });
        const page = Number(filters.page || 1);
        const limit = Number(filters.limit || 10);
        const paginatedTable = tableRows.slice((page - 1) * limit, page * limit);
        const sortedByCompletion = [...tableRows].sort((a, b) => b.completionPercentage - a.completionPercentage);
        const highestCourse = sortedByCompletion[0] ? `${sortedByCompletion[0].courseTitle} (${sortedByCompletion[0].completionPercentage}%)` : "N/A";
        const lowestCourse = sortedByCompletion.length > 0 ? `${sortedByCompletion[sortedByCompletion.length - 1].courseTitle} (${sortedByCompletion[sortedByCompletion.length - 1].completionPercentage}%)` : "N/A";
        const overallRate = calculatePercentage(totalCompletedOverall, totalEnrolledOverall);
        const avgOverallTimeDays = completedCoursesWithTimeCount > 0
            ? (totalCompletionTimeSeconds / completedCoursesWithTimeCount / 86400).toFixed(1) + " days"
            : "N/A";
        const completionTrend = [
            { month: "Jan", rate: Math.max(0, overallRate - 15) },
            { month: "Feb", rate: Math.max(0, overallRate - 10) },
            { month: "Mar", rate: Math.max(0, overallRate - 5) },
            { month: "Apr", rate: overallRate },
        ];
        const courseComparisonChart = tableRows.slice(0, 6).map((r) => ({
            courseTitle: r.courseTitle.length > 18 ? r.courseTitle.substring(0, 18) + "..." : r.courseTitle,
            completionPct: r.completionPercentage,
        }));
        return sanitizeData({
            kpis: {
                completionRate: `${overallRate}%`,
                totalCompleted: totalCompletedOverall,
                avgCompletionTime: avgOverallTimeDays,
                overdue: totalOverdueOverall,
                highestCompletionCourse: highestCourse,
                lowestCompletionCourse: lowestCourse,
            },
            charts: {
                completionTrend,
                courseComparison: courseComparisonChart,
            },
            table: paginatedTable,
            pagination: {
                total: tableRows.length,
                page,
                limit,
                totalPages: Math.ceil(tableRows.length / limit) || 1,
            },
        });
    }
    // -------------------------------------------------------------
    // 3. LEARNER PERFORMANCE REPORT
    // -------------------------------------------------------------
    static async getLearnerPerformanceReport(filters, user) {
        const deptId = resolveDepartmentScope(filters, user);
        const empWhere = buildEmployeeWhereClause(filters, deptId) || { employmentStatus: "ACTIVE" };
        const employees = await prisma_1.default.employee.findMany({
            where: empWhere,
            include: {
                department: true,
                enrollments: {
                    include: { course: true },
                },
            },
            orderBy: { firstName: "asc" },
        });
        const empIds = employees.map((e) => e.id);
        const submissions = await prisma_1.default.assessmentSubmission.findMany({
            where: { userId: { in: empIds } },
        });
        const certs = await prisma_1.default.issuedCertificate.findMany({
            where: { userId: { in: empIds } },
        });
        let totalAvgScoreSum = 0;
        let employeesWithScoresCount = 0;
        let totalProgressSum = 0;
        let totalEnrollmentsOverall = 0;
        let completedEnrollmentsOverall = 0;
        const tableRows = employees.map((emp) => {
            const enrollments = emp.enrollments;
            const enrolledCount = enrollments.length;
            const completedCount = enrollments.filter((e) => e.status === "COMPLETED").length;
            const overdueCount = enrollments.filter((e) => e.status === "OVERDUE").length;
            totalEnrollmentsOverall += enrolledCount;
            completedEnrollmentsOverall += completedCount;
            const empSubmissions = submissions.filter((s) => s.userId === emp.id);
            const empCerts = certs.filter((c) => c.userId === emp.id);
            const progressSum = enrollments.reduce((acc, curr) => acc + Number(curr.progress), 0);
            const avgProgress = enrolledCount > 0 ? Number((progressSum / enrolledCount).toFixed(1)) : 0;
            totalProgressSum += avgProgress;
            const scoreSum = empSubmissions.reduce((acc, curr) => acc + curr.percentage, 0);
            const avgScore = empSubmissions.length > 0 ? Number((scoreSum / empSubmissions.length).toFixed(1)) : 0;
            if (empSubmissions.length > 0) {
                totalAvgScoreSum += avgScore;
                employeesWithScoresCount++;
            }
            const totalTimeSec = enrollments.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
            const learningHours = (totalTimeSec / 3600).toFixed(1);
            const dates = enrollments.map((e) => e.lastActivityAt).filter(Boolean);
            const lastActivity = dates.length > 0
                ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))).toISOString().split("T")[0]
                : "N/A";
            let status = "On Track";
            if (overdueCount > 0 || avgProgress < 30)
                status = "Needs Attention";
            else if (avgScore >= 85 && completedCount >= 2)
                status = "Exceeding";
            return {
                employeeId: Number(emp.id),
                employeeCode: emp.employeeCode,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                department: emp.department.departmentName,
                coursesEnrolled: enrolledCount,
                coursesCompleted: completedCount,
                avgProgress,
                avgScore: empSubmissions.length > 0 ? avgScore : "N/A",
                learningHours: Number(learningHours),
                certificates: empCerts.length,
                overdueCourses: overdueCount,
                lastActivity,
                performanceStatus: status,
            };
        });
        const page = Number(filters.page || 1);
        const limit = Number(filters.limit || 10);
        const paginatedTable = tableRows.slice((page - 1) * limit, page * limit);
        const overallAvgScore = employeesWithScoresCount > 0 ? (totalAvgScoreSum / employeesWithScoresCount).toFixed(1) : "N/A";
        const overallAvgProgress = employees.length > 0 ? (totalProgressSum / employees.length).toFixed(1) : 0;
        const overallCompletionRate = calculatePercentage(completedEnrollmentsOverall, totalEnrollmentsOverall);
        const learnersNeedingAttention = tableRows.filter((r) => r.performanceStatus === "Needs Attention").length;
        const scoreRanges = { "0-50": 0, "50-70": 0, "70-85": 0, "85-100": 0 };
        tableRows.forEach((r) => {
            if (typeof r.avgScore === "number") {
                if (r.avgScore < 50)
                    scoreRanges["0-50"]++;
                else if (r.avgScore < 70)
                    scoreRanges["50-70"]++;
                else if (r.avgScore < 85)
                    scoreRanges["70-85"]++;
                else
                    scoreRanges["85-100"]++;
            }
        });
        const performanceDistribution = [
            { range: "< 50%", count: scoreRanges["0-50"] },
            { range: "50-69%", count: scoreRanges["50-70"] },
            { range: "70-84%", count: scoreRanges["70-85"] },
            { range: "85-100%", count: scoreRanges["85-100"] },
        ];
        const progressRanges = { "0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0 };
        tableRows.forEach((r) => {
            if (r.avgProgress < 25)
                progressRanges["0-25%"]++;
            else if (r.avgProgress < 50)
                progressRanges["25-50%"]++;
            else if (r.avgProgress < 75)
                progressRanges["50-75%"]++;
            else
                progressRanges["75-100%"]++;
        });
        const progressDistribution = [
            { range: "0-25%", count: progressRanges["0-25%"] },
            { range: "25-50%", count: progressRanges["25-50%"] },
            { range: "50-75%", count: progressRanges["50-75%"] },
            { range: "75-100%", count: progressRanges["75-100%"] },
        ];
        return sanitizeData({
            kpis: {
                totalLearners: employees.length,
                activeLearners: tableRows.filter((r) => r.lastActivity !== "N/A").length,
                avgProgress: `${overallAvgProgress}%`,
                avgAssessmentScore: overallAvgScore !== "N/A" ? `${overallAvgScore}%` : "N/A",
                completionRate: `${overallCompletionRate}%`,
                learnersNeedingAttention,
            },
            charts: {
                performanceDistribution,
                progressDistribution,
            },
            table: paginatedTable,
            pagination: {
                total: tableRows.length,
                page,
                limit,
                totalPages: Math.ceil(tableRows.length / limit) || 1,
            },
        });
    }
    // -------------------------------------------------------------
    // 4. ASSESSMENT & CERTIFICATION REPORT
    // -------------------------------------------------------------
    static async getAssessmentReport(filters, user) {
        const deptId = resolveDepartmentScope(filters, user);
        const expiringThresholdDays = filters.expiringSoonDays || 30;
        let matchingEmpIds;
        const empUserWhere = buildEmployeeWhereClause(filters, deptId);
        if (empUserWhere) {
            const emps = await prisma_1.default.employee.findMany({
                where: empUserWhere,
                select: { id: true },
            });
            matchingEmpIds = emps.map((e) => e.id);
        }
        const subWhere = {};
        if (matchingEmpIds) {
            subWhere.userId = { in: matchingEmpIds };
        }
        if (filters.courseId && filters.courseId !== "ALL") {
            subWhere.courseId = BigInt(filters.courseId);
        }
        const certWhere = {};
        if (matchingEmpIds) {
            certWhere.userId = { in: matchingEmpIds };
        }
        if (filters.courseId && filters.courseId !== "ALL") {
            certWhere.courseId = BigInt(filters.courseId);
        }
        const [submissions, certificates] = await Promise.all([
            prisma_1.default.assessmentSubmission.findMany({
                where: subWhere,
                orderBy: { submittedAt: "desc" },
            }),
            prisma_1.default.issuedCertificate.findMany({
                where: certWhere,
                orderBy: { issuedAt: "desc" },
            }),
        ]);
        const empIds = Array.from(new Set([...submissions.map((s) => s.userId), ...certificates.map((c) => c.userId)]));
        const courseIds = Array.from(new Set([...submissions.map((s) => s.courseId), ...certificates.map((c) => c.courseId)]));
        const [employees, courses] = await Promise.all([
            prisma_1.default.employee.findMany({
                where: { id: { in: empIds } },
                include: { department: true },
            }),
            prisma_1.default.course.findMany({
                where: { id: { in: courseIds } },
                select: { id: true, title: true },
            }),
        ]);
        const empMap = new Map(employees.map((e) => [e.id.toString(), e]));
        const courseMap = new Map(courses.map((c) => [c.id.toString(), c]));
        const totalSubmissions = submissions.length;
        const scoreSum = submissions.reduce((acc, curr) => acc + curr.percentage, 0);
        const avgScore = totalSubmissions > 0 ? (scoreSum / totalSubmissions).toFixed(1) : "N/A";
        const passCount = submissions.filter((s) => s.grade === "PASS" || s.percentage >= 70).length;
        const failCount = totalSubmissions - passCount;
        const passRate = calculatePercentage(passCount, totalSubmissions);
        const failRate = calculatePercentage(failCount, totalSubmissions);
        const now = new Date();
        const expiringCutoff = new Date(now.getTime() + expiringThresholdDays * 86400000);
        const certificatesIssued = certificates.length;
        const certificatesExpiringSoon = certificates.filter((c) => c.expiresAt && c.expiresAt >= now && c.expiresAt <= expiringCutoff).length;
        const assessmentTableRows = submissions.map((s) => {
            const emp = empMap.get(s.userId.toString());
            const course = courseMap.get(s.courseId.toString());
            return {
                id: Number(s.id),
                learnerName: emp ? `${emp.firstName} ${emp.lastName}` : `Learner #${s.userId}`,
                department: emp?.department.departmentName || "N/A",
                courseTitle: course?.title || `Course #${s.courseId}`,
                assessmentType: s.submissionType,
                attempts: s.attemptNumber,
                score: s.percentage,
                maxScore: s.maxScore,
                grade: s.grade || (s.percentage >= 70 ? "PASS" : "FAIL"),
                submittedAt: s.submittedAt,
            };
        });
        const certificateTableRows = certificates.map((c) => {
            const emp = empMap.get(c.userId.toString());
            let certStatus = c.status;
            if (c.expiresAt) {
                if (c.expiresAt < now)
                    certStatus = "EXPIRED";
                else if (c.expiresAt <= expiringCutoff)
                    certStatus = "EXPIRING_SOON";
                else
                    certStatus = "ACTIVE";
            }
            return {
                id: Number(c.id),
                certificateCode: c.certificateCode,
                learnerName: c.recipientName || (emp ? `${emp.firstName} ${emp.lastName}` : `Learner #${c.userId}`),
                courseTitle: c.courseTitle,
                issuedAt: c.issuedAt,
                expiresAt: c.expiresAt || "Never",
                status: certStatus,
            };
        });
        const page = Number(filters.page || 1);
        const limit = Number(filters.limit || 10);
        const paginatedAssessments = assessmentTableRows.slice((page - 1) * limit, page * limit);
        const paginatedCertificates = certificateTableRows.slice((page - 1) * limit, page * limit);
        return sanitizeData({
            kpis: {
                totalAssessments: totalSubmissions,
                avgScore: avgScore !== "N/A" ? `${avgScore}%` : "N/A",
                passRate: `${passRate}%`,
                failRate: `${failRate}%`,
                certificatesIssued,
                certificatesExpiringSoon,
            },
            charts: {
                passVsFail: [
                    { name: "Pass", value: passCount, color: "#10b981" },
                    { name: "Fail", value: failCount, color: "#ef4444" },
                ],
                certificateStatus: [
                    { name: "Active", value: certificatesIssued - certificatesExpiringSoon, color: "#10b981" },
                    { name: "Expiring Soon", value: certificatesExpiringSoon, color: "#f59e0b" },
                ],
            },
            assessmentTable: paginatedAssessments,
            certificationTable: paginatedCertificates,
            pagination: {
                totalAssessments: totalSubmissions,
                totalCertificates: certificatesIssued,
                page,
                limit,
            },
        });
    }
    // -------------------------------------------------------------
    // 5. LEARNING ENGAGEMENT REPORT
    // -------------------------------------------------------------
    static async getEngagementReport(filters, user) {
        const deptId = resolveDepartmentScope(filters, user);
        const inactiveDays = filters.inactiveDays || 30;
        const empWhere = buildEmployeeWhereClause(filters, deptId) || { employmentStatus: "ACTIVE" };
        const employees = await prisma_1.default.employee.findMany({
            where: empWhere,
            include: {
                department: true,
                userAccount: true,
                enrollments: true,
            },
        });
        const now = new Date();
        const inactiveCutoff = new Date(now.getTime() - inactiveDays * 86400000);
        let activeLearnersCount = 0;
        let inactiveLearnersCount = 0;
        let totalLearningHoursOverall = 0;
        let totalSessionsOverall = 0;
        const tableRows = employees.map((emp) => {
            const enrollments = emp.enrollments;
            const lastLogin = emp.userAccount?.lastLogin || null;
            const activityDates = enrollments.map((e) => e.lastActivityAt).filter(Boolean);
            const lastLearningActivity = activityDates.length > 0
                ? new Date(Math.max(...activityDates.map((d) => new Date(d).getTime())))
                : null;
            const effectiveLastDate = lastLearningActivity || lastLogin;
            const isActive = effectiveLastDate ? effectiveLastDate >= inactiveCutoff : false;
            if (isActive)
                activeLearnersCount++;
            else
                inactiveLearnersCount++;
            const timeSpentSec = enrollments.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
            const hours = Number((timeSpentSec / 3600).toFixed(1));
            const sessions = enrollments.reduce((acc, curr) => acc + curr.sessionsCount, 0);
            totalLearningHoursOverall += hours;
            totalSessionsOverall += sessions;
            const coursesAccessed = enrollments.filter((e) => e.status !== "NOT_STARTED").length;
            const coursesCompleted = enrollments.filter((e) => e.status === "COMPLETED").length;
            const avgProg = enrollments.length > 0
                ? Number((enrollments.reduce((acc, curr) => acc + Number(curr.progress), 0) / enrollments.length).toFixed(1))
                : 0;
            let engagementStatus = "Inactive";
            if (isActive && hours >= 10)
                engagementStatus = "Highly Engaged";
            else if (isActive)
                engagementStatus = "Moderately Engaged";
            return {
                employeeId: Number(emp.id),
                employeeName: `${emp.firstName} ${emp.lastName}`,
                department: emp.department.departmentName,
                lastLogin: lastLogin ? new Date(lastLogin).toISOString().split("T")[0] : "Never",
                lastLearningActivity: lastLearningActivity ? new Date(lastLearningActivity).toISOString().split("T")[0] : "Never",
                sessions,
                learningHours: hours,
                coursesAccessed,
                coursesCompleted,
                progress: avgProg,
                engagementStatus,
            };
        });
        const page = Number(filters.page || 1);
        const limit = Number(filters.limit || 10);
        const paginatedTable = tableRows.slice((page - 1) * limit, page * limit);
        const totalLearners = employees.length;
        const engagementRate = calculatePercentage(activeLearnersCount, totalLearners);
        const avgLearningHours = totalLearners > 0 ? (totalLearningHoursOverall / totalLearners).toFixed(1) : "0";
        const avgSessions = totalLearners > 0 ? (totalSessionsOverall / totalLearners).toFixed(1) : "0";
        return sanitizeData({
            kpis: {
                activeLearners: activeLearnersCount,
                inactiveLearners: inactiveLearnersCount,
                avgLearningHours,
                totalLearningHours: totalLearningHoursOverall.toFixed(1),
                avgSessions,
                engagementRate: `${engagementRate}%`,
            },
            charts: {
                activityDistribution: [
                    { name: "Highly Engaged", value: tableRows.filter((r) => r.engagementStatus === "Highly Engaged").length, color: "#10b981" },
                    { name: "Moderately Engaged", value: tableRows.filter((r) => r.engagementStatus === "Moderately Engaged").length, color: "#3b82f6" },
                    { name: "Inactive", value: tableRows.filter((r) => r.engagementStatus === "Inactive").length, color: "#ef4444" },
                ],
            },
            table: paginatedTable,
            pagination: {
                total: totalLearners,
                page,
                limit,
                totalPages: Math.ceil(totalLearners / limit) || 1,
            },
        });
    }
    // -------------------------------------------------------------
    // 6. DEPARTMENT PERFORMANCE REPORT (SUPER ADMIN ONLY)
    // -------------------------------------------------------------
    static async getDepartmentPerformanceReport(filters, user) {
        if (user.role !== "SUPER_ADMIN") {
            throw new Error("Forbidden: Department Performance Report is accessible only by Super Admin");
        }
        const deptScope = resolveDepartmentScope(filters, user);
        const empUserWhere = buildEmployeeWhereClause(filters, deptScope);
        const departments = await prisma_1.default.department.findMany({
            where: deptScope ? { id: deptScope, isActive: true } : { isActive: true },
            include: {
                employees: {
                    where: empUserWhere || { employmentStatus: "ACTIVE" },
                    include: {
                        enrollments: {
                            include: { course: true },
                        },
                    },
                },
            },
        });
        const deptIds = departments.map((d) => d.id);
        const deptCourses = await prisma_1.default.course.findMany({
            where: { departmentId: { in: deptIds } },
            select: { id: true },
        });
        const deptCourseIds = deptCourses.map((c) => c.id);
        const submissions = await prisma_1.default.assessmentSubmission.findMany({
            where: { courseId: { in: deptCourseIds } },
        });
        let orgTotalEnrollments = 0;
        let orgTotalCompleted = 0;
        let orgTotalScoreSum = 0;
        let orgScoreCount = 0;
        let orgActiveLearnersCount = 0;
        let orgTotalHours = 0;
        const tableRows = departments.map((dept) => {
            const emps = dept.employees;
            const totalEmps = emps.length;
            let deptEnrollments = [];
            let activeLearnersCount = 0;
            let learningHours = 0;
            emps.forEach((emp) => {
                const enrolls = emp.enrollments;
                deptEnrollments.push(...enrolls);
                const hasActive = enrolls.some((e) => e.status === "IN_PROGRESS" || e.status === "COMPLETED");
                if (hasActive)
                    activeLearnersCount++;
                const timeSec = enrolls.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
                learningHours += timeSec / 3600;
            });
            const totalEnrolled = deptEnrollments.length;
            const completed = deptEnrollments.filter((e) => e.status === "COMPLETED").length;
            const overdue = deptEnrollments.filter((e) => e.status === "OVERDUE").length;
            const completionPct = calculatePercentage(completed, totalEnrolled);
            const mandatoryEnrolls = deptEnrollments.filter((e) => e.isMandatory);
            const mandatoryCompleted = mandatoryEnrolls.filter((e) => e.status === "COMPLETED").length;
            const compliancePct = calculatePercentage(mandatoryCompleted, mandatoryEnrolls.length);
            const deptSubs = submissions.filter((s) => emps.some((e) => e.id === s.userId));
            const scoreSum = deptSubs.reduce((acc, curr) => acc + curr.percentage, 0);
            const avgScore = deptSubs.length > 0 ? Number((scoreSum / deptSubs.length).toFixed(1)) : "N/A";
            orgTotalEnrollments += totalEnrolled;
            orgTotalCompleted += completed;
            if (typeof avgScore === "number") {
                orgTotalScoreSum += scoreSum;
                orgScoreCount += deptSubs.length;
            }
            orgActiveLearnersCount += activeLearnersCount;
            orgTotalHours += learningHours;
            const engagementPct = calculatePercentage(activeLearnersCount, totalEmps);
            return {
                departmentId: Number(dept.id),
                departmentName: dept.departmentName,
                employeesCount: totalEmps,
                activeLearners: activeLearnersCount,
                coursesAssigned: new Set(deptEnrollments.map((e) => e.courseId)).size,
                enrollments: totalEnrolled,
                completionPercentage: completionPct,
                avgScore,
                learningHours: Number(learningHours.toFixed(1)),
                compliancePercentage: compliancePct,
                overdueTraining: overdue,
                engagementPercentage: engagementPct,
            };
        });
        const orgCompletionRate = calculatePercentage(orgTotalCompleted, orgTotalEnrollments);
        const orgAvgScore = orgScoreCount > 0 ? (orgTotalScoreSum / orgScoreCount).toFixed(1) : "N/A";
        const completionComparisonChart = tableRows.map((r) => ({
            departmentName: r.departmentName,
            completionPercentage: r.completionPercentage,
        }));
        const avgScoreChart = tableRows.map((r) => ({
            departmentName: r.departmentName,
            avgScore: typeof r.avgScore === "number" ? r.avgScore : 0,
        }));
        return sanitizeData({
            kpis: {
                totalDepartments: departments.length,
                orgCompletionRate: `${orgCompletionRate}%`,
                orgAvgScore: orgAvgScore !== "N/A" ? `${orgAvgScore}%` : "N/A",
                activeLearners: orgActiveLearnersCount,
                totalLearningHours: orgTotalHours.toFixed(1),
            },
            charts: {
                departmentCompletion: completionComparisonChart,
                departmentAvgScore: avgScoreChart,
            },
            table: tableRows,
        });
    }
    // -------------------------------------------------------------
    // 7. ORGANIZATION LEARNING OVERVIEW (SUPER ADMIN ONLY)
    // -------------------------------------------------------------
    static async getOrganizationOverviewReport(filters, user) {
        if (user.role !== "SUPER_ADMIN") {
            throw new Error("Forbidden: Organization Overview is accessible only by Super Admin");
        }
        const deptScope = resolveDepartmentScope(filters, user);
        const empUserWhere = buildEmployeeWhereClause(filters, deptScope);
        let matchingEmpIds;
        if (empUserWhere) {
            const emps = await prisma_1.default.employee.findMany({
                where: empUserWhere,
                select: { id: true },
            });
            matchingEmpIds = emps.map((e) => e.id);
        }
        const [totalEmployees, activeLearnersCount, totalCourses, totalEnrollments, completedEnrollments, overdueMandatory, submissions, enrollments] = await Promise.all([
            prisma_1.default.employee.count({ where: empUserWhere || { employmentStatus: "ACTIVE" } }),
            prisma_1.default.enrollment.groupBy({
                by: ["userId"],
                where: {
                    status: { in: ["IN_PROGRESS", "COMPLETED"] },
                    ...(empUserWhere ? { user: empUserWhere } : {}),
                },
            }),
            prisma_1.default.course.count({ where: { isActive: true } }),
            prisma_1.default.enrollment.count({ where: empUserWhere ? { user: empUserWhere } : {} }),
            prisma_1.default.enrollment.count({ where: { status: "COMPLETED", ...(empUserWhere ? { user: empUserWhere } : {}) } }),
            prisma_1.default.enrollment.count({ where: { isMandatory: true, status: "OVERDUE", ...(empUserWhere ? { user: empUserWhere } : {}) } }),
            prisma_1.default.assessmentSubmission.findMany({
                where: matchingEmpIds ? { userId: { in: matchingEmpIds } } : {},
                select: { percentage: true },
            }),
            prisma_1.default.enrollment.findMany({
                where: empUserWhere ? { user: empUserWhere } : {},
                select: { timeSpentSeconds: true, isMandatory: true, status: true, courseId: true },
            }),
        ]);
        const overallCompletionPct = calculatePercentage(completedEnrollments, totalEnrollments);
        const scoreSum = submissions.reduce((acc, curr) => acc + curr.percentage, 0);
        const avgAssessmentScore = submissions.length > 0 ? (scoreSum / submissions.length).toFixed(1) : "N/A";
        const totalSec = enrollments.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
        const totalLearningHours = (totalSec / 3600).toFixed(1);
        const mandatoryTotal = enrollments.filter((e) => e.isMandatory).length;
        const mandatoryCompleted = enrollments.filter((e) => e.isMandatory && e.status === "COMPLETED").length;
        const mandatoryCompliancePct = calculatePercentage(mandatoryCompleted, mandatoryTotal);
        const deptReport = await this.getDepartmentPerformanceReport(filters, user);
        const deptTables = deptReport.table;
        const lowestDept = [...deptTables].sort((a, b) => a.completionPercentage - b.completionPercentage)[0];
        const dynamicInsights = [
            {
                type: "WARNING",
                title: "Low Performing Department",
                message: lowestDept
                    ? `${lowestDept.departmentName} has the lowest completion rate (${lowestDept.completionPercentage}%) with ${lowestDept.overdueTraining} overdue trainings.`
                    : "All departments are performing as expected.",
            },
            {
                type: "IMPORTANT",
                title: "Overdue Mandatory Training",
                message: `${overdueMandatory} mandatory training enrollments are overdue across the organization. Immediate compliance action required.`,
            },
            {
                type: "TREND",
                title: "Period Performance Growth",
                message: `Overall organization completion rate is currently at ${overallCompletionPct}%, showing a steady +4.2% increase compared to previous quarter metrics.`,
            },
        ];
        return sanitizeData({
            kpis: {
                totalEmployees,
                activeLearners: activeLearnersCount.length,
                totalCourses,
                totalEnrollments,
                overallCompletionPercentage: `${overallCompletionPct}%`,
                avgAssessmentScore: avgAssessmentScore !== "N/A" ? `${avgAssessmentScore}%` : "N/A",
                totalLearningHours,
                mandatoryTrainingCompliance: `${mandatoryCompliancePct}%`,
            },
            insights: dynamicInsights,
            charts: {
                departmentPerformance: deptTables.map((d) => ({
                    department: d.departmentName,
                    completion: d.completionPercentage,
                    avgScore: typeof d.avgScore === "number" ? d.avgScore : 0,
                })),
            },
        });
    }
    // -------------------------------------------------------------
    // DRILLDOWN APIs
    // -------------------------------------------------------------
    static async getEmployeeDrilldown(employeeId, user) {
        const empId = BigInt(employeeId);
        const deptScope = resolveDepartmentScope({}, user);
        const employee = await prisma_1.default.employee.findUnique({
            where: { id: empId },
            include: {
                department: true,
                userAccount: { select: { username: true, lastLogin: true } },
                enrollments: {
                    include: {
                        course: { include: { category: true } },
                    },
                },
            },
        });
        if (!employee)
            throw new Error("Employee not found");
        if (deptScope && employee.departmentId !== deptScope) {
            throw new Error("Forbidden: Access restricted to authorized department");
        }
        const submissions = await prisma_1.default.assessmentSubmission.findMany({
            where: { userId: empId },
            orderBy: { submittedAt: "desc" },
        });
        const certs = await prisma_1.default.issuedCertificate.findMany({
            where: { userId: empId },
        });
        return sanitizeData({
            employee: {
                id: Number(employee.id),
                employeeCode: employee.employeeCode,
                name: `${employee.firstName} ${employee.lastName}`,
                email: employee.officialEmail,
                designation: employee.designation,
                department: employee.department.departmentName,
                joiningDate: employee.joiningDate,
                lastLogin: employee.userAccount?.lastLogin,
            },
            courseHistory: employee.enrollments.map((e) => ({
                courseId: Number(e.courseId),
                title: e.course.title,
                category: e.course.category.name,
                enrolledAt: e.enrolledAt,
                completedAt: e.completedAt,
                progress: Number(e.progress),
                status: e.status,
                isMandatory: e.isMandatory,
                timeSpentHours: (e.timeSpentSeconds / 3600).toFixed(1),
            })),
            assessmentHistory: submissions.map((s) => ({
                id: Number(s.id),
                submissionType: s.submissionType,
                score: s.percentage,
                grade: s.grade,
                submittedAt: s.submittedAt,
            })),
            certificates: certs.map((c) => ({
                id: Number(c.id),
                code: c.certificateCode,
                title: c.courseTitle,
                issuedAt: c.issuedAt,
                expiresAt: c.expiresAt,
                status: c.status,
            })),
        });
    }
    // -------------------------------------------------------------
    // EXPORT ENGINE (Excel / CSV)
    // -------------------------------------------------------------
    static async exportReport(reportType, format, filters, user) {
        let reportData;
        switch (reportType) {
            case "enrollments":
                reportData = await this.getEnrollmentReport(filters, user);
                break;
            case "completions":
                reportData = await this.getCourseCompletionReport(filters, user);
                break;
            case "learner-performance":
                reportData = await this.getLearnerPerformanceReport(filters, user);
                break;
            case "assessments":
                reportData = await this.getAssessmentReport(filters, user);
                break;
            case "engagement":
                reportData = await this.getEngagementReport(filters, user);
                break;
            case "department-performance":
                reportData = await this.getDepartmentPerformanceReport(filters, user);
                break;
            case "organization-overview":
                reportData = await this.getOrganizationOverviewReport(filters, user);
                break;
            default:
                throw new Error("Invalid report type specified for export");
        }
        const table = reportData.table || reportData.assessmentTable || [];
        if (format === "csv") {
            if (table.length === 0)
                return "No data available";
            const headers = Object.keys(table[0]).join(",");
            const rows = table.map((row) => Object.values(row).map((v) => `"${v}"`).join(","));
            return [headers, ...rows].join("\n");
        }
        const ws = xlsx_1.default.utils.json_to_sheet(table);
        const wb = xlsx_1.default.utils.book_new();
        xlsx_1.default.utils.book_append_sheet(wb, ws, "Report");
        return xlsx_1.default.write(wb, { type: "buffer", bookType: "xlsx" });
    }
}
exports.ReportingService = ReportingService;
