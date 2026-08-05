import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import certificateService from "./certificate.service";

export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const courseIdStr = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    if (!courseIdStr) {
      return res.status(400).json({ success: false, message: "Course ID is required" });
    }
    const template = await certificateService.getTemplateByCourseId(BigInt(courseIdStr));
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const courseIdStr = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    if (!courseIdStr) {
      return res.status(400).json({ success: false, message: "Course ID is required" });
    }
    const updated = await certificateService.upsertTemplateForCourse(BigInt(courseIdStr), req.body);
    res.json({ success: true, message: "Certificate template saved", data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
    const { courseId, recipientName, courseTitle } = req.body;

    if (!courseId || !recipientName || !courseTitle) {
      return res.status(400).json({ success: false, message: "courseId, recipientName, and courseTitle are required" });
    }

    const issued = await certificateService.issueCertificate(userId, BigInt(courseId), recipientName, courseTitle);
    res.status(201).json({ success: true, message: "Certificate issued successfully", data: issued });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
    const certificates = await certificateService.getUserCertificates(userId);
    res.json({ success: true, data: certificates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const certificates = await certificateService.getAllCertificates();
    res.json({ success: true, data: certificates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const codeStr = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    if (!codeStr) {
      return res.status(400).json({ success: false, message: "Code parameter is required" });
    }
    const certificate = await certificateService.verifyCertificate(codeStr);
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found or invalid code" });
    }
    res.json({ success: true, data: certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
