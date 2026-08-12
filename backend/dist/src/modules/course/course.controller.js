"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocumentFile = exports.uploadScormPackage = exports.verifyBulkFile = exports.verifyUser = exports.bulkEnrollUsers = exports.adminEnrollUser = exports.selfEnrollCourse = exports.createContent = exports.deleteSection = exports.updateSection = exports.createSection = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourseById = exports.getCourses = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = require("../../utils/response");
const course_service_1 = __importDefault(require("./course.service"));
const prismaSerializer_1 = require("../../utils/prismaSerializer");
const prisma_1 = __importDefault(require("../../config/prisma"));
const notification_service_1 = __importDefault(require("../notification/notification.service"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
// GET /api/courses
exports.getCourses = (0, asyncHandler_1.default)(async (req, res) => {
    const { search, categoryId, isPublished, status, departmentId, page, limit } = req.query;
    const userContext = {
        role: req.user?.role || "GUEST",
        employeeId: req.user?.employeeId ? BigInt(req.user.employeeId) : undefined,
        departmentId: req.user?.departmentId ? BigInt(req.user.departmentId) : undefined,
    };
    const filters = {
        search: search,
        categoryId: categoryId ? Number(categoryId) : undefined,
        status: status,
        departmentId: departmentId ? BigInt(departmentId) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
    };
    const result = await course_service_1.default.getAllCourses(filters, userContext);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), "Courses fetched successfully");
});
// GET /api/courses/:id
exports.getCourseById = (0, asyncHandler_1.default)(async (req, res) => {
    const id = BigInt(req.params.id);
    const userContext = {
        role: req.user?.role || "GUEST",
        employeeId: req.user?.employeeId ? BigInt(req.user.employeeId) : undefined,
        departmentId: req.user?.departmentId ? BigInt(req.user.departmentId) : undefined,
    };
    const course = await course_service_1.default.getCourseById(id, userContext);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(course), "Course fetched successfully");
});
// POST /api/courses
exports.createCourse = (0, asyncHandler_1.default)(async (req, res) => {
    const userRole = req.user?.role || "LEARNER";
    if (userRole === "TEACHER") {
        res.status(403).json({
            success: false,
            message: "Forbidden: Teachers are not permitted to create new courses. Only Admin and Super Admin can create courses.",
        });
        return;
    }
    const userEmployeeId = BigInt(req.user?.employeeId);
    const userDepartmentId = req.user?.departmentId ? BigInt(req.user.departmentId) : null;
    let departmentId = null;
    // Rule: ADMIN department must be fixed to their assigned department
    if (userRole === "ADMIN") {
        departmentId = userDepartmentId;
    }
    else if (userRole === "SUPER_ADMIN") {
        // SUPER_ADMIN can pick a specific department OR select "ALL" / global (null)
        if (req.body.departmentId !== undefined &&
            req.body.departmentId !== null &&
            req.body.departmentId !== "global" &&
            req.body.departmentId !== "ALL" &&
            req.body.departmentId !== "") {
            departmentId = BigInt(req.body.departmentId);
        }
        else {
            departmentId = null;
        }
    }
    else {
        departmentId = userDepartmentId;
    }
    const data = {
        ...req.body,
        categoryId: BigInt(req.body.categoryId),
        creatorId: userEmployeeId,
        departmentId,
        enrollmentType: req.body.enrollmentType || "SELF",
        enrolledUserIds: req.body.enrolledUserIds || [],
        teacherIds: req.body.teacherIds || [],
    };
    const course = await course_service_1.default.createCourse(data);
    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma_1.default.auditLog.create({
        data: {
            actorName,
            action: "Course Published",
            detail: `Published '${course?.title || "Course"}'`,
            type: "course",
            ipAddress: req.ip || "Internal",
        },
    });
    // Notify department employees about the new course
    if (course) {
        notification_service_1.default.notifyCourseCreated({
            id: course.id,
            title: course.title,
            departmentId: course.departmentId || null,
            creatorId: data.creatorId,
        });
        // Notify individually enrolled users
        if (data.enrolledUserIds && data.enrolledUserIds.length > 0) {
            const enrollerName = req.user?.username || "An administrator";
            for (const uIdStr of data.enrolledUserIds) {
                try {
                    notification_service_1.default.notifyEnrollment({
                        userId: BigInt(uIdStr),
                        courseId: course.id,
                        courseTitle: course.title,
                        enrolledBy: enrollerName,
                    });
                }
                catch (e) {
                    // Non-blocking: enrollment notification failure should not break the flow
                }
            }
        }
    }
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(course), "Course created successfully", 201);
});
// PUT /api/courses/:id
exports.updateCourse = (0, asyncHandler_1.default)(async (req, res) => {
    const id = BigInt(req.params.id);
    const data = { ...req.body };
    if (data.categoryId)
        data.categoryId = BigInt(data.categoryId);
    if (data.departmentId)
        data.departmentId = BigInt(data.departmentId);
    const userContext = {
        role: req.user?.role || "GUEST",
        employeeId: req.user?.employeeId ? BigInt(req.user.employeeId) : undefined,
        username: req.user?.username || "System User",
    };
    const course = await course_service_1.default.updateCourse(id, data, userContext);
    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma_1.default.auditLog.create({
        data: {
            actorName,
            action: "Course Updated",
            detail: `Updated course '${course?.title || "Course"}'`,
            type: "course",
            ipAddress: req.ip || "Internal",
        },
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(course), "Course updated successfully");
});
// DELETE /api/courses/:id
exports.deleteCourse = (0, asyncHandler_1.default)(async (req, res) => {
    const id = BigInt(req.params.id);
    const existingCourse = await course_service_1.default.getCourseById(id);
    await course_service_1.default.deleteCourse(id);
    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma_1.default.auditLog.create({
        data: {
            actorName,
            action: "Course Deleted",
            detail: `Deleted course '${existingCourse?.title || id}'`,
            type: "course",
            ipAddress: req.ip || "Internal",
        },
    });
    return (0, response_1.successResponse)(res, null, "Course deleted successfully");
});
// POST /api/courses/:id/sections
exports.createSection = (0, asyncHandler_1.default)(async (req, res) => {
    const courseId = BigInt(req.params.id);
    const section = await course_service_1.default.createSection({
        ...req.body,
        courseId,
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(section), "Section created successfully", 201);
});
// PUT /api/courses/sections/:sectionId
exports.updateSection = (0, asyncHandler_1.default)(async (req, res) => {
    const sectionId = BigInt(req.params.sectionId);
    const section = await course_service_1.default.updateSection(sectionId, req.body);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(section), "Section updated successfully");
});
// DELETE /api/courses/sections/:sectionId
exports.deleteSection = (0, asyncHandler_1.default)(async (req, res) => {
    const sectionId = BigInt(req.params.sectionId);
    await course_service_1.default.deleteSection(sectionId);
    return (0, response_1.successResponse)(res, null, "Section deleted successfully");
});
// POST /api/courses/sections/:sectionId/contents
exports.createContent = (0, asyncHandler_1.default)(async (req, res) => {
    const sectionId = BigInt(req.params.sectionId);
    const content = await course_service_1.default.createContent({
        ...req.body,
        sectionId,
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(content), "Content created successfully", 201);
});
// POST /api/courses/:id/enroll (Self Enrollment)
exports.selfEnrollCourse = (0, asyncHandler_1.default)(async (req, res) => {
    if (req.user?.role === "GUEST") {
        return (0, response_1.errorResponse)(res, "Guests are not permitted to enroll in courses. Please log in with a learner account.", "FORBIDDEN", 403);
    }
    const courseId = BigInt(req.params.id);
    const userId = BigInt(req.user?.userId || req.user?.employeeId);
    const enrollment = await course_service_1.default.selfEnrollCourse(userId, courseId);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(enrollment), "Successfully enrolled in course");
});
// POST /api/courses/:id/admin-enroll (Single User Admin Enrollment)
exports.adminEnrollUser = (0, asyncHandler_1.default)(async (req, res) => {
    const courseId = BigInt(req.params.id);
    const { identifier } = req.body;
    if (!identifier) {
        return (0, response_1.errorResponse)(res, "Username or email is required", "BAD_REQUEST", 400);
    }
    const result = await course_service_1.default.adminEnrollUser(courseId, identifier);
    // Notify the enrolled user
    if (result.enrollment) {
        try {
            const courseData = await course_service_1.default.getCourseById(courseId);
            const enrollerName = req.user?.username || "An administrator";
            notification_service_1.default.notifyEnrollment({
                userId: result.enrollment.userId,
                courseId,
                courseTitle: courseData.title,
                enrolledBy: enrollerName,
            });
        }
        catch (e) {
            // Non-blocking: notification failure should not break enrollment
        }
    }
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), result.message);
});
// POST /api/courses/:id/bulk-enroll (Bulk Excel File Upload Enrollment)
exports.bulkEnrollUsers = (0, asyncHandler_1.default)(async (req, res) => {
    const courseId = BigInt(req.params.id);
    if (!req.file || !req.file.buffer) {
        return (0, response_1.errorResponse)(res, "Excel/CSV file is required for bulk enrolment", "BAD_REQUEST", 400);
    }
    const result = await course_service_1.default.bulkEnrollUsers(courseId, req.file.buffer);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), `Bulk enrolment complete. ${result.successCount} enrolled, ${result.failedCount} failed.`);
});
// POST /api/courses/verify-user (Pre-enrollment single user verification)
exports.verifyUser = (0, asyncHandler_1.default)(async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
        return (0, response_1.errorResponse)(res, "Username or email is required", "BAD_REQUEST", 400);
    }
    const result = await course_service_1.default.verifyUser(identifier);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), `User '${result.name}' verified successfully in database.`);
});
// POST /api/courses/verify-bulk-file (Pre-enrollment bulk Excel verification)
exports.verifyBulkFile = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return (0, response_1.errorResponse)(res, "Excel/CSV file is required for verification", "BAD_REQUEST", 400);
    }
    const result = await course_service_1.default.verifyBulkFile(req.file.buffer);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), `Verification complete. ${result.successCount} valid employees found, ${result.failedCount} invalid.`);
});
// POST /api/courses/upload-scorm (Upload & Extract SCORM Zip Package up to 100MB)
exports.uploadScormPackage = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return (0, response_1.errorResponse)(res, "SCORM ZIP package file is required", "BAD_REQUEST", 400);
    }
    const originalName = req.file.originalname || "scorm-package.zip";
    if (!originalName.toLowerCase().endsWith(".zip")) {
        return (0, response_1.errorResponse)(res, "Only .zip SCORM package files are supported", "BAD_REQUEST", 400);
    }
    const folderId = `scorm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const storageBaseDir = path_1.default.join(process.cwd(), "public", "storage", "scorm", folderId);
    if (!fs_1.default.existsSync(storageBaseDir)) {
        fs_1.default.mkdirSync(storageBaseDir, { recursive: true });
    }
    const zip = new adm_zip_1.default(req.file.buffer);
    zip.extractAllTo(storageBaseDir, true);
    let launchFile = "index.html";
    // 1. Try reading imsmanifest.xml if exists
    const manifestPath = path_1.default.join(storageBaseDir, "imsmanifest.xml");
    if (fs_1.default.existsSync(manifestPath)) {
        try {
            const manifestContent = fs_1.default.readFileSync(manifestPath, "utf-8");
            const match = manifestContent.match(/<resource[^>]*href=["']([^"']+)["']/i) || manifestContent.match(/href=["']([^"']+\.html?)["']/i);
            if (match && match[1]) {
                launchFile = match[1];
            }
        }
        catch (err) {
            console.warn("Failed to parse imsmanifest.xml:", err);
        }
    }
    // 2. If launchFile does not exist on disk, scan directory for candidates
    if (!fs_1.default.existsSync(path_1.default.join(storageBaseDir, launchFile))) {
        const candidates = ["index.html", "index_lms.html", "story.html", "launcher.html", "scorm.html"];
        let found = false;
        for (const cand of candidates) {
            if (fs_1.default.existsSync(path_1.default.join(storageBaseDir, cand))) {
                launchFile = cand;
                found = true;
                break;
            }
        }
        if (!found) {
            const findHtmlRecursive = (dir, baseDir) => {
                const files = fs_1.default.readdirSync(dir);
                for (const f of files) {
                    const full = path_1.default.join(dir, f);
                    const stat = fs_1.default.statSync(full);
                    if (stat.isDirectory()) {
                        const sub = findHtmlRecursive(full, baseDir);
                        if (sub)
                            return sub;
                    }
                    else if (f.toLowerCase().endsWith(".html") || f.toLowerCase().endsWith(".htm")) {
                        return path_1.default.relative(baseDir, full).replace(/\\/g, "/");
                    }
                }
                return null;
            };
            const firstHtml = findHtmlRecursive(storageBaseDir, storageBaseDir);
            if (firstHtml) {
                launchFile = firstHtml;
            }
        }
    }
    const sizeMb = (req.file.size / (1024 * 1024)).toFixed(1);
    const relativeUrl = `/storage/scorm/${folderId}/${launchFile}`;
    return (0, response_1.successResponse)(res, {
        entryUrl: relativeUrl,
        folderId,
        fileName: originalName,
        fileSize: `${sizeMb} MB`,
    }, "SCORM ZIP package uploaded and extracted successfully");
});
// POST /api/courses/upload-document
exports.uploadDocumentFile = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.file) {
        throw new Error("No document file provided.");
    }
    const originalName = req.file.originalname;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `doc-${Date.now()}-${sanitizedName}`;
    const storageDir = path_1.default.join(process.cwd(), "public", "storage", "uploads");
    if (!fs_1.default.existsSync(storageDir)) {
        fs_1.default.mkdirSync(storageDir, { recursive: true });
    }
    const filePath = path_1.default.join(storageDir, uniqueName);
    fs_1.default.writeFileSync(filePath, req.file.buffer);
    const sizeMb = (req.file.size / (1024 * 1024)).toFixed(1);
    const relativeUrl = `/storage/uploads/${uniqueName}`;
    let extractedSlides = [];
    if (originalName.toLowerCase().endsWith(".pptx")) {
        try {
            const zip = new adm_zip_1.default(req.file.buffer);
            const zipEntries = zip.getEntries();
            const slideEntries = zipEntries
                .filter((e) => e.entryName.match(/ppt\/slides\/slide\d+\.xml/i))
                .sort((a, b) => {
                const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
                const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
                return numA - numB;
            });
            const colors = [
                "from-amber-500/20 to-orange-500/10 border-amber-500/30",
                "from-blue-500/20 to-indigo-500/10 border-blue-500/30",
                "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
                "from-purple-500/20 to-pink-500/10 border-purple-500/30",
                "from-red-500/20 to-rose-500/10 border-red-500/30",
                "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
            ];
            slideEntries.forEach((entry, idx) => {
                const xmlText = entry.getData().toString("utf8");
                const textMatches = [];
                const regex = /<a:t[^>]*>(.*?)<\/a:t>/gi;
                let match;
                while ((match = regex.exec(xmlText)) !== null) {
                    const cleanText = match[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
                    if (cleanText) {
                        textMatches.push(cleanText);
                    }
                }
                if (textMatches.length > 0) {
                    const heading = textMatches[0] || `Slide ${idx + 1}`;
                    const subheading = textMatches.length > 1 ? textMatches[1] : `Key Concepts`;
                    const bullets = textMatches.slice(2).filter((b) => b.length > 1);
                    extractedSlides.push({
                        slideNum: idx + 1,
                        tag: `Slide ${idx + 1}`,
                        heading,
                        subheading,
                        bullets: bullets.length > 0 ? bullets : [subheading],
                        color: colors[idx % colors.length],
                    });
                }
            });
        }
        catch (err) {
            console.error("PPTX slide extraction error:", err);
        }
    }
    return (0, response_1.successResponse)(res, {
        fileUrl: relativeUrl,
        fileName: originalName,
        fileSize: `${sizeMb} MB`,
        extractedSlides: extractedSlides.length > 0 ? extractedSlides : undefined,
        slidesConfigJson: extractedSlides.length > 0 ? JSON.stringify(extractedSlides) : undefined,
    }, "Document file uploaded and processed successfully");
});
