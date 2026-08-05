import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getTemplate,
  upsertTemplate,
  issueCertificate,
  getMyCertificates,
  getAllCertificates,
  verifyCertificate,
} from "../modules/certificate/certificate.controller";

const router = Router();

// Templates
router.get("/template/:courseId", getTemplate);
router.put("/template/:courseId", authenticate, upsertTemplate);

// Certificate Operations
router.post("/issue", authenticate, issueCertificate);
router.get("/my-certificates", authenticate, getMyCertificates);
router.get("/all", authenticate, getAllCertificates);
router.get("/verify/:code", verifyCertificate);

export default router;
