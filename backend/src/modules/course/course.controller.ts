import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import { successResponse, errorResponse } from "../../utils/response";
import courseService from "./course.service";
import { serializeBigInt } from "../../utils/prismaSerializer";
import prisma from "../../config/prisma";
import notificationService from "../notification/notification.service";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
const { convert: convertPptxToPdf } = require("pptx-to-pdf");

// GET /api/courses
export const getCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, categoryId, isPublished, status, departmentId, page, limit } = req.query;

  const userContext = {
    role: req.user?.role || "GUEST",
    employeeId: req.user?.employeeId ? BigInt(req.user.employeeId) : undefined,
    departmentId: req.user?.departmentId ? BigInt(req.user.departmentId) : undefined,
  };

  const filters = {
    search: search as string | undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    status: status as string | undefined,
    departmentId: departmentId ? BigInt(departmentId as string) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  };

  const result = await courseService.getAllCourses(filters, userContext);
  return successResponse(res, serializeBigInt(result), "Courses fetched successfully");
});

// GET /api/courses/:id
export const getCourseById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = BigInt(req.params.id as string);
    const userContext = {
      role: req.user?.role || "GUEST",
      employeeId: req.user?.employeeId ? BigInt(req.user.employeeId) : undefined,
      departmentId: req.user?.departmentId ? BigInt(req.user.departmentId) : undefined,
    };
    const course = await courseService.getCourseById(id, userContext);
    return successResponse(res, serializeBigInt(course), "Course fetched successfully");
  }
);

// POST /api/courses
export const createCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userRole = req.user?.role || "LEARNER";
    if (userRole === "TEACHER") {
      res.status(403).json({
        success: false,
        message: "Forbidden: Teachers are not permitted to create new courses. Only Admin and Super Admin can create courses.",
      });
      return;
    }

    const userEmployeeId = BigInt(req.user?.employeeId as string);
    const userDepartmentId = req.user?.departmentId ? BigInt(req.user.departmentId as string) : null;

    let departmentId: bigint | null = null;

    // Rule: ADMIN department must be fixed to their assigned department
    if (userRole === "ADMIN") {
      departmentId = userDepartmentId;
    } else if (userRole === "SUPER_ADMIN") {
      // SUPER_ADMIN can pick a specific department OR select "ALL" / global (null)
      if (
        req.body.departmentId !== undefined &&
        req.body.departmentId !== null &&
        req.body.departmentId !== "global" &&
        req.body.departmentId !== "ALL" &&
        req.body.departmentId !== ""
      ) {
        departmentId = BigInt(req.body.departmentId);
      } else {
        departmentId = null;
      }
    } else {
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

    const course = await courseService.createCourse(data);

    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma.auditLog.create({
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
      notificationService.notifyCourseCreated({
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
            notificationService.notifyEnrollment({
              userId: BigInt(uIdStr),
              courseId: course.id,
              courseTitle: course.title,
              enrolledBy: enrollerName,
            });
          } catch (e) {
            // Non-blocking: enrollment notification failure should not break the flow
          }
        }
      }
    }

    return successResponse(res, serializeBigInt(course), "Course created successfully", 201);
  }
);

// PUT /api/courses/:id
export const updateCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = BigInt(req.params.id as string);
    const data = { ...req.body };
    if (data.categoryId) data.categoryId = BigInt(data.categoryId);
    if (data.departmentId) data.departmentId = BigInt(data.departmentId);

    const userContext = {
      role: req.user?.role || "GUEST",
      employeeId: req.user?.employeeId ? BigInt(req.user.employeeId) : undefined,
      username: req.user?.username || "System User",
    };

    const course = await courseService.updateCourse(id, data, userContext);

    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Course Updated",
        detail: `Updated course '${course?.title || "Course"}'`,
        type: "course",
        ipAddress: req.ip || "Internal",
      },
    });

    return successResponse(res, serializeBigInt(course), "Course updated successfully");
  }
);

// DELETE /api/courses/:id
export const deleteCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = BigInt(req.params.id as string);
    const existingCourse = await courseService.getCourseById(id);
    await courseService.deleteCourse(id);

    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Course Deleted",
        detail: `Deleted course '${existingCourse?.title || id}'`,
        type: "course",
        ipAddress: req.ip || "Internal",
      },
    });

    return successResponse(res, null, "Course deleted successfully");
  }
);

// POST /api/courses/:id/sections
export const createSection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const courseId = BigInt(req.params.id as string);
    const section = await courseService.createSection({
      ...req.body,
      courseId,
    });
    return successResponse(res, serializeBigInt(section), "Section created successfully", 201);
  }
);

