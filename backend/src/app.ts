import express from "express";
import prismaTestRoutes from "./routes/prisma-test.routes";
import errorHandler from "./middleware/error.middleware";
import cors from "cors";
import employeeRoutes from "./routes/employee.routes";
import departmentRoutes from "./routes/department.routes";
import roleRoutes from "./routes/role.routes";
import permissionRoutes from "./routes/permission.routes";
import rolePermissionRoutes from "./routes/rolePermission.routes";
import userAccountRoutes from "./routes/userAccount.routes";
import userRoleRoutes from "./routes/userRole.routes";
import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import courseRoutes from "./modules/course/course.routes";
import categoryRoutes from "./modules/course/category.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import skillRoutes from "./routes/skill.routes";
import certificateRoutes from "./routes/certificate.routes";
import eventRoutes from "./routes/event.routes";
import auditRoutes from "./routes/audit.routes";
import notificationRoutes from "./routes/notification.routes";
import reportingRoutes from "./routes/reporting.routes";
import guestGrantRoutes from "./routes/guestGrant.routes";

import path from "path";

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true,
}));

// Serve static storage directory for unzipped SCORM packages and uploads
app.use("/storage", express.static(path.join(__dirname, "../public/storage")));
app.use("/storage", express.static(path.join(process.cwd(), "public/storage")));

app.get("/", (req, res) => {
    res.json({
        message: "LMS Backend Running"
    });
});

app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/role-permissions", rolePermissionRoutes);
app.use("/api/user-accounts", userAccountRoutes);
app.use("/api/user-roles", userRoleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/prisma-test", prismaTestRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin/audit-logs", auditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportingRoutes);
app.use("/api/guest-grants", guestGrantRoutes);

app.use(errorHandler);

export default app;