import api from "./auth.service";

export interface CertificateTemplateData {
  id?: number;
  courseId?: number | null;
  templateId?: string;
  templateName: string;
  logoUrl?: string | null;
  headerTitle: string;
  headerSubtitle: string;
  certifyText: string;
  completionText: string;
  signatoryName: string;
  signatoryTitle: string;
  signatureUrl?: string | null;
  customDate?: string | null;
  borderStyle: string;
  primaryColor: string;
  enableCertificate: boolean;
  passingThreshold: number;
}

export interface IssuedCertificateData {
  id: number;
  certificateCode: string;
  userId: number;
  courseId: number;
  issuedAt: string;
  recipientName: string;
  departmentName?: string;
  courseTitle: string;
  templateSnapshot?: string;
}

export const getCertificateTemplate = async (courseId: number): Promise<CertificateTemplateData> => {
  const response = await api.get(`/certificates/template/${courseId}`);
  return response.data.data;
};

export const saveCertificateTemplate = async (courseId: number, data: Partial<CertificateTemplateData>): Promise<CertificateTemplateData> => {
  const response = await api.put(`/certificates/template/${courseId}`, data);
  return response.data.data;
};

export const issueCertificate = async (data: { courseId: number; recipientName: string; courseTitle: string }): Promise<IssuedCertificateData> => {
  const response = await api.post("/certificates/issue", data);
  return response.data.data;
};

export const getMyCertificates = async (): Promise<IssuedCertificateData[]> => {
  const response = await api.get("/certificates/my-certificates");
  return response.data.data;
};

export const getAllCertificates = async (): Promise<IssuedCertificateData[]> => {
  const response = await api.get("/certificates/all");
  return response.data.data;
};

export const verifyCertificateCode = async (code: string): Promise<IssuedCertificateData> => {
  const response = await api.get(`/certificates/verify/${code}`);
  return response.data.data;
};
