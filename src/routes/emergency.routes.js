import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createEmergencyRequest,
  hospitalAcceptEmergencyRequest,
  patientFinalizeEmergencyRequest,
  getHospitalResponsesForPatient,
  getNearbyEmergencyRequestsForHospital,
  getEmergencyRequestsByStatusForHospital,
  getEmergencyRequestsByStatusForPatient,
  uploadEmergencyRequestPhoto,
  cancelEmergencyRequest,
} from "../controllers/emergency_requests.controller.js";
const router = Router();

// Emergency Routes

//for Patients
router.route("/patient/create_emergency_request").post(verifyJWT(["patient", "admin"]), createEmergencyRequest)
router.route("/patient/get_hospital_responses").get(verifyJWT(["patient", "admin"]), getHospitalResponsesForPatient)
router.route("/patient/finalize_emergency_request/:id").post(verifyJWT(["patient", "admin"]), patientFinalizeEmergencyRequest)
router.route("/patient/get_emergency_requests_by_status").post(verifyJWT(["patient", "admin"]), getEmergencyRequestsByStatusForPatient)
router.route("/patient/upload_emergency_request_photo").post(verifyJWT(["patient", "admin"]),upload.single("file"),uploadEmergencyRequestPhoto)
router.route("/patient/cancel_emergency_request/:id").post(verifyJWT(["patient", "admin"]), cancelEmergencyRequest)

// For Hospitals
router.route("/hospital/accept_emergency_request/:id").post(verifyJWT(["hospital", "admin"]), hospitalAcceptEmergencyRequest)
router.route("/hospital/get_nearby_emergency_requests").get(verifyJWT(["hospital", "admin"]), getNearbyEmergencyRequestsForHospital)
router.route("/hospital/get_emergency_requests_by_status").post(verifyJWT(["hospital", "admin"]), getEmergencyRequestsByStatusForHospital)


export default router;