import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import guestGrantService from "../services/guestGrant.service";

export const getGuestGrants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user.role;
    const employeeId = req.user.employeeId ? BigInt(req.user.employeeId) : undefined;
    const departmentId = req.user.departmentId ? BigInt(req.user.departmentId) : undefined;

    const grants = await guestGrantService.getGrants({
      role: userRole,
      employeeId,
      departmentId,
    });

    res.json({
      success: true,
      data: grants.map((g) => ({
        id: g.id.toString(),
        userId: g.userId?.toString(),
        departmentId: g.departmentId?.toString(),
        scope: g.scope,
        isActive: g.isActive,
        createdAt: g.createdAt,
        user: g.user
          ? {
              id: g.user.id.toString(),
              firstName: g.user.firstName,
              lastName: g.user.lastName,
              employeeCode: g.user.employeeCode,
              officialEmail: g.user.officialEmail,
            }
          : null,
        department: g.department
          ? {
              id: g.department.id.toString(),
              departmentCode: g.department.departmentCode,
              departmentName: g.department.departmentName,
            }
          : null,
        grantedBy: g.grantedBy
          ? {
              id: g.grantedBy.id.toString(),
              firstName: g.grantedBy.firstName,
              lastName: g.grantedBy.lastName,
              officialEmail: g.grantedBy.officialEmail,
            }
          : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch guest grants" });
  }
};

export const createGuestGrant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user.role;
    const grantedById = BigInt(req.user.employeeId);
    const userDeptId = req.user.departmentId ? BigInt(req.user.departmentId) : undefined;

    const { userId, departmentId, scope } = req.body;

    const grant = await guestGrantService.createGrant(
      { userId, departmentId, scope },
      grantedById,
      userRole,
      userDeptId
    );

    res.status(201).json({
      success: true,
      message: "Guest access grant created successfully",
      data: {
        id: grant.id.toString(),
        userId: grant.userId?.toString(),
        departmentId: grant.departmentId?.toString(),
        scope: grant.scope,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to create guest grant" });
  }
};

export const revokeGuestGrant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const grantIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const grantId = BigInt(grantIdStr);
    const userRole = req.user.role;
    const userDeptId = req.user.departmentId ? BigInt(req.user.departmentId) : undefined;

    await guestGrantService.revokeGrant(grantId, userRole, userDeptId);

    res.json({
      success: true,
      message: "Guest access grant revoked successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to revoke guest grant" });
  }
};
