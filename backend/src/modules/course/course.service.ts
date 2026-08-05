import courseRepository from "./course.repository";
import prisma from "../../config/prisma";
import * as XLSX from "xlsx";

interface CourseFilters {
  search?: string;
  categoryId?: number;
  status?: string;
  departmentId?: bigint;
  page?: number;
  limit?: number;
}

interface UserContext {
  role: string;
  employeeId?: bigint;
  departmentId?: bigint;
}

class CourseService {
  async getAllCourses(filters: CourseFilters = {}, userContext?: UserContext) {
    // Build role-scoped where clause
    const scopeWhere = this.buildScopeFilter(userContext);
    return courseRepository.findAll(filters, scopeWhere);
  }

  /**
   * Build Prisma where-clause additions based on the user's role:
   * - SUPER_ADMIN: all courses (no extra filter)
   * - ADMIN: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
   * - TEACHER: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
   * - LEARNER: PUBLISHED courses in their department OR created by SUPER_ADMIN / ADMIN OR global published courses
   * - GUEST: only PUBLISHED courses
   */
  private buildScopeFilter(userContext?: UserContext): any {
    if (!userContext) return {};

    const { role, employeeId, departmentId } = userContext;

    const superAdminOrAdminCourseCondition = {
      creator: {
        assignedRoles: {
          some: {
            role: {
              roleCode: { in: ["SUPER_ADMIN", "ADMIN"] },
            },
            isActive: true,
          },
        },
      },
    };

    switch (role) {
      case "SUPER_ADMIN":
        return {}; // Super Admin sees all courses across all departments

      case "ADMIN":
        return {
          OR: [
            { departmentId: null },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ creatorId: employeeId }] : []),
            ...(employeeId ? [{ teachers: { some: { teacherId: employeeId } } }] : []),
          ],
        };

      case "TEACHER":
        return {
          OR: [
            { departmentId: null },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ creatorId: employeeId }] : []),
            ...(employeeId ? [{ teachers: { some: { teacherId: employeeId } } }] : []),
          ],
        };

      case "LEARNER":
        return {
          status: "PUBLISHED",
          OR: [
            { departmentId: null },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ enrollments: { some: { userId: employeeId } } }] : []),
          ],
        };

      case "GUEST":
        return { status: "PUBLISHED" };

      default:
        return { status: "PUBLISHED" };
    }
  }

  async getCourseById(id: bigint) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new Error("Course not found");
    }
    return course;
  }

  async createCourse(data: {
    categoryId: bigint;
    creatorId: bigint;
    departmentId?: bigint | null;
    title: string;
    shortDescription?: string;
    description?: string;
    thumbnail?: string;
    duration?: number;
    level?: string;
    language?: string;
    status?: string;
    enrollmentType?: string;
    enrolledUserIds?: string[];
    teacherIds?: string[];
    sections?: any[];
  }) {
    const { teacherIds, enrolledUserIds, sections, ...createFields } = data;
    const course = await courseRepository.create(createFields);

    if (sections && Array.isArray(sections) && sections.length > 0) {
      await this.saveCourseSectionsAndContents(course.id, sections);
    }

    if (teacherIds && teacherIds.length > 0) {
      await this.assignTeachers(course.id, teacherIds);
    }

    if (enrolledUserIds && enrolledUserIds.length > 0) {
      const uniqueUserIds = Array.from(new Set(enrolledUserIds));
      for (const uIdStr of uniqueUserIds) {
        try {
          const uId = BigInt(uIdStr);
          await prisma.enrollment.upsert({
            where: {
              userId_courseId: {
                userId: uId,
                courseId: course.id,
              },
            },
            create: {
              userId: uId,
              courseId: course.id,
              status: "IN_PROGRESS",
              progress: 0,
            },
            update: {},
          });
        } catch (e) {
          console.error("Batch enrollment error for user:", uIdStr, e);
        }
      }
    }

    return this.getCourseById(course.id);
  }

  async saveCourseSectionsAndContents(courseId: bigint, sections: any[]) {
    if (!sections || !Array.isArray(sections) || sections.length === 0) return;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const secData = sections[sIdx];
      const sectionTitle = secData.title || `Module ${sIdx + 1}`;

      const section = await prisma.courseSection.create({
        data: {
          courseId,
          title: sectionTitle,
          description: secData.description || null,
          sectionOrder: secData.sectionOrder || sIdx + 1,
          isPublished: true,
        },
      });

      if (secData.contents && Array.isArray(secData.contents)) {
        for (let cIdx = 0; cIdx < secData.contents.length; cIdx++) {
          const cntData = secData.contents[cIdx];
          const quizJson =
            cntData.quizConfigJson || (cntData.questions ? JSON.stringify(cntData.questions) : null);
          const assignmentJson =
            cntData.assignmentConfigJson ||
            (cntData.contentType === "ASSIGNMENT"
              ? JSON.stringify({
                  instructions: cntData.description || cntData.instructions || "Complete practical assignment.",
                  maxScore: cntData.maxScore || 100,
                  requiresGrading: true,
                })
              : null);

          await prisma.learningContent.create({
            data: {
              sectionId: section.id,
              title: cntData.title || `Content ${cIdx + 1}`,
              contentType: cntData.contentType || "LESSON",
              contentUrl: cntData.contentUrl || cntData.videoUrl || null,
              description: cntData.description || null,
              duration: cntData.duration || 10,
              contentOrder: cntData.contentOrder || cIdx + 1,
              isMandatory: true,
              isPublished: true,
              quizConfigJson: quizJson,
              assignmentConfigJson: assignmentJson,
            },
          });
        }
      }
    }
  }

  async updateCourse(
    id: bigint,
    data: {
      categoryId?: bigint;
      departmentId?: bigint | null;
      title?: string;
      shortDescription?: string;
      description?: string;
      thumbnail?: string;
      duration?: number;
      level?: string;
      language?: string;
      status?: string;
      enrollmentType?: string;
      enrolledUserIds?: string[];
      teacherIds?: string[];
      sections?: any[];
    }
  ) {
    await this.getCourseById(id);
    const { enrolledUserIds, teacherIds, sections, ...courseData } = data;
    const course = await courseRepository.update(id, courseData);

    if (sections && Array.isArray(sections) && sections.length > 0) {
      // Soft-delete existing sections for clean update
      await prisma.courseSection.updateMany({
        where: { courseId: id },
        data: { isActive: false },
      });
      await this.saveCourseSectionsAndContents(id, sections);
    }

    if (teacherIds) {
      await this.assignTeachers(id, teacherIds);
    }

    if (enrolledUserIds && enrolledUserIds.length > 0) {
      const uniqueUserIds = Array.from(new Set(enrolledUserIds));
      for (const uIdStr of uniqueUserIds) {
        try {
          const uId = BigInt(uIdStr);
          await prisma.enrollment.upsert({
            where: {
              userId_courseId: {
                userId: uId,
                courseId: course.id,
              },
            },
            create: {
              userId: uId,
              courseId: course.id,
              status: "IN_PROGRESS",
              progress: 0,
            },
            update: {},
          });
        } catch (e) {
          console.error("Batch enrollment error for user:", uIdStr, e);
        }
      }
    }

    return this.getCourseById(id);
  }

  async assignTeachers(courseId: bigint, teacherIdStrs: string[]) {
    // Delete existing teachers not in list and insert new ones
    const teacherIds = teacherIdStrs.map((s) => BigInt(s));
    
    await prisma.courseTeacher.deleteMany({
      where: {
        courseId,
        teacherId: { notIn: teacherIds },
      },
    });

    for (const tId of teacherIds) {
      await prisma.courseTeacher.upsert({
        where: {
          courseId_teacherId: {
            courseId,
            teacherId: tId,
          },
        },
        create: {
          courseId,
          teacherId: tId,
        },
        update: {},
      });
    }
  }

  async verifyUser(identifier: string) {
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new Error("Username or email is required");
    }

    const account = await prisma.userAccount.findFirst({
      where: {
        OR: [
          { username: { equals: trimmed } },
          { employee: { officialEmail: { equals: trimmed } } },
          { employee: { employeeCode: { equals: trimmed } } },
        ],
      },
      include: {
        employee: true,
      },
    });

    if (!account) {
      throw new Error(`User '${trimmed}' not found in system database.`);
    }

    if (!account.isActive || account.employee.employmentStatus !== "ACTIVE") {
      throw new Error(`User '${trimmed}' account is inactive.`);
    }

    return {
      userId: account.id.toString(),
      username: account.username,
      email: account.employee.officialEmail,
      name: `${account.employee.firstName} ${account.employee.lastName}`,
    };
  }

  async verifyBulkFile(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const identifiers: string[] = [];

    rows.forEach((row) => {
      if (!row || row.length === 0) return;
      const cellVal = String(row[0] || "").trim();
      const lower = cellVal.toLowerCase();
      if (
        cellVal &&
        lower !== "username" &&
        lower !== "email" &&
        lower !== "employee username" &&
        lower !== "user name"
      ) {
        identifiers.push(cellVal);
      }
    });

    if (identifiers.length === 0) {
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);
      jsonRows.forEach((row) => {
        const val =
          row.username || row.Username || row.email || row.Email || row.user || Object.values(row)[0];
        if (val) {
          identifiers.push(String(val).trim());
        }
      });
    }

    const uniqueIdentifiers = Array.from(new Set(identifiers));

    let successCount = 0;
    let failedCount = 0;
    const enrolledUsers: any[] = [];
    const failedUsers: { identifier: string; reason: string }[] = [];

    for (const rawId of uniqueIdentifiers) {
      const identifier = rawId.trim();
      if (!identifier) continue;

      const account = await prisma.userAccount.findFirst({
        where: {
          OR: [
            { username: { equals: identifier } },
            { employee: { officialEmail: { equals: identifier } } },
            { employee: { employeeCode: { equals: identifier } } },
          ],
        },
        include: {
          employee: true,
        },
      });

      if (!account) {
        failedCount++;
        failedUsers.push({
          identifier,
          reason: "User not found in database",
        });
        continue;
      }

      if (!account.isActive || account.employee.employmentStatus !== "ACTIVE") {
        failedCount++;
        failedUsers.push({
          identifier,
          reason: "User account or employment status is inactive",
        });
        continue;
      }

      successCount++;
      enrolledUsers.push({
        userId: account.id.toString(),
        username: account.username,
        email: account.employee.officialEmail,
        name: `${account.employee.firstName} ${account.employee.lastName}`,
      });
    }

    return {
      totalProcessed: uniqueIdentifiers.length,
      successCount,
      failedCount,
      enrolledUsers,
      failedUsers,
    };
  }

  async deleteCourse(id: bigint) {
    await this.getCourseById(id);
    return courseRepository.softDelete(id);
  }

  // Enrollment Operations
  async selfEnrollCourse(userId: bigint, courseId: bigint) {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    let enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment) {
      enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: "IN_PROGRESS",
          progress: 0,
        },
      });
    }

    return enrollment;
  }

  async adminEnrollUser(courseId: bigint, identifier: string) {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new Error("Username or email is required");
    }

    const account = await prisma.userAccount.findFirst({
      where: {
        OR: [
          { username: { equals: trimmed } },
          { employee: { officialEmail: { equals: trimmed } } },
          { employee: { employeeCode: { equals: trimmed } } },
        ],
      },
      include: {
        employee: true,
      },
    });

    if (!account) {
      throw new Error(`User with username or email '${trimmed}' not found in database.`);
    }

    if (!account.isActive || account.employee.employmentStatus !== "ACTIVE") {
      throw new Error(`User '${trimmed}' is inactive in the system.`);
    }

    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: account.id,
          courseId,
        },
      },
    });

    if (existing) {
      return {
        alreadyEnrolled: true,
        user: {
          userId: account.id.toString(),
          username: account.username,
          name: `${account.employee.firstName} ${account.employee.lastName}`,
          email: account.employee.officialEmail,
        },
        message: `User '${account.employee.firstName} ${account.employee.lastName}' (${account.username}) is already enrolled.`,
      };
    }

    const newEnrollment = await prisma.enrollment.create({
      data: {
        userId: account.id,
        courseId,
        status: "IN_PROGRESS",
        progress: 0,
      },
    });

    return {
      alreadyEnrolled: false,
      enrollment: newEnrollment,
      user: {
        userId: account.id.toString(),
        username: account.username,
        name: `${account.employee.firstName} ${account.employee.lastName}`,
        email: account.employee.officialEmail,
      },
      message: `User '${account.employee.firstName} ${account.employee.lastName}' (${account.username}) successfully enrolled.`,
    };
  }

  async bulkEnrollUsers(courseId: bigint, fileBuffer: Buffer) {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const identifiers: string[] = [];

    // Extract identifiers from rows
    rows.forEach((row) => {
      if (!row || row.length === 0) return;
      const cellVal = String(row[0] || "").trim();
      const lower = cellVal.toLowerCase();
      if (
        cellVal &&
        lower !== "username" &&
        lower !== "email" &&
        lower !== "employee username" &&
        lower !== "user name"
      ) {
        identifiers.push(cellVal);
      }
    });

    // Fallback: json parsing if key columns exist
    if (identifiers.length === 0) {
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);
      jsonRows.forEach((row) => {
        const val =
          row.username || row.Username || row.email || row.Email || row.user || Object.values(row)[0];
        if (val) {
          identifiers.push(String(val).trim());
        }
      });
    }

    const uniqueIdentifiers = Array.from(new Set(identifiers));

    let successCount = 0;
    let failedCount = 0;
    const enrolledUsers: any[] = [];
    const failedUsers: { identifier: string; reason: string }[] = [];

    for (const rawId of uniqueIdentifiers) {
      const identifier = rawId.trim();
      if (!identifier) continue;

      const account = await prisma.userAccount.findFirst({
        where: {
          OR: [
            { username: { equals: identifier } },
            { employee: { officialEmail: { equals: identifier } } },
            { employee: { employeeCode: { equals: identifier } } },
          ],
        },
        include: {
          employee: true,
        },
      });

      if (!account) {
        failedCount++;
        failedUsers.push({
          identifier,
          reason: "User not found in database",
        });
        continue;
      }

      if (!account.isActive || account.employee.employmentStatus !== "ACTIVE") {
        failedCount++;
        failedUsers.push({
          identifier,
          reason: "User account or employment status is inactive",
        });
        continue;
      }

      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: account.id,
            courseId,
          },
        },
      });

      if (!existing) {
        await prisma.enrollment.create({
          data: {
            userId: account.id,
            courseId,
            status: "IN_PROGRESS",
            progress: 0,
          },
        });
      }

      successCount++;
      enrolledUsers.push({
        userId: account.id.toString(),
        username: account.username,
        email: account.employee.officialEmail,
        name: `${account.employee.firstName} ${account.employee.lastName}`,
      });
    }

    return {
      totalProcessed: uniqueIdentifiers.length,
      successCount,
      failedCount,
      enrolledUsers,
      failedUsers,
    };
  }

  // Section operations
  async createSection(data: {
    courseId: bigint;
    title: string;
    description?: string;
    sectionOrder: number;
    isPublished?: boolean;
  }) {
    await this.getCourseById(data.courseId);
    return courseRepository.createSection(data);
  }

  async updateSection(
    sectionId: bigint,
    data: {
      title?: string;
      description?: string;
      sectionOrder?: number;
      isPublished?: boolean;
    }
  ) {
    return courseRepository.updateSection(sectionId, data);
  }

  async deleteSection(sectionId: bigint) {
    return courseRepository.deleteSection(sectionId);
  }

  // Content operations
  async createContent(data: {
    sectionId: bigint;
    title: string;
    contentType: string;
    contentUrl?: string;
    description?: string;
    duration?: number;
    contentOrder: number;
    isMandatory?: boolean;
    isPublished?: boolean;
  }) {
    return courseRepository.createContent(data);
  }

  async updateContent(
    contentId: bigint,
    data: {
      title?: string;
      contentType?: string;
      contentUrl?: string;
      description?: string;
      duration?: number;
      contentOrder?: number;
      isMandatory?: boolean;
      isPublished?: boolean;
    }
  ) {
    return courseRepository.updateContent(contentId, data);
  }

  async deleteContent(contentId: bigint) {
    return courseRepository.deleteContent(contentId);
  }
}

export default new CourseService();