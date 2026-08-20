import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import auditService from "./audit.service";

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { username, departmentName, type, search, page, limit, dateFrom, dateTo, startDate, endDate } = req.query;

    const effectiveDateFrom = (dateFrom || startDate) as string | undefined;
    const effectiveDateTo = (dateTo || endDate) as string | undefined;

    const result = await auditService.getAuditLogs({
      username: username as string,
      departmentName: departmentName as string,
      type: type as string,
      search: search as string,
      dateFrom: effectiveDateFrom,
      dateTo: effectiveDateTo,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Audit log retrieval error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
