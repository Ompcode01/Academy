import prisma from "../../config/prisma";
import { serialize } from "../../utils/serializer";

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

    // 2. Calculate course total lessons & completed count
    const sections = await prisma.courseSection.findMany({
      where: { courseId },
      include: { contents: true },
    });
    const totalLessons = sections.reduce((sum, sec) => sum + sec.contents.length, 0);

    const completedCount = await prisma.userLessonProgress.count({
      where: { userId, courseId, isCompleted: true },
    });

    const calculatedProgress = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 100;

    // 3. Update Enrollment
    let enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const isNowCompleted = calculatedProgress >= 100;
    const updatedStatus = isNowCompleted ? "COMPLETED" : "IN_PROGRESS";
    const completedAtDate = isNowCompleted ? (enrollment?.completedAt || new Date()) : null;

    enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        progress: calculatedProgress,
        status: updatedStatus,
        completedAt: completedAtDate,
        timeSpentSeconds: { increment: Math.max(0, additionalSeconds) },
      },
      create: {
        userId,
        courseId,
        progress: calculatedProgress,
        status: updatedStatus,
        completedAt: completedAtDate,
        timeSpentSeconds: Math.max(0, additionalSeconds),
      },
    });

    // 4. Auto Issue Certificate if completed
    let issuedCert = null;
    if (isNowCompleted) {
      issuedCert = await this.checkAndIssueCertificate(userId, courseId);
    }

    return serialize({
      enrollment,
      calculatedProgress,
      issuedCert,
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

    const submissions = await prisma.assessmentSubmission.findMany({
      where: {
        submissionType: "ASSIGNMENT",
        ...(courseIds ? { courseId: { in: courseIds } } : {}),
      },
      orderBy: { submittedAt: "desc" },
    });

    const userIds = Array.from(new Set(submissions.map((s) => s.userId)));
    const cIds = Array.from(new Set(submissions.map((s) => s.courseId)));

    const [employees, courses] = await Promise.all([
      prisma.employee.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
      }),
      prisma.course.findMany({
        where: { id: { in: cIds } },
        select: { id: true, title: true },
      }),
    ]);

    const empMap = new Map(employees.map((e) => [e.id.toString(), e]));
    const courseMap = new Map(courses.map((c) => [c.id.toString(), c]));

    const result = submissions.map((sub) => {
      const emp = empMap.get(sub.userId.toString());
      const course = courseMap.get(sub.courseId.toString());
      return {
        ...sub,
        studentName: emp ? `${emp.firstName} ${emp.lastName}` : `User #${sub.userId}`,
        studentCode: emp ? emp.employeeCode : "EMP-NA",
        studentEmail: emp ? emp.officialEmail : "",
        courseTitle: course ? course.title : `Course #${sub.courseId}`,
      };
    });

    return serialize(result);
  }

  async gradeAssessmentSubmission(
    submissionId: bigint,
    grade: string,
    score: number,
    feedback: string,
    graderName: string
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
        status: "GRADED",
        grade,
        score,
        percentage,
        feedback,
        gradedBy: graderName,
        gradedAt: new Date(),
      },
    });

    return serialize(updated);
  }
}

export default new ProgressService();
