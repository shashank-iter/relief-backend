import EmergencyRequest from "../models/emergency_requests_models/emergencyrequest.model.js";
import { HospitalProfile } from "../models/hospital_models/hospital.model.js";
import { PatientProfile } from "../models/patient_models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// Emergency Controllers for Patients
const createEmergencyRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const {
    forSelf = true,
    patientName, // Match schema field name
    patientPhoneNumber, // Match schema field name
    location, // { type: "Point", coordinates: [lng, lat] }
  } = req.body;

  // Fixed validation logic
  if (
    !patientName ||
    !patientPhoneNumber ||
    !location?.coordinates ||
    location.coordinates.length !== 2
  ) {
    throw new ApiError(
      400,
      "Patient name, phone number, and location coordinates are required."
    );
  }

  // Check if user already has a pending or active request
  const existing = await EmergencyRequest.findOne({
    createdBy: userId, // Match schema field
    status: { $in: ["pending", "accepted"] }, // Match schema enum values
  });

  if (existing) {
    throw new ApiError(409, "You already have an ongoing emergency request.");
  }

  // Get nearby hospitals (within 10km)
  const nearbyHospitals = await HospitalProfile.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: location.coordinates,
        },
        $maxDistance: 10000, // 10km in meters
      },
    },
  }).select("_id");

  if (nearbyHospitals.length === 0) {
    throw new ApiError(404, "No hospitals found within 10km.");
  }

  // Optional image handling
  let photoUrl = "";
  if (req.file) {
    photoUrl = req.file.path || req.file.location;
  }

  const emergencyRequest = await EmergencyRequest.create({
    createdBy: userId, // Match schema
    forSelf,
    patientName, // Match schema
    patientPhoneNumber, // Match schema
    photo: photoUrl,
    location,
    status: "pending", // Match schema enum (lowercase)
    // Note: acceptedBy array will be empty initially
  });

  // If you need to track which hospitals were notified,
  // consider adding a 'notifiedHospitals' field to your schema
  // or handle notifications separately

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Emergency request created successfully",
        emergencyRequest
      )
    );
});

const patientFinalizeEmergencyRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const requestId = req.params.id;
  const { hospitalId } = req.body;

  if (!hospitalId) {
    throw new ApiError(400, "Hospital ID is required for finalization");
  }

  const emergencyRequest = await EmergencyRequest.findById(requestId);
  if (!emergencyRequest) {
    throw new ApiError(404, "Emergency request not found");
  }

  if (!emergencyRequest.createdBy.equals(userId)) {
    throw new ApiError(403, "You are not authorized to finalize this request");
  }

  if (emergencyRequest.status !== "accepted") {
    throw new ApiError(400, "Request is not in accepted state");
  }

  if (!emergencyRequest.acceptedBy.includes(hospitalId)) {
    throw new ApiError(400, "Selected hospital has not accepted the request");
  }

  const hospital = await HospitalProfile.findById(hospitalId);
  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  const patientProfile = await PatientProfile.findOne({ owner: userId });
  if (!patientProfile) {
    throw new ApiError(404, "Patient profile not found");
  }

  emergencyRequest.finalizedHospital = hospital._id;
  emergencyRequest.patientProfile = patientProfile._id;
  emergencyRequest.status = "finalized";
  await emergencyRequest.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, "Hospital finalized successfully", emergencyRequest)
    );
});

const getHospitalResponsesForPatient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const emergencyRequest = await EmergencyRequest.findById(id)
    .populate({
      path: "acceptedBy",
      select: "-__v",
      populate: [
        { path: "bedData", select: "-__v" },
        { path: "bloodData", select: "-__v" },
        { path: "address", select: "-__v" },
      ],
    })
    .populate({
      path: "finalizedHospital",
      select: "-__v",
      populate: [
        { path: "bedData", select: "-__v" },
        { path: "bloodData", select: "-__v" },
        { path: "address", select: "-__v" },
      ],
    });

  if (!emergencyRequest) {
    throw new ApiError(404, "Emergency request not found");
  }

  return res.status(200).json(
    new ApiResponse(200, "Hospital data fetched successfully", {
      request: emergencyRequest,
    })
  );
});

