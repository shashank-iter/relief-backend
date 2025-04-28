import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getPatientProfile,
  updatePatientProfile,
  updateEmergencyContact,
  deleteEmergencyContact,
  updateMedicalHistory,
  deleteMedicalHistoryItem
} from "../controllers/patient.controller.js"; // I'll explain controller split below

const router = Router();

// Protect all patient routes
router.use(verifyJWT(["patient", "admin"]));

// Profile routes
router.route("/profile").get(getPatientProfile);
router.route("/update-profile").put(updatePatientProfile);

// Emergency contact routes
router.route("/emergency-contacts").post(updateEmergencyContact);
router.route("/emergency-contacts/:contactId").delete(deleteEmergencyContact);

// Medical history routes
router.route("/medical-history/:type").post(updateMedicalHistory);
router.route("/medical-history/:type/:itemId").delete(deleteMedicalHistoryItem);

export default router;
