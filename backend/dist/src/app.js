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
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true,
}));
// Serve static storage directory for unzipped SCORM packages and uploads
app.use("/storage", express_1.default.static(path_1.default.join(__dirname, "../public/storage")));
app.use("/storage", express_1.default.static(path_1.default.join(process.cwd(), "public/storage")));
app.use("/storage", express_1.default.static(path_1.default.join(process.cwd(), "public/storage/uploads")));
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