const getEmergencyRequestsByStatusForPatient = asyncHandler(
  async (req, res) => {
    const userId = req.user.id;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "accepted",
      "finalized",
      "resolved",
      "cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid or missing status");
    }

    const requests = await EmergencyRequest.find({
      createdBy: userId,
      status,
    }).sort({ updatedAt: -1 });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          `Emergency requests with status '${status}' fetched successfully`,
          requests
        )
      );
  }
);

// Emergency Controllers for Hospitals

const hospitalAcceptEmergencyRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const requestId = req.params.id;

  // Get the hospital's profile
  const hospitalProfile = await HospitalProfile.findOne({ owner: userId });
  if (!hospitalProfile) {
    throw new ApiError(404, "Hospital profile not found");
  }

  // Find the emergency request
  const emergencyRequest = await EmergencyRequest.findById(requestId);

  if (!emergencyRequest) {
    throw new ApiError(404, "Emergency request not found");
  }

  // Request must be in 'pending' or 'accepted' status (not finalized/resolved/cancelled)
  if (!["pending", "accepted"].includes(emergencyRequest.status)) {
    throw new ApiError(
      400,
      "This emergency request is no longer available for acceptance"
    );
  }

  // Check if already finalized by another hospital
  if (emergencyRequest.finalizedHospital) {
    throw new ApiError(
      400,
      "This emergency request has already been finalized"
    );
  }

  // Check if already accepted by this hospital
  if (emergencyRequest.acceptedBy.includes(hospitalProfile._id)) {
    throw new ApiError(409, "You have already accepted this request");
  }

  // Verify hospital is within acceptable range (10km)
  if (hospitalProfile.location && hospitalProfile.location.coordinates) {
    const nearbyRequest = await EmergencyRequest.findOne({
      _id: requestId,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: hospitalProfile.location.coordinates,
          },
          $maxDistance: 10000, // 10km
        },
      },
    });

    if (!nearbyRequest) {
      throw new ApiError(
        403,
        "You are too far from this emergency request to accept it"
      );
    }
  }

  // Accept request
  emergencyRequest.acceptedBy.push(hospitalProfile._id);

  // Update status to 'accepted' only if it was 'pending'
  if (emergencyRequest.status === "pending") {
    emergencyRequest.status = "accepted";
  }

  await emergencyRequest.save();

  // Populate the result for better response
  const populatedRequest = await EmergencyRequest.findById(requestId)
    .populate("createdBy", "name email")
    .populate("acceptedBy", "hospitalName contactNumber")
    .populate("finalizedHospital", "hospitalName contactNumber");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Emergency request accepted successfully",
        populatedRequest
      )
    );
});

const getNearbyEmergencyRequestsForHospital = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const hospital = await HospitalProfile.findOne({ owner: userId });

  if (
    !hospital ||
    !hospital.location ||
    !hospital.location.coordinates?.length
  ) {
    throw new ApiError(404, "Hospital profile or location not found");
  }

  const emergencyRequests = await EmergencyRequest.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: hospital.location.coordinates,
        },
        $maxDistance: 10000,
      },
    },
    status: "pending",
    acceptedBy: { $nin: [hospital._id] },
    // finalizedHospital: { $exists: false },
  })
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Nearby emergency requests fetched successfully",
        emergencyRequests
      )
    );
});

