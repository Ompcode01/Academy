import prisma from "../../config/prisma";
import { serializeBigInt } from "../../utils/prismaSerializer";

export interface UpsertCertificateTemplateData {
  courseId?: bigint | null;
  templateName?: string;
  logoUrl?: string | null;
  headerTitle?: string;
  headerSubtitle?: string;
  certifyText?: string;
  completionText?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureUrl?: string | null;
  customDate?: string | null;
  borderStyle?: string;
  primaryColor?: string;
  enableCertificate?: boolean;
  passingThreshold?: number;
}

class CertificateService {
  async getTemplateByCourseId(courseId: bigint) {
    const template = await prisma.certificateTemplate.findUnique({
      where: { courseId },
    });

    if (!template) {
      // Return default template
      return {
        templateName: "Harbinger Classic Gold",
        logoUrl: null,
        headerTitle: "CERTIFICATE",
        headerSubtitle: "OF ACHIEVEMENT",
        certifyText: "This is to certify that",
        completionText: "has successfully completed and passed the course",
        signatoryName: "Richard Wilson",
        signatoryTitle: "Authorized Director",
        signatureUrl: null,
        customDate: null,
        borderStyle: "GOLD_DOUBLE_ORNATE",
        primaryColor: "#d97706",
        enableCertificate: true,
        passingThreshold: 70,
      };
    }

    return serializeBigInt(template);
  }

  async upsertTemplateForCourse(courseId: bigint, data: UpsertCertificateTemplateData) {
    const existing = await prisma.certificateTemplate.findUnique({
      where: { courseId },
    });

    if (existing) {
      const updated = await prisma.certificateTemplate.update({
        where: { courseId },
        data: {
          templateName: data.templateName ?? existing.templateName,
          logoUrl: data.logoUrl !== undefined ? data.logoUrl : existing.logoUrl,
          headerTitle: data.headerTitle ?? existing.headerTitle,
          headerSubtitle: data.headerSubtitle ?? existing.headerSubtitle,
          certifyText: data.certifyText ?? existing.certifyText,
          completionText: data.completionText ?? existing.completionText,
          signatoryName: data.signatoryName ?? existing.signatoryName,
          signatoryTitle: data.signatoryTitle ?? existing.signatoryTitle,
          signatureUrl: data.signatureUrl !== undefined ? data.signatureUrl : existing.signatureUrl,
          customDate: data.customDate !== undefined ? data.customDate : existing.customDate,
          borderStyle: data.borderStyle ?? existing.borderStyle,
          primaryColor: data.primaryColor ?? existing.primaryColor,
          enableCertificate: data.enableCertificate ?? existing.enableCertificate,
          passingThreshold: data.passingThreshold ?? existing.passingThreshold,
        },
      });
      return serializeBigInt(updated);
    } else {
      const created = await prisma.certificateTemplate.create({
        data: {
          courseId,
          templateName: data.templateName || "Harbinger Classic Gold",
          logoUrl: data.logoUrl || null,
          headerTitle: data.headerTitle || "CERTIFICATE",
          headerSubtitle: data.headerSubtitle || "OF ACHIEVEMENT",
          certifyText: data.certifyText || "This is to certify that",
          completionText: data.completionText || "has successfully completed and passed the course",
          signatoryName: data.signatoryName || "Richard Wilson",
          signatoryTitle: data.signatoryTitle || "Authorized Director",
          signatureUrl: data.signatureUrl || null,
          customDate: data.customDate || null,
          borderStyle: data.borderStyle || "GOLD_DOUBLE_ORNATE",
          primaryColor: data.primaryColor || "#d97706",
          enableCertificate: data.enableCertificate ?? true,
          passingThreshold: data.passingThreshold ?? 70,
        },
      });
      return serializeBigInt(created);
    }
  }

  async issueCertificate(userId: bigint, courseId: bigint, recipientName: string, courseTitle: string) {
    const existing = await prisma.issuedCertificate.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      return serializeBigInt(existing);
    }

    const template = await this.getTemplateByCourseId(courseId);
    const certificateCode = `HARB-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const issued = await prisma.issuedCertificate.create({
      data: {
        certificateCode,
        userId,
        courseId,
        recipientName,
        courseTitle,
        templateSnapshot: JSON.stringify(template),
      },
    });

    return serializeBigInt(issued);
  }

  async getUserCertificates(userId: bigint) {
    const certificates = await prisma.issuedCertificate.findMany({
      where: {
        userId,
      },
      orderBy: { issuedAt: "desc" },
    });
    return serializeBigInt(certificates);
  }

  async getCertificatesForUser(userContext: { role: string; employeeId?: bigint; departmentId?: bigint }) {
    const { role, employeeId } = userContext;

    if (role === "GUEST") {
      return [];
    }

    let whereClause: any = {};

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      // Admin and Super Admin show all learner certificates
    } else {
      // Learner and Teacher show only their own certificates
      if (!employeeId) return [];
      whereClause.userId = employeeId;
    }

    const rawCerts = await prisma.issuedCertificate.findMany({
      where: whereClause,
      orderBy: { issuedAt: "desc" },
    });

    const userIds = Array.from(new Set(rawCerts.map((c) => c.userId)));
    const courseIds = Array.from(new Set(rawCerts.map((c) => c.courseId)));

    const [employees, courses] = await Promise.all([
      prisma.employee.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          officialEmail: true,
          department: { select: { id: true, departmentName: true } },
        },
      }),
      prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          title: true,
          department: { select: { id: true, departmentName: true } },
        },
      }),
    ]);

    const empMap = new Map(employees.map((e) => [e.id.toString(), e]));
    const courseMap = new Map(courses.map((c) => [c.id.toString(), c]));

    const certificates = rawCerts.map((cert) => {
      const emp = empMap.get(cert.userId.toString());
      const crs = courseMap.get(cert.courseId.toString());
      return {
        ...cert,
        user: emp || {
          id: cert.userId,
          firstName: cert.recipientName.split(" ")[0] || "Learner",
          lastName: cert.recipientName.split(" ").slice(1).join(" ") || "",
          employeeCode: "EMP-NA",
          officialEmail: "",
          department: null,
        },
        course: crs || {
          id: cert.courseId,
          title: cert.courseTitle,
          department: null,
        },
      };
    });

    return serializeBigInt(certificates);
  }

  async getAllCertificates() {
    const certificates = await prisma.issuedCertificate.findMany({
      orderBy: { issuedAt: "desc" },
    });
    return serializeBigInt(certificates);
  }

  async verifyCertificate(code: string) {
    const certificate = await prisma.issuedCertificate.findUnique({
      where: { certificateCode: code },
    });
    if (!certificate) return null;
    return serializeBigInt(certificate);
  }
}

export default new CertificateService();
