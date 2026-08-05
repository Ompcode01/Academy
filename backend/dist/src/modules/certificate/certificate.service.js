"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../config/prisma"));
const prismaSerializer_1 = require("../../utils/prismaSerializer");
class CertificateService {
    async getTemplateByCourseId(courseId) {
        const template = await prisma_1.default.certificateTemplate.findUnique({
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
        return (0, prismaSerializer_1.serializeBigInt)(template);
    }
    async upsertTemplateForCourse(courseId, data) {
        const existing = await prisma_1.default.certificateTemplate.findUnique({
            where: { courseId },
        });
        if (existing) {
            const updated = await prisma_1.default.certificateTemplate.update({
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
            return (0, prismaSerializer_1.serializeBigInt)(updated);
        }
        else {
            const created = await prisma_1.default.certificateTemplate.create({
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
            return (0, prismaSerializer_1.serializeBigInt)(created);
        }
    }
    async issueCertificate(userId, courseId, recipientName, courseTitle) {
        const existing = await prisma_1.default.issuedCertificate.findFirst({
            where: { userId, courseId },
        });
        if (existing) {
            return (0, prismaSerializer_1.serializeBigInt)(existing);
        }
        const template = await this.getTemplateByCourseId(courseId);
        const certificateCode = `HARB-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const issued = await prisma_1.default.issuedCertificate.create({
            data: {
                certificateCode,
                userId,
                courseId,
                recipientName,
                courseTitle,
                templateSnapshot: JSON.stringify(template),
            },
        });
        return (0, prismaSerializer_1.serializeBigInt)(issued);
    }
    async getUserCertificates(userId) {
        const certificates = await prisma_1.default.issuedCertificate.findMany({
            where: { userId },
            orderBy: { issuedAt: "desc" },
        });
        return (0, prismaSerializer_1.serializeBigInt)(certificates);
    }
    async getAllCertificates() {
        const certificates = await prisma_1.default.issuedCertificate.findMany({
            orderBy: { issuedAt: "desc" },
        });
        return (0, prismaSerializer_1.serializeBigInt)(certificates);
    }
    async verifyCertificate(code) {
        const certificate = await prisma_1.default.issuedCertificate.findUnique({
            where: { certificateCode: code },
        });
        if (!certificate)
            return null;
        return (0, prismaSerializer_1.serializeBigInt)(certificate);
    }
}
exports.default = new CertificateService();