const getEmergencyRequestsByStatusForHospital = asyncHandler(
  async (req, res) => {
    const userId = req.user.id;
    const { status } = req.body;

    const validStatuses = [
      // "pending", this API is not for pending status
      "accepted",
      "finalized",
      "resolved",
      "cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid or missing status");
    }

    const hospital = await HospitalProfile.findOne({ owner: userId });
    if (!hospital) {
      throw new ApiError(404, "Hospital profile not found");
    }

    let requests;

    // get requests that hospital were finalized to hospital
    if (status === "finalized" || status === "resolved") {
      requests = await EmergencyRequest.find({
        status,
        finalizedHospital: hospital._id,
      })
        .populate({
          path: "patientProfile",
          select: "-__v",
          populate: [
            { path: "medicalHistory", select: "-__v" },
            { path: "emergencyContacts", select: "-__v" },
          ],
        })
        .sort({ updatedAt: -1 });
    } else {
      // get requests that were accepted by hospital
      requests = await EmergencyRequest.find({
        status,
        acceptedBy: hospital._id,
      }).sort({ updatedAt: -1 });
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          `Emergency requests with status '${status}' fetched successfully`,
          requests
        )
      );
  }
);

const uploadEmergencyRequestPhoto = asyncHandler(async (req, res) => {
  const { emergencyRequestId } = req.body;
  console.log(req);

  if (!req.file || !emergencyRequestId) {
    throw new ApiError(400, "Image file and requestId are required");
  }

  const request = await EmergencyRequest.findById(emergencyRequestId);
  if (!request) {
    throw new ApiError(404, "Emergency request not found");
  }

  const cloudinaryResult = await uploadOnCloudinary(req.file.buffer);
  if (!cloudinaryResult || !cloudinaryResult.secure_url) {
    throw new ApiError(500, "Cloudinary upload failed");
  }

  request.photo = cloudinaryResult.secure_url;
  await request.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Photo uploaded successfully", request));
});

const cancelEmergencyRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const emergencyRequest = await EmergencyRequest.findOne({
    _id: id,
    createdBy: userId,
  });

  if (!emergencyRequest) {
    throw new ApiError(404, "Emergency request not found");
  }

  if (emergencyRequest.status === "cancelled") {
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Request already cancelled", emergencyRequest)
      );
  }
  if (emergencyRequest.status === "resolved") {
    return res
      .status(200)
      .json(new ApiResponse(200, "Request already resolved", emergencyRequest));
  }

  emergencyRequest.status = "cancelled";
  await emergencyRequest.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Emergency request cancelled successfully",
        emergencyRequest
      )
    );
});

const markRequestAsResolved = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const requestId = req.params.id;
  console.log("req", req.params);

  // Find the hospital profile linked to the user
  const hospitalProfile = await HospitalProfile.findOne({ owner: userId });

  // console.log(hospitalProfile);
  console.log(userId, requestId);

  if (!hospitalProfile) {
    throw new ApiError(404, "Hospital profile not found");
  }

  const hospitalProfileId = hospitalProfile._id;

  // Find and update the request only if it was finalized by this hospital
  const request = await EmergencyRequest.findOneAndUpdate(
    {
      _id: requestId,
      status: "finalized",
      finalizedHospital: hospitalProfileId,
    },
    { status: "resolved" },
    { new: true }
  );

  console.log(request);

  if (!request) {
    throw new ApiError(
      404,
      "No matching finalized request found for this hospital"
    );
  }

  return res.status(200).json(
    new ApiResponse(200, "Emergency request marked as resolved successfully", {
      request,
    })
  );
});

// how we are going to handle when a user creates multiple emergency requests
// may not allow user to create multiple emergency requests as in not more than 2 at one time.

// Cancellation workflow -- mark request status as cancelled
// When user can cancel the workflow
// User creates request and hospital accept it and then he cancels, give him privilage to cancel it. -- cancelled
// User creates request and hospital accept it and then user confirms and then user cancels, give him privilage to cancel it. -- cancelled

// We should have ambulance role, for so that he is only able to see the requests that are that are finalized.
// Can be extended to ambulance model and assignment.

// create a block user API

export {
  createEmergencyRequest,
  hospitalAcceptEmergencyRequest,
  patientFinalizeEmergencyRequest,
  getHospitalResponsesForPatient,
  getNearbyEmergencyRequestsForHospital,
  getEmergencyRequestsByStatusForHospital,
  getEmergencyRequestsByStatusForPatient,
  uploadEmergencyRequestPhoto,
  cancelEmergencyRequest,
  markRequestAsResolved,
};
