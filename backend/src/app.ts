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
import searchRoutes from "./routes/search.routes";

import path from "path";
import fs from "fs";

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true,
}));

// Universal Static File Resolver Middleware for /storage & /storage/uploads (ZIP, DOCX, PPTX, PDF)
app.use("/storage", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const rawPath = decodeURIComponent(req.path || "").replace(/^\/+/, "");
  if (!rawPath || rawPath.includes("scorm")) {
    return next();
  }

  const fileName = path.basename(rawPath);
  const uploadsDir = path.join(process.cwd(), "public/storage/uploads");
  const storageDir = path.join(process.cwd(), "public/storage");
  const cleanSubPath = rawPath.replace(/^uploads[\/\\]/i, "");

  // Candidate paths for direct file lookup
  const candidatePaths = [
    path.join(uploadsDir, cleanSubPath),
    path.join(storageDir, cleanSubPath),
    path.join(uploadsDir, rawPath),
    path.join(storageDir, rawPath),
    path.join(uploadsDir, fileName),
    path.join(storageDir, fileName),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return res.sendFile(p);
    }
  }

  // Recursive search inside storage directories for timestamped files (e.g. doc-178...-TalentSense_AI.zip)
  function searchRecursive(dir: string, targetName: string): string | null {
    if (!fs.existsSync(dir)) return null;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const normTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = searchRecursive(fullPath, targetName);
          if (found) return found;
        } else if (entry.isFile()) {
          const normEntry = entry.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (
            entry.name === targetName ||
            normEntry === normTarget ||
            normEntry.includes(normTarget) ||
            (normTarget.length > 3 && normTarget.includes(normEntry))
          ) {
            return fullPath;
          }
        }
      }
    } catch (err) {
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
app.use("/storage/uploads", express.static(path.join(process.cwd(), "public/storage/uploads")));
app.use("/storage", express.static(path.join(process.cwd(), "public/storage/uploads")));
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
app.use("/api/search", searchRoutes);

app.use(errorHandler);

export default app;