// PUT /api/courses/sections/:sectionId
export const updateSection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sectionId = BigInt(req.params.sectionId as string);
    const section = await courseService.updateSection(sectionId, req.body);
    return successResponse(res, serializeBigInt(section), "Section updated successfully");
  }
);

// DELETE /api/courses/sections/:sectionId
export const deleteSection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sectionId = BigInt(req.params.sectionId as string);
    await courseService.deleteSection(sectionId);
    return successResponse(res, null, "Section deleted successfully");
  }
);

// POST /api/courses/sections/:sectionId/contents
export const createContent = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sectionId = BigInt(req.params.sectionId as string);
    const content = await courseService.createContent({
      ...req.body,
      sectionId,
    });
    return successResponse(res, serializeBigInt(content), "Content created successfully", 201);
  }
);

// POST /api/courses/:id/enroll (Self Enrollment)
export const selfEnrollCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role === "GUEST") {
      return errorResponse(res, "Guests are not permitted to enroll in courses. Please log in with a learner account.", "FORBIDDEN", 403);
    }
    const courseId = BigInt(req.params.id as string);
    const userId = BigInt(req.user?.userId || req.user?.employeeId as string);
    const enrollment = await courseService.selfEnrollCourse(userId, courseId);
    return successResponse(res, serializeBigInt(enrollment), "Successfully enrolled in course");
  }
);

// POST /api/courses/:id/admin-enroll (Single User Admin Enrollment)
export const adminEnrollUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const courseId = BigInt(req.params.id as string);
    const { identifier } = req.body;
    if (!identifier) {
      return errorResponse(res, "Username or email is required", "BAD_REQUEST", 400);
    }
    const result = await courseService.adminEnrollUser(courseId, identifier);

    // Notify the enrolled user
    if (result.enrollment) {
      try {
        const courseData = await courseService.getCourseById(courseId);
        const enrollerName = req.user?.username || "An administrator";
        notificationService.notifyEnrollment({
          userId: result.enrollment.userId,
          courseId,
          courseTitle: courseData.title,
          enrolledBy: enrollerName,
        });
      } catch (e) {
        // Non-blocking: notification failure should not break enrollment
      }
    }

    return successResponse(res, serializeBigInt(result), result.message);
  }
);

// POST /api/courses/:id/bulk-enroll (Bulk Excel File Upload Enrollment)
export const bulkEnrollUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const courseId = BigInt(req.params.id as string);
    if (!req.file || !req.file.buffer) {
      return errorResponse(res, "Excel/CSV file is required for bulk enrolment", "BAD_REQUEST", 400);
    }
    const result = await courseService.bulkEnrollUsers(courseId, req.file.buffer);
    return successResponse(
      res,
      serializeBigInt(result),
      `Bulk enrolment complete. ${result.successCount} enrolled, ${result.failedCount} failed.`
    );
  }
);

// POST /api/courses/verify-user (Pre-enrollment single user verification)
export const verifyUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { identifier } = req.body;
    if (!identifier) {
      return errorResponse(res, "Username or email is required", "BAD_REQUEST", 400);
    }
    const result = await courseService.verifyUser(identifier);
    return successResponse(res, serializeBigInt(result), `User '${result.name}' verified successfully in database.`);
  }
);

// POST /api/courses/verify-bulk-file (Pre-enrollment bulk Excel verification)
export const verifyBulkFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file || !req.file.buffer) {
      return errorResponse(res, "Excel/CSV file is required for verification", "BAD_REQUEST", 400);
    }
    const result = await courseService.verifyBulkFile(req.file.buffer);
    return successResponse(
      res,
      serializeBigInt(result),
      `Verification complete. ${result.successCount} valid employees found, ${result.failedCount} invalid.`
    );
  }
);

