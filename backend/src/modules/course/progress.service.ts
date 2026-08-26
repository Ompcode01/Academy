import prisma from "../../config/prisma";
import { serialize } from "../../utils/serializer";
import notificationService from "../notification/notification.service";

export class ProgressService {
  async syncLearnerSubmissionsProgress(userId: bigint) {
    try {
      const submissions = await prisma.assessmentSubmission.findMany({
        where: { userId, contentId: { not: null } },
      });

      for (const sub of submissions) {
        if (!sub.contentId) continue;
        try {
          await prisma.userLessonProgress.upsert({
            where: {
              userId_contentId: {
                userId,
                contentId: sub.contentId,
              },
            },
            update: { isCompleted: true },
            create: {
              userId,
              courseId: sub.courseId,
              contentId: sub.contentId,
              isCompleted: true,
            },
          });
        } catch {}
      }

      // Recalculate progress for all enrollments of this user
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
      });

      for (const en of enrollments) {
        const sections = await prisma.courseSection.findMany({
          where: { courseId: en.courseId, isActive: true },
          include: { contents: { where: { isActive: true } } },
        });

        const activeContentIds = sections.flatMap((sec) => sec.contents.map((c) => c.id));
        const totalLessons = activeContentIds.length;
        if (totalLessons === 0) continue;

        const completedCount = await prisma.userLessonProgress.count({
          where: {
            userId,
            courseId: en.courseId,
            isCompleted: true,
            contentId: { in: activeContentIds },
          },
        });

        const wasAlreadyCompleted = en.status === "COMPLETED" || en.completedAt !== null || Number(en.progress) >= 100;
        const calculatedProgress = wasAlreadyCompleted ? 100 : (totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0);
        const isNowCompleted = wasAlreadyCompleted || (totalLessons > 0 && completedCount >= totalLessons);
        const newStatus = isNowCompleted ? "COMPLETED" : "IN_PROGRESS";
        const finalProgress = wasAlreadyCompleted ? 100 : calculatedProgress;

        if (finalProgress !== Number(en.progress) || newStatus !== en.status) {
          await prisma.enrollment.update({
            where: { id: en.id },
            data: {
              progress: finalProgress,
              status: newStatus,
              completedAt: isNowCompleted ? (en.completedAt || new Date()) : null,
            },
          });
        }
      }
    } catch (err) {
      console.error("Failed to sync learner submissions progress:", err);
    }
  }

  async getLearnerCourseProgress(userId: bigint, courseId: bigint) {
    // 0. Auto-sync any quiz, assignment, or feedback submissions to UserLessonProgress
    await this.syncLearnerSubmissionsProgress(userId);

    // 1. Get existing enrollment (Do NOT auto-create)
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    // 2. Get detailed lesson progress records
    const lessonProgressRecords = await prisma.userLessonProgress.findMany({
      where: { userId, courseId },
    });

    const completedLessonIds = lessonProgressRecords
      .filter((l) => l.isCompleted)
      .map((l) => Number(l.contentId));

    const lessonProgressMap: Record<string, any> = {};
    lessonProgressRecords.forEach((lp) => {
      lessonProgressMap[lp.contentId.toString()] = {
        contentId: Number(lp.contentId),
        isCompleted: lp.isCompleted,
        completedAt: lp.completedAt,
        watchedSeconds: lp.watchedSeconds || 0,
        activeLearningSeconds: lp.activeLearningSeconds || 0,
        lastPosition: lp.lastPosition || 0,
        lastActivityAt: lp.lastActivityAt,
      };
    });

    // 3. Get quiz/assessment submissions
    const submissions = await prisma.assessmentSubmission.findMany({
      where: { userId, courseId },
      orderBy: { submittedAt: "desc" },
    });

    // 4. Get issued certificate if exists
    const certificate = await prisma.issuedCertificate.findFirst({
      where: { userId, courseId },
    });

    return serialize({
      enrollment,
      completedLessonIds,
      lessonProgressMap,
      submissions,
      certificate,
    });
  }

  async recordHeartbeat(
    userId: bigint,
    courseId: bigint,
    contentId: bigint,
    deltaActiveSeconds: number = 0,
    deltaWatchedSeconds: number = 0,
    lastPosition: number = 0,
    isPlaying: boolean = true,
    isTabActive: boolean = true
  ) {
    const actualActiveSeconds = isTabActive && isPlaying ? Math.max(0, Math.min(30, deltaActiveSeconds)) : 0;
    const actualWatchedSeconds = isPlaying ? Math.max(0, Math.min(30, deltaWatchedSeconds)) : 0;

    // 1. Get or create UserLessonProgress
    const existingProgress = await prisma.userLessonProgress.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    const currentActive = existingProgress?.activeLearningSeconds || 0;
    const currentWatched = existingProgress?.watchedSeconds || 0;
    const newActive = currentActive + actualActiveSeconds;
    const newWatched = currentWatched + actualWatchedSeconds;

    // Fetch content to determine target duration & auto-completion threshold per content type
    const content = await prisma.learningContent.findUnique({
      where: { id: contentId },
      select: { contentType: true, duration: true, description: true },
    });

    const cType = (content?.contentType || "").toUpperCase();

    // Determine completion threshold in seconds based on content type rules:
    // 1. PPT: 10s per slide/page (e.g. 2 pages = 20s, 5 pages = 50s)
    // 2. PDF: 10s per page (e.g. 1 page = 10s, 3 pages = 30s)
    // 3. Article: 10s active viewing
    // 4. SCORM: 1 min (60s) active viewing OR SCORM JS API completion
    // 5. Udemy / YouTube / External Link: 10s OR on click/launch
    // 6. Quiz / Assignment / Feedback: MUST be explicitly submitted by learner
    let completionThresholdSeconds = 60;
    let requiresExplicitSubmission = false;

    if (
      cType === "QUIZ" ||
      cType === "ASSIGNMENT" ||
      cType === "FEEDBACK" ||
      cType === "FEEDBACK_SURVEY" ||
      cType === "SURVEY"
    ) {
      requiresExplicitSubmission = true;
    } else if (cType === "PPT" || cType === "PPTX") {
      let pageCount = 5;
      if (content?.duration && content.duration > 0) {
        pageCount = Math.max(1, Math.min(30, content.duration));
      } else if (content?.description) {
        try {
          const parsed = JSON.parse(content.description);
          if (Array.isArray(parsed) && parsed.length > 0) {
            pageCount = parsed.length;
          }
        } catch {}
      }
      completionThresholdSeconds = pageCount * 10;
    } else if (cType === "PDF" || cType === "DOCUMENT" || cType === "DOCX" || cType === "DOC") {
      let pageCount = 3;
      if (content?.duration && content.duration > 0) {
        pageCount = Math.max(1, Math.min(30, content.duration));
      }
      completionThresholdSeconds = pageCount * 10;
    } else if (cType === "ARTICLE") {
      completionThresholdSeconds = 10;
    } else if (cType === "SCORM") {
      completionThresholdSeconds = 60;
    } else if (cType === "UDEMY" || cType === "YOUTUBE" || cType === "EXTERNAL_LINK" || cType === "LINK") {
      completionThresholdSeconds = 10;
    } else {
      completionThresholdSeconds = 30;
    }

    let shouldAutoComplete = false;
    if (!requiresExplicitSubmission) {
      shouldAutoComplete = newWatched >= completionThresholdSeconds || newActive >= completionThresholdSeconds;
    }

    const isCompleted = Boolean(existingProgress?.isCompleted) || shouldAutoComplete;
    const completedAt = isCompleted ? existingProgress?.completedAt || new Date() : null;

    const updatedLessonProgress = await prisma.userLessonProgress.upsert({
      where: { userId_contentId: { userId, contentId } },
      update: {
        activeLearningSeconds: newActive,
        watchedSeconds: newWatched,
        lastPosition: lastPosition > 0 ? lastPosition : existingProgress?.lastPosition || 0,
        isCompleted,
        completedAt,
        lastActivityAt: new Date(),
      },
      create: {
        userId,
        courseId,
        contentId,
        activeLearningSeconds: newActive,
        watchedSeconds: newWatched,
        lastPosition: lastPosition > 0 ? lastPosition : 0,
        isCompleted,
        completedAt,
        lastActivityAt: new Date(),
      },
    });

    // 2. Update Enrollment active learning time & progress
    const sections = await prisma.courseSection.findMany({
      where: { courseId, isActive: true },
      include: { contents: { where: { isActive: true } } },
    });
    const activeContentIds = sections.flatMap((sec) => sec.contents.map((c) => c.id));
    const totalLessons = activeContentIds.length;

    const completedCount = await prisma.userLessonProgress.count({
      where: {
        userId,
        courseId,
        isCompleted: true,
        contentId: { in: activeContentIds },
      },
    });

    let enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const wasAlreadyCompleted = enrollment?.status === "COMPLETED" || enrollment?.completedAt !== null || Number(enrollment?.progress || 0) >= 100;
    const calculatedProgress = wasAlreadyCompleted ? 100 : (totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0);
    const isNowCompleted = wasAlreadyCompleted || (totalLessons > 0 && completedCount >= totalLessons);
    const finalProgress = wasAlreadyCompleted ? 100 : calculatedProgress;
    const updatedStatus = isNowCompleted ? "COMPLETED" : "IN_PROGRESS";
    const completedAtDate = isNowCompleted ? enrollment?.completedAt || new Date() : null;

    enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        progress: finalProgress,
        status: updatedStatus,
        completedAt: completedAtDate,
        lastActivityAt: new Date(),
        timeSpentSeconds: { increment: actualActiveSeconds },
      },
      create: {
        userId,
        courseId,
        progress: finalProgress,
        status: updatedStatus,
        completedAt: completedAtDate,
        lastActivityAt: new Date(),
        timeSpentSeconds: actualActiveSeconds,
      },
    });

    let issuedCert = null;
    let autoSkill = null;
    if (isNowCompleted) {
      issuedCert = await this.checkAndIssueCertificate(userId, courseId);
      autoSkill = await this.checkAndCreateSkillCloudEntry(userId, courseId);
    }

    return serialize({
      enrollment,
      calculatedProgress,
      isLessonCompleted: isCompleted,
      shouldAutoComplete,
      watchedSeconds: newWatched,
      activeLearningSeconds: newActive,
      updatedLessonProgress,
      issuedCert,
      autoSkill,
    });
  }

  async markSectionComplete(userId: bigint, courseId: bigint, sectionId: bigint) {
    const contents = await prisma.learningContent.findMany({
      where: { sectionId, isActive: true },
      select: { id: true, duration: true },
    });

    for (const cnt of contents) {
      const contentDuration = cnt.duration && cnt.duration > 0 ? cnt.duration * 60 : 300;
      await prisma.userLessonProgress.upsert({
        where: { userId_contentId: { userId, contentId: cnt.id } },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          activeLearningSeconds: contentDuration,
          watchedSeconds: contentDuration,
          lastActivityAt: new Date(),
        },
        create: {
          userId,
          courseId,
          contentId: cnt.id,
          isCompleted: true,
          completedAt: new Date(),
          activeLearningSeconds: contentDuration,
          watchedSeconds: contentDuration,
          lastActivityAt: new Date(),
        },
      });
    }

    const lastContentId = contents[0]?.id;
    if (lastContentId) {
      return await this.updateLessonProgress(userId, courseId, lastContentId, true, 0);
    }
    return await this.getLearnerCourseProgress(userId, courseId);
  }

  async getMyEnrollments(userId: bigint) {
    // Auto-sync any quiz, assignment, or feedback submissions to UserLessonProgress
    await this.syncLearnerSubmissionsProgress(userId);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        course: {
          isActive: true,
        },
      },
      include: {
        course: {
          include: {
            category: true,
          },
        },
      },
    });
    return serialize(enrollments);
  }

  async updateLessonProgress(
    userId: bigint,
    courseId: bigint,
    contentId: bigint,
    isCompleted: boolean,
    additionalSeconds: number = 0
  ) {
    // 1. Upsert lesson completion
    if (isCompleted) {
      await prisma.userLessonProgress.upsert({
        where: { userId_contentId: { userId, contentId } },
        update: { isCompleted: true, completedAt: new Date() },
        create: { userId, courseId, contentId, isCompleted: true },
      });
    } else {
      await prisma.userLessonProgress.deleteMany({
        where: { userId, contentId },
      });
    }

    // 2. Calculate course total active lessons & completed count
    const sections = await prisma.courseSection.findMany({
      where: { courseId, isActive: true },
      include: {
        contents: {
          where: { isActive: true },
        },
      },
    });

    const activeContentIds = sections.flatMap((sec) => sec.contents.map((c) => c.id));
    const totalLessons = activeContentIds.length;

    const completedCount = await prisma.userLessonProgress.count({
      where: {
        userId,
        courseId,
        isCompleted: true,
        contentId: { in: activeContentIds },
      },
    });

    let enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const wasAlreadyCompleted = enrollment?.status === "COMPLETED" || enrollment?.completedAt !== null || Number(enrollment?.progress || 0) >= 100;
    const calculatedProgress = wasAlreadyCompleted ? 100 : (totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0);
    const isNowCompleted = wasAlreadyCompleted || (totalLessons > 0 && completedCount >= totalLessons);
    const finalProgress = wasAlreadyCompleted ? 100 : calculatedProgress;
    const updatedStatus = isNowCompleted ? "COMPLETED" : "IN_PROGRESS";
    const completedAtDate = isNowCompleted ? (enrollment?.completedAt || new Date()) : null;
    const timeDelta = Math.max(0, additionalSeconds);

    enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        progress: finalProgress,
        status: updatedStatus,
        completedAt: completedAtDate,
        timeSpentSeconds: { increment: timeDelta },
      },
      create: {
        userId,
        courseId,
        progress: finalProgress,
        status: updatedStatus,
        completedAt: completedAtDate,
        timeSpentSeconds: timeDelta,
      },
    });

    // 4. Auto Issue Certificate and Create Skill Cloud Entry if completed
    let issuedCert = null;
    let autoSkill = null;
    if (isNowCompleted) {
      issuedCert = await this.checkAndIssueCertificate(userId, courseId);
      autoSkill = await this.checkAndCreateSkillCloudEntry(userId, courseId);
    }

    return serialize({
      enrollment,
      calculatedProgress,
      issuedCert,
      autoSkill,
    });
  }

  async recordQuizSubmission(
    userId: bigint,
    courseId: bigint,
    contentId: bigint | null,
    score: number,
    maxScore: number,
    answersJson?: string
  ) {
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "F";

    // Remove previous older attempts for this learner and quiz item so only recent attempt is saved
    if (contentId) {
      try {
        await prisma.assessmentSubmission.deleteMany({
          where: { userId, courseId, contentId, submissionType: "QUIZ" },
        });
      } catch (delErr) {
        console.error("Failed to cleanup previous quiz attempts:", delErr);
      }
    }

    const submission = await prisma.assessmentSubmission.create({
      data: {
        userId,
        courseId,
        contentId: contentId ?? null,
        submissionType: "QUIZ",
        answersJson: answersJson || null,
        score,
        maxScore,
        percentage,
        grade,
        attemptNumber: 1,
      },
    });

    // Mark lesson progress as completed for this quiz content item
    let progressResult = null;
    if (contentId) {
      try {
        progressResult = await this.updateLessonProgress(userId, courseId, contentId, true, 0);
      } catch (pErr) {
        console.error("Failed to update lesson progress on quiz submission:", pErr);
      }
    }

    // Check certificate issuance
    const cert = await this.checkAndIssueCertificate(userId, courseId);

    return serialize({ submission, progressResult, cert });
  }

  async checkAndIssueCertificate(userId: bigint, courseId: bigint) {
    // Check template
    const template = await prisma.certificateTemplate.findUnique({
      where: { courseId },
    });

    if (template && !template.enableCertificate) {
      return null;
    }

    // Check existing certificate
    const existing = await prisma.issuedCertificate.findFirst({
      where: { userId, courseId },
    });
    if (existing) return serialize(existing);

    // Get Course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    // Get Employee details
    const emp = await prisma.employee.findUnique({
      where: { id: userId },
    });

    const recipientName = emp ? `${emp.firstName} ${emp.lastName}` : "Learner";
    const courseTitle = course ? course.title : "Course Completion";
    const certCode = `HARB-${new Date().getFullYear()}-X${Math.floor(1000 + Math.random() * 9000)}`;

    const templateSnapshotData = template
      ? {
          ...serialize(template),
          templateId:
            template.templateName === "modern" ||
            template.templateName === "Modern Wave & Ribbon" ||
            template.borderStyle === "MODERN"
              ? "modern"
              : "classic",
        }
      : { templateId: "classic" };

    const createdCert = await prisma.issuedCertificate.create({
      data: {
        certificateCode: certCode,
        userId,
        courseId,
        recipientName,
        courseTitle,
        issuedAt: new Date(),
        templateSnapshot: JSON.stringify(templateSnapshotData),
      },
    });

    return serialize(createdCert);
  }

  async checkAndCreateSkillCloudEntry(userId: bigint, courseId: bigint) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { category: true },
      });
      if (!course) return null;

      const skillName = course.title;
      const categoryName = course.category?.name || "Course Skill";

      // Check if user already has a UserSkill entry for this course skill
      const existingSkill = await prisma.userSkill.findFirst({
        where: {
          userId,
          skillName,
        },
      });

      if (existingSkill) {
        return serialize(existingSkill);
      }

      // Determine Proficiency Level & Star Rating based on Course Level
      const courseLevelUpper = (course.level || "BEGINNER").toUpperCase();
      let proficiencyLevel = "Beginner";
      let rating = 2; // Default 2 stars for beginner

      if (courseLevelUpper.includes("INTERMEDIATE") || courseLevelUpper.includes("MEDIUM")) {
        proficiencyLevel = "Intermediate";
        rating = 3;
      } else if (courseLevelUpper.includes("ADVANCED")) {
        proficiencyLevel = "Advanced";
        rating = 4;
      } else if (courseLevelUpper.includes("EXPERT") || courseLevelUpper.includes("MASTER")) {
        proficiencyLevel = "Expert";
        rating = 5;
      } else {
        proficiencyLevel = "Beginner";
        rating = 2;
      }

      // Create PENDING UserSkill record for Admin / SA Approval
      const userSkill = await prisma.userSkill.create({
        data: {
          userId,
          skillName,
          category: categoryName,
          skillType: "Course Completion Skill",
          proficiencyLevel,
          rating,
          yearsOfExp: 1.0,
          description: `Auto-submitted upon 100% course completion of "${course.title}". Course Level: ${course.level || "Beginner"}.`,
          status: "PENDING",
        },
      });

      // Notify Admin and Super Admin that skill approval is required
      try {
        await notificationService.notifySkillSubmitted({
          id: userSkill.id,
          skillName: userSkill.skillName,
          userId,
        });
      } catch (err) {
        console.error("Failed to send skill notification:", err);
      }

      return serialize(userSkill);
    } catch (err) {
      console.error("Failed to auto-create skill cloud entry on completion:", err);
      return null;
    }
  }

  // Admin / Teacher Progress Reports & Analytics
  async getAdminLearnerProgressMatrix(userContext?: any) {
    let courseWhereClause: any = { isActive: true };

    if (userContext?.role === "TEACHER" || userContext?.role === "INSTRUCTOR") {
      const empId = userContext.employeeId ? BigInt(userContext.employeeId) : undefined;
      const deptId = userContext.departmentId ? BigInt(userContext.departmentId) : undefined;
      courseWhereClause.OR = [
        ...(empId ? [{ creatorId: empId }] : []),
        ...(empId ? [{ teachers: { some: { teacherId: empId } } }] : []),
        ...(deptId ? [{ departmentId: deptId }] : []),
        { departmentId: BigInt(5) },
        { departmentId: null },
      ];
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        course: courseWhereClause,
      },
      orderBy: { createdAt: "desc" },
    });

    const userIds = Array.from(new Set(enrollments.map((e) => e.userId)));
    const courseIds = Array.from(new Set(enrollments.map((e) => e.courseId)));

    const [employees, courses, submissions, certs] = await Promise.all([
      prisma.employee.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true },
      }),
      prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true },
      }),
      prisma.assessmentSubmission.findMany({
        where: { userId: { in: userIds }, courseId: { in: courseIds } },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.issuedCertificate.findMany({
        where: { userId: { in: userIds }, courseId: { in: courseIds } },
      }),
    ]);

    const empMap = new Map(employees.map((e) => [e.id.toString(), e]));
    const courseMap = new Map(courses.map((c) => [c.id.toString(), c]));

    const matrix = enrollments.map((en) => {
      const emp = empMap.get(en.userId.toString());
      const course = courseMap.get(en.courseId.toString());
      const userSubmissions = submissions.filter(
        (s) => s.userId.toString() === en.userId.toString() && s.courseId.toString() === en.courseId.toString()
      );
      const latestSub = userSubmissions[0] || null;
      const cert = certs.find(
        (c) => c.userId.toString() === en.userId.toString() && c.courseId.toString() === en.courseId.toString()
      );

      return {
        id: en.id,
        userId: en.userId,
        courseId: en.courseId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : `User #${en.userId}`,
        employeeCode: emp ? emp.employeeCode : "EMP-NA",
        designation: emp ? emp.designation : "Learner",
        courseTitle: course ? course.title : `Course #${en.courseId}`,
        progress: Number(en.progress),
        status: en.status,
        timeSpentSeconds: en.timeSpentSeconds || 0,
        enrolledAt: en.enrolledAt,
        completedAt: en.completedAt,
        latestScore: latestSub ? latestSub.score : null,
        latestMaxScore: latestSub ? latestSub.maxScore : null,
        latestPercentage: latestSub ? latestSub.percentage : null,
        grade: latestSub ? latestSub.grade : null,
        feedback: latestSub ? latestSub.feedback : null,
        submissionId: latestSub ? latestSub.id : null,
        hasCertificate: Boolean(cert),
        certificateCode: cert ? cert.certificateCode : null,
      };
    });

    return serialize(matrix);
  }

  async recordAssignmentSubmission(
    userId: bigint,
    courseId: bigint,
    contentId: bigint | null,
    submissionText: string,
    fileUrl?: string
  ) {
    const isFeedback = submissionText?.includes('"type":"FEEDBACK"');
    const submissionType = isFeedback ? "FEEDBACK" : "ASSIGNMENT";

    const attemptCount = await prisma.assessmentSubmission.count({
      where: { userId, courseId, contentId: contentId ?? undefined, submissionType },
    });

    const submission = await prisma.assessmentSubmission.create({
      data: {
        userId,
        courseId,
        contentId: contentId ?? null,
        submissionType,
        submissionText,
        fileUrl: fileUrl || null,
        status: isFeedback ? "GRADED" : "SUBMITTED",
        score: isFeedback ? 100 : 0,
        maxScore: 100,
        percentage: isFeedback ? 100 : 0,
        grade: isFeedback ? "COMPLETED" : null,
        feedback: isFeedback ? "Feedback Survey Received" : null,
        attemptNumber: attemptCount + 1,
      },
    });

    // Notify assigned teachers of new assignment submission if it requires grading
    if (!isFeedback) {
      try {
        const emp = await prisma.employee.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
        let contentTitle = "Assignment Task";
        if (contentId) {
          const cnt = await prisma.learningContent.findUnique({ where: { id: contentId }, select: { title: true } });
          if (cnt) contentTitle = cnt.title;
        }
        await notificationService.notifySubmissionCreated({
          learnerId: userId,
          learnerName: emp ? `${emp.firstName} ${emp.lastName}` : "Learner",
          courseId,
          courseTitle: course?.title || "Course",
          contentTitle,
          submissionType: "ASSIGNMENT",
        });
      } catch (err) {
        console.error("Failed to trigger assignment submission notification:", err);
      }
    }

    // Mark lesson progress as completed for this assignment / feedback content item
    if (contentId) {
      try {
        await this.updateLessonProgress(userId, courseId, contentId, true, 0);
      } catch (pErr) {
        console.error("Failed to update lesson progress on assignment submission:", pErr);
      }
    }

    return serialize(submission);
  }

  async getTeacherSubmissions(teacherEmployeeId?: bigint, userRole?: string) {
    let courseIds: bigint[] | undefined = undefined;

    if (userRole === "TEACHER" && teacherEmployeeId) {
      const assigned = await prisma.courseTeacher.findMany({
        where: { teacherId: teacherEmployeeId },
        select: { courseId: true },
      });
      const created = await prisma.course.findMany({
        where: { creatorId: teacherEmployeeId },
        select: { id: true },
      });
      courseIds = Array.from(new Set([...assigned.map((a) => a.courseId), ...created.map((c) => c.id)]));
    }

    const allSubmissions = await prisma.assessmentSubmission.findMany({
      where: {
        ...(courseIds ? { courseId: { in: courseIds } } : {}),
      },
      orderBy: { submittedAt: "desc" },
    });

    // Keep ONLY the latest attempt for each learner per content item so teachers evaluate current work
    const latestSubmissionsMap = new Map<string, typeof allSubmissions[0]>();
    for (const sub of allSubmissions) {
      const key = `${sub.userId.toString()}_${sub.courseId.toString()}_${sub.contentId ? sub.contentId.toString() : sub.submissionType}`;
      if (!latestSubmissionsMap.has(key)) {
        latestSubmissionsMap.set(key, sub);
      }
    }
    const submissions = Array.from(latestSubmissionsMap.values());

    const userIds = Array.from(new Set(submissions.map((s) => s.userId)));
    const cIds = Array.from(new Set(submissions.map((s) => s.courseId)));
    const contentIds = Array.from(new Set(submissions.map((s) => s.contentId).filter(Boolean) as bigint[]));

    const [employees, courses, contents] = await Promise.all([
      prisma.employee.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
      }),
      prisma.course.findMany({
        where: { id: { in: cIds } },
        select: { id: true, title: true },
      }),
      prisma.learningContent.findMany({
        where: { id: { in: contentIds } },
        select: { id: true, title: true, contentType: true },
      }),
    ]);

    const empMap = new Map(employees.map((e) => [e.id.toString(), e]));
    const courseMap = new Map(courses.map((c) => [c.id.toString(), c]));
    const contentMap = new Map(contents.map((cnt) => [cnt.id.toString(), cnt]));

    const result = submissions.map((sub) => {
      const emp = empMap.get(sub.userId.toString());
      const course = courseMap.get(sub.courseId.toString());
      const cnt = sub.contentId ? contentMap.get(sub.contentId.toString()) : null;
      const isFb = sub.submissionType === "FEEDBACK" || sub.submissionText?.includes('"type":"FEEDBACK"');

      return {
        ...sub,
        status: isFb ? "GRADED" : sub.status,
        score: isFb ? (sub.maxScore || 100) : sub.score,
        percentage: isFb ? 100 : sub.percentage,
        grade: isFb ? "COMPLETED" : sub.grade,
        feedback: isFb ? "Survey Completed" : sub.feedback,
        gradedByRole: sub.gradedBy?.includes("[SUPER_ADMIN]") ? "SUPER_ADMIN" : sub.gradedBy?.includes("[ADMIN]") ? "ADMIN" : sub.gradedBy?.includes("[TEACHER]") ? "TEACHER" : null,
        studentName: emp ? `${emp.firstName} ${emp.lastName}` : `User #${sub.userId}`,
        studentCode: emp ? emp.employeeCode : "EMP-NA",
        studentEmail: emp ? emp.officialEmail : "",
        courseTitle: course ? course.title : `Course #${sub.courseId}`,
        contentTitle: cnt ? cnt.title : sub.submissionType === "QUIZ" ? "Quiz Assessment" : "Assignment Task",
      };
    });

    return serialize(result);
  }

  async gradeAssessmentSubmission(
    submissionId: bigint,
    grade: string,
    score: number,
    feedback: string,
    graderName: string,
    status: string = "GRADED",
    userRole?: string
  ) {
    const sub = await prisma.assessmentSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!sub) throw new Error("Assessment submission not found");

    // Permission Enforcement: If previously graded by SUPER_ADMIN, non-SUPER_ADMIN cannot modify
    if (sub.gradedBy?.includes("[SUPER_ADMIN]") && userRole !== "SUPER_ADMIN") {
      throw new Error("Permission Denied: Only Super Admin can modify grades assigned by Super Admin.");
    }

    const maxScore = sub.maxScore || 100;
    const percentage = Math.round((score / maxScore) * 100);
    const formattedGraderName = userRole ? `${graderName} [${userRole}]` : graderName;

    const updated = await prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: status || "GRADED",
        grade: grade || "N/A",
        score,
        percentage,
        feedback: feedback || null,
        gradedBy: formattedGraderName,
        gradedAt: new Date(),
      },
    });

    // Auto-update lesson progress & course completion if graded
    if ((status === "GRADED" || percentage >= 50) && sub.contentId) {
      try {
        await this.updateLessonProgress(sub.userId, sub.courseId, sub.contentId, true, 0);
      } catch (pErr) {
        console.error("Failed to auto-update lesson progress on evaluation:", pErr);
      }
    }

    // Notify learner of evaluation outcome
    const course = await prisma.course.findUnique({ where: { id: sub.courseId } });
    let contentTitle = "Assessment";
    if (sub.contentId) {
      const cnt = await prisma.learningContent.findUnique({ where: { id: sub.contentId } });
      if (cnt) contentTitle = cnt.title;
    }

    notificationService.notifySubmissionEvaluated({
      userId: sub.userId,
      courseId: sub.courseId,
      courseTitle: course?.title || "Course",
      contentTitle,
      teacherName: graderName,
      status: updated.status,
      grade: updated.grade,
      score: updated.score,
      feedback: updated.feedback,
    });

    return serialize(updated);
  }
}

export default new ProgressService();
