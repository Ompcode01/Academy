import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lms_super_secret_key_2026";

export interface JwtPayload {
  userId: string;
  employeeId: string;
  username: string;
  role: string;
  departmentId: string;
}

export const generateToken = (
  payload: JwtPayload
): string => {

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1d",
  });

};

export const verifyToken = (
  token: string
): JwtPayload => {

  return jwt.verify(token, JWT_SECRET) as JwtPayload;

};