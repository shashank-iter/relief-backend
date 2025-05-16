import { HospitalProfile } from "../models/hospital_models/hospital.model.js";
import { Address } from "../models/hospital_models/address.model.js";
import { BedData } from "../models/hospital_models/beddata.model.js";
import { BloodData } from "../models/hospital_models/blooddata.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const updateHospitalProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role; // Assuming role is set in req.user by your auth middleware
  const updateData = req.body;

  // Find hospital profile by owner userId
  const hospitalProfile = await HospitalProfile.findOne({ owner: userId });
  if (!hospitalProfile) {
    throw new ApiError(404, "Hospital profile not found");
  }

  // Fields allowed to update for all roles except 'name' and 'licenseNumber'
  const baseAllowedFields = [
    "type",
    "location",
    "is_blood_available",
    "phoneNumbers",
  ];

  // Admin can update 'name' and 'licenseNumber' also
  if (userRole === "admin") {
    baseAllowedFields.push("name", "licenseNumber");
  }

  // Update simple allowed fields on hospital profile
  baseAllowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      hospitalProfile[field] = updateData[field];
    }
  });

  // Handle Address (single document reference)
  if (updateData.address) {
    if (hospitalProfile.address) {
      // Update existing Address
      await Address.findByIdAndUpdate(
        hospitalProfile.address,
        { ...updateData.address, owner: hospitalProfile._id },
        { new: true }
      );
    } else {
      // Create new Address
      const newAddress = await Address.create({
        ...updateData.address,
        owner: hospitalProfile._id,
      });
      hospitalProfile.address = newAddress._id;
    }
  }

  // Handle BloodData (single document reference)
  if (updateData.bloodData) {
    if (hospitalProfile.bloodData) {
      // Update existing BloodData
      await BloodData.findByIdAndUpdate(
        hospitalProfile.bloodData,
        { ...updateData.bloodData, owner: hospitalProfile._id },
        { new: true }
      );
    } else {
      // Create new BloodData
      const newBloodData = await BloodData.create({
        ...updateData.bloodData,
        owner: hospitalProfile._id,
      });
      hospitalProfile.bloodData = newBloodData._id;
    }
  }

  // Handle BedData (multiple documents array reference)
  if (Array.isArray(updateData.bedData)) {
    // We'll update existing bedData entries by id or create new ones
    const updatedBedDataIds = [];

    for (const bedItem of updateData.bedData) {
      if (bedItem._id) {
        // Update existing bedData doc
        const updatedBed = await BedData.findOneAndUpdate(
          { _id: bedItem._id, owner: hospitalProfile._id },
          { type: bedItem.type, count: bedItem.count, available: bedItem.available },
          { new: true }
        );
        if (updatedBed) {
          updatedBedDataIds.push(updatedBed._id);
        }
      } else {
        // Create new bedData doc
        const newBed = await BedData.create({
          ...bedItem,
          owner: hospitalProfile._id,
        });
        updatedBedDataIds.push(newBed._id);
      }
    }

    // Remove bedData IDs that are no longer sent by client (optional: cleanup)
    const bedDataIdsToRemove = hospitalProfile.bedData.filter(
      (id) => !updatedBedDataIds.includes(id.toString())
    );
    if (bedDataIdsToRemove.length) {
      await BedData.deleteMany({ _id: { $in: bedDataIdsToRemove }, owner: hospitalProfile._id });
    }

    hospitalProfile.bedData = updatedBedDataIds;
  }

  // Save hospital profile after updates
  await hospitalProfile.save();

  // Populate referenced fields before sending response
  const populatedHospitalProfile = await HospitalProfile.findOne({ owner: userId }).populate([
  "address",
  "bedData",
  "bloodData",
]);

  res.status(200).json(
    new ApiResponse(200,  "Hospital profile updated successfully", populatedHospitalProfile)
  );
});


const getHospitalProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const hospitalProfile = await HospitalProfile.findOne({ owner: userId }).populate([
    "address",
    "bedData",
    "bloodData",
  ]);

  if (!hospitalProfile) {
    throw new ApiError(404, "Hospital profile not found");
  }

  res.status(200).json(
    new ApiResponse(200, "Hospital profile fetched successfully", hospitalProfile)
  );
});

export { updateHospitalProfile, getHospitalProfile };