// POST /api/courses/upload-scorm (Upload & Extract SCORM Zip Package up to 100MB)
export const uploadScormPackage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file || !req.file.buffer) {
      return errorResponse(res, "SCORM ZIP package file is required", "BAD_REQUEST", 400);
    }

    const originalName = req.file.originalname || "scorm-package.zip";
    if (!originalName.toLowerCase().endsWith(".zip")) {
      return errorResponse(res, "Only .zip SCORM package files are supported", "BAD_REQUEST", 400);
    }

    const folderId = `scorm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const storageBaseDir = path.join(process.cwd(), "public", "storage", "scorm", folderId);

    if (!fs.existsSync(storageBaseDir)) {
      fs.mkdirSync(storageBaseDir, { recursive: true });
    }

    const zip = new AdmZip(req.file.buffer);
    zip.extractAllTo(storageBaseDir, true);

    let launchFile = "index.html";

    // 1. Try reading imsmanifest.xml if exists
    const manifestPath = path.join(storageBaseDir, "imsmanifest.xml");
    if (fs.existsSync(manifestPath)) {
      try {
        const manifestContent = fs.readFileSync(manifestPath, "utf-8");
        const match = manifestContent.match(/<resource[^>]*href=["']([^"']+)["']/i) || manifestContent.match(/href=["']([^"']+\.html?)["']/i);
        if (match && match[1]) {
          launchFile = match[1];
        }
      } catch (err) {
        console.warn("Failed to parse imsmanifest.xml:", err);
      }
    }

    // 2. If launchFile does not exist on disk, scan directory for candidates
    if (!fs.existsSync(path.join(storageBaseDir, launchFile))) {
      const candidates = ["index.html", "index_lms.html", "story.html", "launcher.html", "scorm.html"];
      let found = false;

      for (const cand of candidates) {
        if (fs.existsSync(path.join(storageBaseDir, cand))) {
          launchFile = cand;
          found = true;
          break;
        }
      }

      if (!found) {
        const findHtmlRecursive = (dir: string, baseDir: string): string | null => {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            const full = path.join(dir, f);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
              const sub = findHtmlRecursive(full, baseDir);
              if (sub) return sub;
            } else if (f.toLowerCase().endsWith(".html") || f.toLowerCase().endsWith(".htm")) {
              return path.relative(baseDir, full).replace(/\\/g, "/");
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

    return successResponse(
      res,
      {
        entryUrl: relativeUrl,
        folderId,
        fileName: originalName,
        fileSize: `${sizeMb} MB`,
      },
      "SCORM ZIP package uploaded and extracted successfully"
    );
  }
);

// POST /api/courses/upload-document
export const uploadDocumentFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new Error("No document file provided.");
    }

    const originalName = req.file.originalname;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `doc-${Date.now()}-${sanitizedName}`;
    const storageDir = path.join(process.cwd(), "public", "storage", "uploads");

    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const filePath = path.join(storageDir, uniqueName);
    fs.writeFileSync(filePath, req.file.buffer);

    const sizeMb = (req.file.size / (1024 * 1024)).toFixed(1);
    const relativeUrl = `/storage/uploads/${uniqueName}`;

    // Convert PPTX to PDF for inline viewing (saved alongside original)
    let convertedPdfUrl: string | undefined;
    if (originalName.toLowerCase().endsWith(".pptx")) {
      try {
        const pdfBuffer = await convertPptxToPdf(req.file.buffer);
        const pdfName = uniqueName.replace(/\.pptx$/i, ".converted.pdf");
        const pdfPath = path.join(storageDir, pdfName);
        fs.writeFileSync(pdfPath, pdfBuffer);
        convertedPdfUrl = `/storage/uploads/${pdfName}`;
        console.log(`PPTX converted to PDF: ${pdfName}`);
      } catch (pdfErr) {
        console.error("PPTX to PDF conversion error:", pdfErr);
      }
    }

    let extractedSlides: Array<{
      slideNum: number;
      tag: string;
      heading: string;
      subheading: string;
      bullets: string[];
      color: string;
    }> = [];

    let extractedZipFiles: Array<{ name: string; url: string; sizeMb: string }> = [];

    if (originalName.toLowerCase().endsWith(".zip")) {
      try {
        const zip = new AdmZip(req.file.buffer);
        const folderName = `extracted_${Date.now()}`;
        const extractDir = path.join(storageDir, folderName);
        if (!fs.existsSync(extractDir)) {
          fs.mkdirSync(extractDir, { recursive: true });
        }
        zip.extractAllTo(extractDir, true);

        const zipEntries = zip.getEntries();
        zipEntries.forEach((entry) => {
          if (!entry.isDirectory) {
            extractedZipFiles.push({
              name: entry.entryName,
              url: `/storage/uploads/${folderName}/${entry.entryName}`,
              sizeMb: (entry.header.size / (1024 * 1024)).toFixed(2),
            });
          }
        });
      } catch (zipErr) {
        console.error("ZIP archive extraction error:", zipErr);
      }
    }

    if (originalName.toLowerCase().endsWith(".pptx")) {
      try {
        const zip = new AdmZip(req.file.buffer);
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
          const textMatches: string[] = [];
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
      } catch (err) {
        console.error("PPTX slide extraction error:", err);
      }
    }

    return successResponse(
      res,
      {
        fileUrl: relativeUrl,
        fileName: originalName,
        fileSize: `${sizeMb} MB`,
        convertedPdfUrl,
        extractedZipFiles: extractedZipFiles.length > 0 ? extractedZipFiles : undefined,
        extractedSlides: extractedSlides.length > 0 ? extractedSlides : undefined,
        slidesConfigJson: extractedSlides.length > 0 ? JSON.stringify(extractedSlides) : undefined,
      },
      "Document file uploaded and processed successfully"
    );
  }
);