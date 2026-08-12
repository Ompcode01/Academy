import prisma from "../../config/prisma";
import { serialize } from "../../utils/serializer";
import notificationService from "../notification/notification.service";

export class ProgressService {
  async getLearnerCourseProgress(userId: bigint, courseId: bigint) {
    // 1. Get existing enrollment (Do NOT auto-create)
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    // 2. Get completed lessons
    const completedLessons = await prisma.userLessonProgress.findMany({
      where: { userId, courseId, isCompleted: true },
      select: { contentId: true },
    });
    const completedLessonIds = completedLessons.map((l) => Number(l.contentId));

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
      submissions,
      certificate,
    });
  }

  async getMyEnrollments(userId: bigint) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: {
        courseId: true,
        progress: true,
        status: true,
        completedAt: true,
        timeSpentSeconds: true,
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

    const calculatedProgress = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 100;

    // 3. Update Enrollment using High-Water Mark rule & 100% Permanence
    let enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const currentProgress = Number(enrollment?.progress || 0);
    const currentStatus = enrollment?.status;

    // High-Water Mark: Progress can ONLY increase, never decrease!
    // Once 100% or COMPLETED, lock at 100% permanently.
    const isCompletedBefore = currentStatus === "COMPLETED" || currentProgress >= 100;
    const finalProgress = isCompletedBefore ? 100 : Math.max(currentProgress, calculatedProgress);

    const isNowCompleted = finalProgress >= 100;
    const updatedStatus = isNowCompleted ? "COMPLETED" : (currentStatus || "IN_PROGRESS");
    const completedAtDate = isNowCompleted ? (enrollment?.completedAt || new Date()) : null;

    // Don't accumulate duplicate timeSpentSeconds if course is already completed
    const timeDelta = isCompletedBefore ? 0 : Math.max(0, additionalSeconds);

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

    // Get attempt count
    const attemptCount = await prisma.assessmentSubmission.count({
      where: { userId, courseId, contentId: contentId ?? undefined },
    });

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
        attemptNumber: attemptCount + 1,
      },
    });

    // Check certificate issuance
    const cert = await this.checkAndIssueCertificate(userId, courseId);

    return serialize({ submission, cert });
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

    const createdCert = await prisma.issuedCertificate.create({
      data: {
        certificateCode: certCode,
        userId,
        courseId,
        recipientName,
        courseTitle,
        issuedAt: new Date(),
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

  // Admin Progress Reports & Analytics
  async getAdminLearnerProgressMatrix() {
    const enrollments = await prisma.enrollment.findMany({
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
    const attemptCount = await prisma.assessmentSubmission.count({
      where: { userId, courseId, contentId: contentId ?? undefined, submissionType: "ASSIGNMENT" },
    });

    const submission = await prisma.assessmentSubmission.create({
      data: {
        userId,
        courseId,
        contentId: contentId ?? null,
        submissionType: "ASSIGNMENT",
        submissionText,
        fileUrl: fileUrl || null,
        status: "SUBMITTED",
        score: 0,
        maxScore: 100,
        attemptNumber: attemptCount + 1,
      },
    });

    // Notify assigned teachers of new assignment submission
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
      return {
        ...sub,
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
    status: string = "GRADED"
  ) {
    const sub = await prisma.assessmentSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!sub) throw new Error("Assessment submission not found");

    const maxScore = sub.maxScore || 100;
    const percentage = Math.round((score / maxScore) * 100);

    const updated = await prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: status || "GRADED",
        grade: grade || "N/A",
        score,
        percentage,
        feedback: feedback || null,
        gradedBy: graderName,
        gradedAt: new Date(),
      },
    });

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
