import { Request, Response } from "express";
import * as departmentService from "../services/department.service";

const convertBigInt = (data: any) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

export const createDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentCode, departmentName } = req.body;

    const department = await departmentService.createDepartment({
      departmentCode,
      departmentName,
    });

    res.status(201).json({
      success: true,
      data: convertBigInt(department),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const departments = await departmentService.getDepartments();

    res.status(200).json({
      success: true,
      data: convertBigInt(departments),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};