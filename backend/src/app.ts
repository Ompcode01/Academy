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
import fs from "fs";

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true,
}));

// Serve static storage directory for unzipped SCORM packages, documents, and uploads
app.use("/storage/uploads", express.static(path.join(process.cwd(), "public/storage/uploads")));
app.use("/storage/documents", express.static(path.join(process.cwd(), "public/storage/uploads")));
app.use("/storage/documents", express.static(path.join(process.cwd(), "public/storage")));
app.use("/storage", express.static(path.join(process.cwd(), "public/storage/uploads")));
app.use("/storage", express.static(path.join(process.cwd(), "public/storage")));
app.use("/storage", express.static(path.join(__dirname, "../public/storage")));

// Smart wildcard fallback handler for all static storage files (PDF, DOCX, ZIP, PPTX)
app.use("/storage", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const reqPath = decodeURIComponent(req.path).replace(/^\/+/, "");
  if (!reqPath || reqPath.includes("scorm")) return next();
  const fileName = path.basename(reqPath);
  const storageUploadsDir = path.join(process.cwd(), "public/storage/uploads");
  const storageDir = path.join(process.cwd(), "public/storage");

  // 1. Direct path check
  const possiblePaths = [
    path.join(storageUploadsDir, reqPath),
    path.join(storageDir, reqPath),
    path.join(storageUploadsDir, fileName),
    path.join(storageDir, fileName),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return res.sendFile(p);
    }
  }

  // 2. Fuzzy / Prefix matching across storage upload directories
  try {
    const searchDirs = [storageUploadsDir, storageDir];
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normTarget = normalize(fileName);

    if (normTarget.length > 2) {
      for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        const match = files.find((f) => {
          const normF = normalize(f);
          return normF.includes(normTarget) || normTarget.includes(normF);
        });
        if (match) {
          const fullMatchPath = path.join(dir, match);
          if (fs.existsSync(fullMatchPath) && fs.statSync(fullMatchPath).isFile()) {
            return res.sendFile(fullMatchPath);
          }
        }
      }
    }
  } catch (err) {
    console.error("Storage fallback match error:", err);
  }

  next();
});

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