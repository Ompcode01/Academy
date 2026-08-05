import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import auditService from "./audit.service";

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await auditService.getAuditLogs(100);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
