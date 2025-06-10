import { HospitalProfile } from "../models/hospital_models/hospital.model.js";
import { PatientProfile } from "../models/patient_models/patient.model.js";
import EmergencyRequest from "../models/emergency_requests_models/emergencyrequest.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const getAdminDashboardData = asyncHandler(async (req, res) => {
  try {
    const totalHospitals = await HospitalProfile.countDocuments();
    const hospitals = await HospitalProfile.find()
      .populate("owner", "-password -__v")
      .populate("bedData")
      .populate("bloodData")
      .populate("address");

    // 2. Users
    const totalUsers = await User.countDocuments();
    const users = await User.find()
      .select("-password -__v")
      .populate({
        path: "patientProfile",
        populate: [
          {
            path: "medicalHistory",
            populate: ["allergies", "diseases", "injuries"],
          },
          { path: "emergencyContacts" },
        ],
      });

    // 3. Emergency Requests
    const totalRequests = await EmergencyRequest.countDocuments();
    const emergencyRequests = await EmergencyRequest.find()
      .populate("createdBy", "name email")
      .populate("finalizedHospital", "name type")
      .populate({
        path: "patientProfile",
        populate: [
          {
            path: "medicalHistory",
            populate: ["allergies", "diseases", "injuries"],
          },
          { path: "emergencyContacts" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(200, "Platform summary fetched", {
        totalHospitals,
        hospitals,
        totalUsers,
        users,
        totalRequests,
        emergencyRequests,
      })
    );
  } catch (err) {
    console.log("err", err);
    throw new ApiError(402, "Something went wrong");
  }
});

export { getAdminDashboardData };
