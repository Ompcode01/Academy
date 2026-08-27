import courseRepository from "./course.repository";
import prisma from "../../config/prisma";
import * as XLSX from "xlsx";
import notificationService from "../notification/notification.service";
import guestGrantService from "../../services/guestGrant.service";
import { calculateContentDuration, formatRoundedDuration } from "../../utils/durationCalculator";

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
    const scopeWhere = await this.buildScopeFilter(userContext);
    const result = await courseRepository.findAll(filters, scopeWhere);

    // Enrich courses with creatorInfo for Guest/Learner/Admin UI
    const enrichedCourses = result.courses.map((course: any) => {
      const creatorRoles = course.creator?.assignedRoles?.map((r: any) => r.role?.roleCode) || [];
      const creatorRole = creatorRoles.includes("SUPER_ADMIN")
        ? "SUPER_ADMIN"
        : creatorRoles.includes("ADMIN")
        ? "ADMIN"
        : "TEACHER";

      const creatorName = course.creator
        ? `${course.creator.firstName} ${course.creator.lastName}`
        : "System Administrator";

      const creatorDepartment = course.department?.departmentName || course.creator?.department?.departmentName || "Global Organization";

      return {
        ...course,
        creatorInfo: {
          creatorRole,
          creatorName,
          creatorDepartment,
        },
      };
    });

    return {
      ...result,
      courses: enrichedCourses,
    };
  }

  /**
   * Build Prisma where-clause additions based on the user's role:
   * - SUPER_ADMIN: all courses (no extra filter)
   * - ADMIN: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
   * - TEACHER: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
   * - LEARNER: PUBLISHED courses in their department OR created by SUPER_ADMIN / ADMIN OR global published courses
   * - GUEST: only PUBLISHED courses permitted by GuestAccessGrant
   */
  private async buildScopeFilter(userContext?: UserContext): Promise<any> {
    if (!userContext) return {};

    const { role, employeeId, departmentId } = userContext;

    switch (role) {
      case "SUPER_ADMIN":
        return {}; // Super Admin sees all courses across all departments

      case "ADMIN":
        return {
          OR: [
            { departmentId: null },
            { departmentId: BigInt(5) },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ creatorId: employeeId }] : []),
            ...(employeeId ? [{ teachers: { some: { teacherId: employeeId } } }] : []),
          ],
        };

      case "TEACHER":
        return {
          OR: [
            { departmentId: null },
            { departmentId: BigInt(5) },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ teachers: { some: { teacherId: employeeId } } }] : []),
            ...(employeeId ? [{ creatorId: employeeId }] : []),
          ],
        };

      case "LEARNER":
        return {
          status: "PUBLISHED",
          OR: [
            { departmentId: null },
            { departmentId: BigInt(5) },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ enrollments: { some: { userId: employeeId } } }] : []),
          ],
        };

      case "GUEST": {
        const { isGlobal, departmentIds } = await guestGrantService.getGuestPermittedDepartmentIds(employeeId);
        if (isGlobal) {
          return { status: "PUBLISHED" };
        }
        return {
          status: "PUBLISHED",
          OR: [
            { departmentId: null },
            { departmentId: BigInt(5) },
            ...(departmentIds.length > 0 ? [{ departmentId: { in: departmentIds } }] : []),
          ],
        };
      }

      default:
        return { status: "PUBLISHED" };
    }
  }

  async getCourseById(id: bigint, userContext?: UserContext) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new Error("Course not found");
    }

    // Determine creator role & info
    const creatorRoles = (course as any).creator?.assignedRoles?.map((r: any) => r.role?.roleCode) || [];
    const creatorRole = creatorRoles.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : creatorRoles.includes("ADMIN")
      ? "ADMIN"
      : "TEACHER";

    const creatorName = (course as any).creator
      ? `${(course as any).creator.firstName} ${(course as any).creator.lastName}`
      : "System Administrator";

    const creatorDepartment = (course as any).department
      ? (course as any).department.departmentName
      : (course as any).creator?.department?.departmentName || "Global Organization";

    const creatorInfo = {
      creatorRole,
      creatorName,
      creatorDepartment,
    };

    // If user is GUEST, enforce scope & sanitize sensitive content URLs & assessment payloads
    if (userContext?.role === "GUEST") {
      if (course.status !== "PUBLISHED") {
        throw new Error("Course is not available in Guest Preview mode.");
      }

      // Check Guest grant permission
      const { isGlobal, departmentIds } = await guestGrantService.getGuestPermittedDepartmentIds(userContext.employeeId);
      if (!isGlobal) {
        const courseDeptId = course.departmentId;
        const isPermittedDept = courseDeptId ? departmentIds.some((d) => d.toString() === courseDeptId.toString()) : true;
        if (!isPermittedDept) {
          throw new Error("Access Denied: Guest access permission not granted for this department's courses.");
        }
      }

      // Sanitize learning content items to prevent payload exposure
      const sanitizedSections = (course.sections || []).map((sec: any) => ({
        ...sec,
        contents: (sec.contents || []).map((cnt: any) => ({
          ...cnt,
          contentUrl: null,
          quizConfigJson: null,
          assignmentConfigJson: null,
          metaData: null,
          fileSize: null,
          isLockedForGuest: true,
        })),
      }));

      return {
        ...course,
        sections: sanitizedSections,
        creatorInfo,
        isGuestPreview: true,
      };
    }

    return {
      ...course,
      creatorInfo,
    };
  }

  async createCourse(data: {
    categoryId: bigint;
    creatorId: bigint;
    departmentId?: bigint | null;
    title: string;
    shortName?: string | null;
    courseCode?: string | null;
    shortDescription?: string;
    description?: string;
    thumbnail?: string;
    duration?: number;
    level?: string;
    language?: string;
    status?: string;
    draftStep?: number | null;
    enrollmentType?: string;
    enrolledUserIds?: string[];
    teacherIds?: string[];
    sections?: any[];
  }) {
    const isDraft = String(data.status || "").toUpperCase() === "DRAFT";
    const { teacherIds, enrolledUserIds, sections, ...createFields } = data;

    if (createFields.courseCode) {
      createFields.courseCode = createFields.courseCode.trim().toUpperCase();
      const existingWithCode = await prisma.course.findFirst({
        where: { courseCode: createFields.courseCode },
      });
      if (existingWithCode) {
        // If code conflict, append a unique suffix
        createFields.courseCode = `${createFields.courseCode}-${Date.now().toString().slice(-3)}`;
      }
    }

    const course = await courseRepository.create(createFields);

    if (sections && Array.isArray(sections) && sections.length > 0) {
      await this.saveCourseSectionsAndContents(course.id, sections, undefined, isDraft);
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

    // Trigger course creation and enrollment notifications. A draft is not yet
    // visible to anyone, so it is announced only once it is actually published.
    if (!isDraft) {
      notificationService.notifyCourseCreated({
        id: course.id,
        title: course.title,
        departmentId: course.departmentId,
        creatorId: course.creatorId,
      });
    }

    return this.getCourseById(course.id);
  }

  /**
   * Look up a category to hang an unfinished draft on when the author never got
   * as far as choosing one. Courses require a category at the database level,
   * so a draft needs something to point at.
   */
  async getFallbackCategoryId(): Promise<bigint | null> {
    const category = await prisma.category.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    return category?.id ?? null;
  }

  async saveCourseSectionsAndContents(
    courseId: bigint,
    sections: any[],
    existingSections?: any[],
    isDraft = false
  ) {
    if (!sections || !Array.isArray(sections) || sections.length === 0) return;

    // Build lookup map of existing content item configs by title to preserve legacy data if needed
    const existingContentMap = new Map<string, any>();
    if (existingSections && Array.isArray(existingSections)) {
      existingSections.forEach((sec: any) => {
        (sec.contents || []).forEach((cnt: any) => {
          if (cnt.title) {
            existingContentMap.set(cnt.title.trim().toLowerCase(), cnt);
          }
        });
      });
    }

    let courseTotalExactSecs = 0;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const secData = sections[sIdx];
      const sectionTitle = secData.title || `Module ${sIdx + 1}`;
      const targetSecMins = secData.targetDurationMinutes || secData.targetDuration || (secData.durationHours ? secData.durationHours * 60 : null);

      const section = await prisma.courseSection.create({
        data: {
          courseId,
          title: sectionTitle,
          description: secData.description || null,
          sectionOrder: secData.sectionOrder || sIdx + 1,
          targetDurationMinutes: targetSecMins ? Number(targetSecMins) : null,
          isPublished: !isDraft,
        },
      });

      const contentsList: any[] = (secData.contents && Array.isArray(secData.contents)) ? secData.contents : [];
      let sectionExactSecs = 0;

      // Pass 1: Partition into non-Udemy and Udemy contents
      const nonUdemyContents: any[] = [];
      const udemyContents: any[] = [];
      for (const cnt of contentsList) {
        const cType = (cnt.contentType || "LESSON").toUpperCase().trim();
        if (cType === "UDEMY" || cType === "EXTERNAL") {
          udemyContents.push(cnt);
        } else {
          nonUdemyContents.push(cnt);
        }
      }

      let otherContentsSumSeconds = 0;
      const contentsToInsert: any[] = [];

      for (let cIdx = 0; cIdx < nonUdemyContents.length; cIdx++) {
        const cntData = nonUdemyContents[cIdx];
        const cntTitleKey = (cntData.title || "").trim().toLowerCase();
        const existingCnt = existingContentMap.get(cntTitleKey);

        // 1. Resolve quizConfigJson
        let quizJson: string | null = null;
        if (typeof cntData.quizConfigJson === "object" && cntData.quizConfigJson !== null) {
          quizJson = JSON.stringify(cntData.quizConfigJson);
        } else if (typeof cntData.quizConfigJson === "string" && cntData.quizConfigJson.trim() !== "") {
          quizJson = cntData.quizConfigJson.trim();
        } else if (typeof cntData.feedbackConfigJson === "object" && cntData.feedbackConfigJson !== null) {
          quizJson = JSON.stringify(cntData.feedbackConfigJson);
        } else if (typeof cntData.feedbackConfigJson === "string" && cntData.feedbackConfigJson.trim() !== "") {
          quizJson = cntData.feedbackConfigJson.trim();
        } else if (typeof cntData.feedbackConfig === "object" && cntData.feedbackConfig !== null) {
          quizJson = JSON.stringify(cntData.feedbackConfig);
        } else if (typeof cntData.quizConfig === "object" && cntData.quizConfig !== null) {
          quizJson = JSON.stringify(cntData.quizConfig);
        } else if (cntData.questions && Array.isArray(cntData.questions) && cntData.questions.length > 0) {
          quizJson = JSON.stringify({
            title: cntData.title || "Quiz Assessment",
            questions: cntData.questions,
            totalMarks: cntData.maxMarks || cntData.totalMarks || 100,
            durationMinutes: cntData.duration || 15,
            passingPercentage: cntData.passingPercentage || 70,
          });
        } else if (existingCnt && existingCnt.quizConfigJson) {
          quizJson = typeof existingCnt.quizConfigJson === "string" ? existingCnt.quizConfigJson : JSON.stringify(existingCnt.quizConfigJson);
        }

        // 2. Resolve assignmentConfigJson
        let assignmentJson: string | null = null;
        if (typeof cntData.assignmentConfigJson === "object" && cntData.assignmentConfigJson !== null) {
          assignmentJson = JSON.stringify(cntData.assignmentConfigJson);
        } else if (typeof cntData.assignmentConfigJson === "string" && cntData.assignmentConfigJson.trim() !== "") {
          assignmentJson = cntData.assignmentConfigJson.trim();
        } else if (typeof cntData.assignmentConfig === "object" && cntData.assignmentConfig !== null) {
          assignmentJson = JSON.stringify(cntData.assignmentConfig);
        } else if (existingCnt && existingCnt.assignmentConfigJson) {
          assignmentJson = typeof existingCnt.assignmentConfigJson === "string" ? existingCnt.assignmentConfigJson : JSON.stringify(existingCnt.assignmentConfigJson);
        } else if (cntData.contentType === "ASSIGNMENT") {
          assignmentJson = JSON.stringify({
            title: cntData.title || "Practical Assignment",
            instructions: cntData.description || cntData.instructions || "Complete practical assignment.",
            maxMarks: cntData.maxMarks || cntData.maxScore || 100,
            deadline: cntData.deadline || cntData.dueDate || "",
            allowedFileTypes: cntData.allowedFileTypes || ["PDF", "DOC", "DOCX", "ZIP"],
          });
        }

        let customDurationMins = cntData.duration || cntData.durationMinutes || null;
        if (!customDurationMins && assignmentJson) {
          try {
            const p = JSON.parse(assignmentJson);
            if (p && (p.durationMinutes || p.duration)) {
              customDurationMins = Number(p.durationMinutes || p.duration);
            }
          } catch (_) {}
        }

        const calcRes = calculateContentDuration({
          contentType: cntData.contentType || "LESSON",
          contentUrl: cntData.contentUrl || cntData.videoUrl || null,
          description: cntData.description || cntData.instructions || null,
          durationMinutes: customDurationMins,
          pageCount: cntData.pageCount || cntData.pages || null,
          slideCount: cntData.slideCount || cntData.slides || null,
          wordCount: cntData.wordCount || cntData.words || null,
          questions: cntData.questions || null,
          quizConfigJson: quizJson,
          assignmentConfigJson: assignmentJson,
        });

        otherContentsSumSeconds += calcRes.exactDurationSeconds;

        contentsToInsert.push({
          sectionId: section.id,
          title: cntData.title || `Content ${cIdx + 1}`,
          contentType: cntData.contentType || "LESSON",
          contentUrl: cntData.contentUrl || cntData.videoUrl || null,
          description: cntData.description || cntData.instructions || null,
          duration: calcRes.durationMinutes,
          exactDurationSeconds: calcRes.exactDurationSeconds,
          durationSource: calcRes.durationSource,
          durationMetadata: JSON.stringify(calcRes.metadata),
          contentOrder: cntData.contentOrder || cIdx + 1,
          isMandatory: true,
          isPublished: !isDraft,
          quizConfigJson: quizJson,
          assignmentConfigJson: assignmentJson,
        });
      }

      // Pass 2: Calculate Udemy contents with provisional time allocation
      for (let cIdx = 0; cIdx < udemyContents.length; cIdx++) {
        const cntData = udemyContents[cIdx];
        const calcRes = calculateContentDuration({
          contentType: cntData.contentType || "UDEMY",
          contentUrl: cntData.contentUrl || cntData.videoUrl || null,
          description: cntData.description || cntData.instructions || null,
          durationMinutes: cntData.duration || cntData.durationMinutes || null,
          targetSectionMinutes: targetSecMins ? Number(targetSecMins) : 60,
          otherContentsSumSeconds,
        });

        if (calcRes.blocked) {
          throw new Error(calcRes.blockReason || "Target section duration exceeded. Cannot allocate time for Udemy content.");
        }

        contentsToInsert.push({
          sectionId: section.id,
          title: cntData.title || `Udemy Content`,
          contentType: cntData.contentType || "UDEMY",
          contentUrl: cntData.contentUrl || cntData.videoUrl || null,
          description: cntData.description || cntData.instructions || null,
          duration: calcRes.durationMinutes,
          exactDurationSeconds: calcRes.exactDurationSeconds,
          durationSource: calcRes.durationSource,
          durationMetadata: JSON.stringify({ ...calcRes.metadata, warning: calcRes.warning }),
          contentOrder: cntData.contentOrder || nonUdemyContents.length + cIdx + 1,
          isMandatory: true,
          isPublished: !isDraft,
          quizConfigJson: null,
          assignmentConfigJson: null,
        });
      }

      for (const itemData of contentsToInsert) {
        await prisma.learningContent.create({ data: itemData });
        sectionExactSecs += itemData.exactDurationSeconds;
      }

      await prisma.courseSection.update({
        where: { id: section.id },
        data: { exactDurationSeconds: sectionExactSecs },
      });

      courseTotalExactSecs += sectionExactSecs;
    }

    const rounded = formatRoundedDuration(courseTotalExactSecs);
    await prisma.course.update({
      where: { id: courseId },
      data: {
        exactDurationSeconds: courseTotalExactSecs,
        duration: rounded.roundedHours,
      },
    });
  }

  async updateCourse(
    id: bigint,
    data: {
      categoryId?: bigint;
      departmentId?: bigint | null;
      title?: string;
      shortName?: string | null;
      courseCode?: string | null;
      shortDescription?: string;
      description?: string;
      thumbnail?: string;
      duration?: number;
      level?: string;
      language?: string;
      status?: string;
      draftStep?: number | null;
      enrollmentType?: string;
      enrolledUserIds?: string[];
      teacherIds?: string[];
      sections?: any[];
    },
    userContext?: { role?: string; employeeId?: bigint; username?: string }
  ) {
    const isDraft = String(data.status || "").toUpperCase() === "DRAFT";
    const existing = await this.getCourseById(id);

    if (data.courseCode) {
      data.courseCode = data.courseCode.trim().toUpperCase();
      const existingWithCode = await prisma.course.findFirst({
        where: {
          courseCode: data.courseCode,
          id: { not: id },
        },
      });
      if (existingWithCode) {
        // Append suffix if conflict with another course
        data.courseCode = `${data.courseCode}-${Date.now().toString().slice(-3)}`;
      }
    }
    const existingSections = (existing as any)?.sections || [];

    // Rule 11 & Teacher Assignment Guard: Teachers can ONLY edit assigned or created courses
    if (userContext?.role === "TEACHER") {
      const teacherEmpId = userContext.employeeId ? BigInt(userContext.employeeId) : null;
      const isCreator = existing?.creatorId && teacherEmpId ? existing.creatorId === teacherEmpId : false;
      const isAssignedTeacher = (existing?.teachers || []).some(
        (t: any) => (t.teacherId ? BigInt(t.teacherId) === teacherEmpId : BigInt(t.teacher?.id || t.id) === teacherEmpId)
      );

      if (!isCreator && !isAssignedTeacher) {
        throw new Error("Forbidden: You can only edit courses assigned to you as a teacher.");
      }

      delete data.departmentId;
      delete data.enrolledUserIds;
      delete data.teacherIds;
      delete data.enrollmentType;
    }

    const { enrolledUserIds, teacherIds, sections, ...courseData } = data;
    const course = await courseRepository.update(id, courseData);

    // A draft is a mirror of the builder's current state, so an empty array is a
    // meaningful instruction ("the author deleted every module") and must clear
    // the stored sections. For a published save an empty array is treated as
    // "nothing to change", preserving the existing curriculum.
    if (Array.isArray(sections) && (sections.length > 0 || isDraft)) {
      // Soft-delete existing sections for clean update
      await prisma.courseSection.updateMany({
        where: { courseId: id },
        data: { isActive: false },
      });
      await this.saveCourseSectionsAndContents(id, sections, existingSections, isDraft);
    } else if (!isDraft) {
      // Publishing without resending the curriculum: bring any sections and
      // contents that were written while this was a draft live with the course.
      await prisma.courseSection.updateMany({
        where: { courseId: id, isActive: true, isPublished: false },
        data: { isPublished: true },
      });
      await prisma.learningContent.updateMany({
        where: { section: { courseId: id, isActive: true }, isPublished: false },
        data: { isPublished: true },
      });
    }

    if (teacherIds && userContext?.role !== "TEACHER") {
      await this.assignTeachers(id, teacherIds);
    }

    if (enrolledUserIds && enrolledUserIds.length > 0 && userContext?.role !== "TEACHER") {
      const uniqueUserIds = Array.from(new Set(enrolledUserIds));
      for (const uIdStr of uniqueUserIds) {
        try {
          const uId = BigInt(uIdStr);
          const isNew = !(await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: uId, courseId: course.id } } }));
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

          if (isNew) {
            notificationService.notifyEnrollment({
              userId: uId,
              courseId: course.id,
              courseTitle: course.title,
              enrolledBy: userContext?.username || "Administrator",
            });
            notificationService.syncLearnerCalendarEventsOnEnrollment(uId, course.id);
          }
        } catch (e) {
          console.error("Batch enrollment error for user:", uIdStr, e);
        }
      }
    }

    // Rule 7, 8, 13: Notify enrolled learners & creators/admins about content
    // updates. Autosaving an unfinished draft is not a content update anyone
    // should be paged about, so drafts are skipped.
    if (!isDraft) {
      const updaterName = userContext?.username || "Instructor";
      const updaterRole = userContext?.role || "TEACHER";
      notificationService.notifyCourseUpdated({
        courseId: id,
        courseTitle: course.title,
        updaterName,
        updaterRole,
        addedOrUpdatedTitle: data.title || "Curriculum & Lessons",
        contentType: "Course Update",
      });
    }

    return this.getCourseById(id);
  }

  async deleteCourse(id: bigint) {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Course not found or already deleted");
    }

    // Soft-delete / Archive course instead of destructive permanent deletion.
    // Preserves all student enrollments, certificates, assessment submissions, and progress history.
    await prisma.$transaction([
      prisma.courseSection.updateMany({ where: { courseId: id }, data: { isActive: false } }),
      prisma.course.update({ where: { id }, data: { status: "ARCHIVED", isActive: false } }),
    ]);

    return { id: id.toString(), deleted: true, archived: true };
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

    // Notify assigned teachers
    const cObj = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
    if (cObj && teacherIds.length > 0) {
      notificationService.notifyTeacherAssigned({
        courseId,
        courseTitle: cObj.title,
        teacherIds,
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

  // Enrollment Operations
  async selfEnrollCourse(userId: bigint, courseId: bigint) {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.enrollmentType === "ADMIN_ASSIGNED" || course.enrollmentType === "MANUAL") {
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!existing) {
        throw new Error("Self-enrollment is restricted for this course. Access must be assigned by an Administrator.");
      }
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

  async getCourseLearnersProgress(
    courseId: bigint,
    userContext?: { role?: string; employeeId?: bigint }
  ) {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (userContext?.role === "TEACHER") {
      const teacherEmpId = userContext.employeeId ? BigInt(userContext.employeeId) : null;
      const isCreator = course.creatorId && teacherEmpId ? course.creatorId === teacherEmpId : false;
      const isAssignedTeacher = (course.teachers || []).some(
        (t: any) => (t.teacherId ? BigInt(t.teacherId) === teacherEmpId : BigInt(t.teacher?.id || t.id) === teacherEmpId)
      );

      if (!isCreator && !isAssignedTeacher) {
        throw new Error("Forbidden: You can only view analytics for courses assigned to you as a teacher.");
      }
    }

    const contents: any[] = [];
    (course.sections || []).forEach((sec: any) => {
      (sec.contents || []).forEach((cnt: any) => {
        contents.push({
          id: cnt.id,
          title: cnt.title,
          contentType: cnt.contentType,
          sectionTitle: sec.title,
        });
      });
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          include: {
            department: true,
            userAccount: {
              select: { lastLogin: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    const result = await Promise.all(
      enrollments.map(async (en) => {
        const uId = en.userId;
        const [lessonProgresses, submissions] = await Promise.all([
          prisma.userLessonProgress.findMany({
            where: { courseId, userId: uId },
          }),
          prisma.assessmentSubmission.findMany({
            where: { courseId, userId: uId },
            orderBy: { submittedAt: "desc" },
          }),
        ]);

        const completedLessonsCount = lessonProgresses.filter((lp) => lp.isCompleted).length;
        const totalActiveSec = lessonProgresses.reduce(
          (acc, curr) => acc + (curr.activeLearningSeconds || curr.watchedSeconds || 0),
          0
        );

        const activeSec = Math.max(totalActiveSec, en.timeSpentSeconds || 0);
        const hours = Math.floor(activeSec / 3600);
        const minutes = Math.floor((activeSec % 3600) / 60);
        const seconds = activeSec % 60;
        const formattedTimeSpent =
          hours > 0
            ? `${hours}h ${minutes}m ${seconds}s`
            : minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`;

        const lastActivityDate = lessonProgresses
          .map((lp) => lp.lastActivityAt)
          .concat([en.lastActivityAt as any])
          .filter(Boolean)
          .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())[0];

        return {
          employeeId: Number(en.user.id),
          employeeCode: en.user.employeeCode,
          firstName: en.user.firstName,
          lastName: en.user.lastName,
          officialEmail: en.user.officialEmail,
          designation: en.user.designation,
          departmentName: en.user.department?.departmentName || "Engineering",
          profileImage: en.user.profileImage,
          enrolledAt: en.enrolledAt,
          progress: Number(en.progress || 0),
          status: en.status || "IN_PROGRESS",
          completedAt: en.completedAt,
          timeSpentSeconds: activeSec,
          formattedTimeSpent,
          completedLessonsCount,
          totalLessonsCount: contents.length,
          lastActivityAt: lastActivityDate || en.user.userAccount?.lastLogin || en.enrolledAt,
          lessonsProgress: contents.map((cnt) => {
            const lp = lessonProgresses.find((p) => String(p.contentId) === String(cnt.id));
            return {
              contentId: Number(cnt.id),
              title: cnt.title,
              contentType: cnt.contentType || "LESSON",
              sectionTitle: cnt.sectionTitle || "Module",
              isCompleted: lp ? Boolean(lp.isCompleted) : false,
              completedAt: lp?.completedAt || undefined,
              activeLearningSeconds: lp ? (lp.activeLearningSeconds || lp.watchedSeconds || 0) : 0,
              lastPosition: lp?.lastPosition || 0,
            };
          }),
          submissions: submissions.map((sub) => ({
            id: Number(sub.id),
            submissionType: sub.submissionType,
            status: sub.status,
            score: sub.score,
            maxScore: sub.maxScore,
            percentage: sub.percentage,
            submittedAt: sub.submittedAt,
            feedbackNotes: sub.feedback,
            gradedBy: sub.gradedBy,
          })),
        };
      })
    );

    return result;
  }
}

export default new CourseService();