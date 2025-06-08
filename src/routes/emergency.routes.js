import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createEmergencyRequest,
  hospitalAcceptEmergencyRequest,
  patientFinalizeEmergencyRequest,
  getHospitalResponsesForPatient,
  getNearbyEmergencyRequestsForHospital,
  getEmergencyRequestsByStatusForHospital,
  getEmergencyRequestsByStatusForPatient,
} from "../controllers/emergency_requests.controller.js";
const router = Router();

// Emergency Routes

//for Patients
router.route("/patient/create_emergency_request").post(verifyJWT(["patient", "admin"]), createEmergencyRequest)
router.route("/patient/get_hospital_responses").get(verifyJWT(["patient", "admin"]), getHospitalResponsesForPatient)
router.route("/patient/finalize_emergency_request/:id").post(verifyJWT(["patient", "admin"]), patientFinalizeEmergencyRequest)
router.route("/patient/get_emergency_requests_by_status").post(verifyJWT(["patient", "admin"]), getEmergencyRequestsByStatusForPatient)

// For Hospitals
router.route("/hospital/accept_emergency_request/:id").post(verifyJWT(["hospital", "admin"]), hospitalAcceptEmergencyRequest)
router.route("/hospital/get_nearby_emergency_requests").get(verifyJWT(["hospital", "admin"]), getNearbyEmergencyRequestsForHospital)
router.route("/hospital/get_emergency_requests_by_status").post(verifyJWT(["hospital", "admin"]), getEmergencyRequestsByStatusForHospital)


export default router;