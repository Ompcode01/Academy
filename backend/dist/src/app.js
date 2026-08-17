"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_test_routes_1 = __importDefault(require("./routes/prisma-test.routes"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const cors_1 = __importDefault(require("cors"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const permission_routes_1 = __importDefault(require("./routes/permission.routes"));
const rolePermission_routes_1 = __importDefault(require("./routes/rolePermission.routes"));
const userAccount_routes_1 = __importDefault(require("./routes/userAccount.routes"));
const userRole_routes_1 = __importDefault(require("./routes/userRole.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const course_routes_1 = __importDefault(require("./modules/course/course.routes"));
const category_routes_1 = __importDefault(require("./modules/course/category.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const skill_routes_1 = __importDefault(require("./routes/skill.routes"));
const certificate_routes_1 = __importDefault(require("./routes/certificate.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const reporting_routes_1 = __importDefault(require("./routes/reporting.routes"));
const guestGrant_routes_1 = __importDefault(require("./routes/guestGrant.routes"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true,
}));
// Universal Static File Resolver Middleware for /storage & /storage/uploads (ZIP, DOCX, PPTX, PDF)
app.use("/storage", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD")
        return next();
    const rawPath = decodeURIComponent(req.path || "").replace(/^\/+/, "");
    if (!rawPath || rawPath.includes("scorm")) {
        return next();
    }
    const fileName = path_1.default.basename(rawPath);
    const uploadsDir = path_1.default.join(process.cwd(), "public/storage/uploads");
    const storageDir = path_1.default.join(process.cwd(), "public/storage");
    const cleanSubPath = rawPath.replace(/^uploads[\/\\]/i, "");
    // Candidate paths for direct file lookup
    const candidatePaths = [
        path_1.default.join(uploadsDir, cleanSubPath),
        path_1.default.join(storageDir, cleanSubPath),
        path_1.default.join(uploadsDir, rawPath),
        path_1.default.join(storageDir, rawPath),
        path_1.default.join(uploadsDir, fileName),
        path_1.default.join(storageDir, fileName),
    ];
    for (const p of candidatePaths) {
        if (fs_1.default.existsSync(p) && fs_1.default.statSync(p).isFile()) {
            return res.sendFile(p);
        }
    }
    // Recursive search inside storage directories for timestamped files (e.g. doc-178...-TalentSense_AI.zip)
    function searchRecursive(dir, targetName) {
        if (!fs_1.default.existsSync(dir))
            return null;
        try {
            const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
            const normTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
            for (const entry of entries) {
                const fullPath = path_1.default.join(dir, entry.name);
                if (entry.isDirectory()) {
                    const found = searchRecursive(fullPath, targetName);
                    if (found)
                        return found;
                }
                else if (entry.isFile()) {
                    const normEntry = entry.name.toLowerCase().replace(/[^a-z0-9]/g, "");
                    if (entry.name === targetName ||
                        normEntry === normTarget ||
                        normEntry.includes(normTarget) ||
                        (normTarget.length > 3 && normTarget.includes(normEntry))) {
                        return fullPath;
                    }
                }
            }
        }
        catch (err) {
            console.error("Static file recursive search error:", err);
        }
        return null;
    }
    const foundFile = searchRecursive(uploadsDir, fileName) || searchRecursive(storageDir, fileName);
    if (foundFile) {
        return res.sendFile(foundFile);
    }
    next();
});
// Standard static express middleware for relative assets
app.use("/storage/uploads", express_1.default.static(path_1.default.join(process.cwd(), "public/storage/uploads")));
app.use("/storage", express_1.default.static(path_1.default.join(process.cwd(), "public/storage/uploads")));
app.use("/storage", express_1.default.static(path_1.default.join(process.cwd(), "public/storage")));
app.get("/", (req, res) => {
    res.json({
        message: "LMS Backend Running"
    });
});
app.use("/api/departments", department_routes_1.default);
app.use("/api/employees", employee_routes_1.default);
app.use("/api/roles", role_routes_1.default);
app.use("/api/permissions", permission_routes_1.default);
app.use("/api/role-permissions", rolePermission_routes_1.default);
app.use("/api/user-accounts", userAccount_routes_1.default);
app.use("/api/user-roles", userRole_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/prisma-test", prisma_test_routes_1.default);
app.use("/api/health", health_routes_1.default);
app.use("/api/courses", course_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/skills", skill_routes_1.default);
app.use("/api/certificates", certificate_routes_1.default);
app.use("/api/events", event_routes_1.default);
app.use("/api/admin/audit-logs", audit_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/reports", reporting_routes_1.default);
app.use("/api/guest-grants", guestGrant_routes_1.default);
app.use(error_middleware_1.default);
exports.default = app;
