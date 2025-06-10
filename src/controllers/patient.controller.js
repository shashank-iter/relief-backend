import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { PatientProfile } from "../models/patient_models/patient.model.js";
import { EmergencyContact } from "../models/patient_models/emergencyContact.model.js";
import { MedicalHistory } from "../models/patient_models/medicalhistory.model.js";
import { Disease } from "../models/patient_models/disease.model.js";
import { Allergy } from "../models/patient_models/allergy.model.js";
import { Injury } from "../models/patient_models/injury.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

/**
 * Update patient profile information
 * @route PUT /api/patients/profile
 * @access Private (Patient only)
 */
const updatePatientProfile = asyncHandler(async (req, res) => {
  const {
    name,
    dob,
    address,
    pincode,
    phoneNumber,
    bloodGroup,
    aadharNumber,
    coordinates,
  } = req.body;

  // Get the patient ID from the authenticated user
  const userId = req.user._id;

  // Find the patient profile
  const patientProfile = await PatientProfile.findOne({ owner: userId });

  if (!patientProfile) {
    throw new ApiError(404, "Patient profile not found");
  }

  // Update only the fields that were provided
  if (name) patientProfile.name = name;
  if (dob) patientProfile.dob = dob;
  if (address) patientProfile.address = address;
  if (pincode) patientProfile.pincode = pincode;
  if (phoneNumber) patientProfile.phoneNumber = phoneNumber;
  if (bloodGroup) patientProfile.bloodGroup = bloodGroup;
  if (aadharNumber) patientProfile.aadharNumber = aadharNumber;

  // Update coordinates if provided
  if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
    patientProfile.location = {
      type: "Point",
      coordinates: coordinates, // [longitude, latitude]
    };
  }

  // Save the updated profile
  await patientProfile.save();

  // Return the updated profile
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Patient profile updated successfully",
        patientProfile
      )
    );
});

/**
 * Get patient profile information
 * @route GET /api/patients/profile
 * @access Private (Patient only)
 */
const getPatientProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const patientProfile = await PatientProfile.findOne({ owner: userId })
    .populate("emergencyContacts")
    .populate({
      path: "medicalHistory",
      populate: {
        path: "diseases allergies injuries",
      },
    });

  if (!patientProfile) {
    throw new ApiError(404, "Patient profile not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Patient profile fetched successfully",
        patientProfile
      )
    );
});

/**
 * Update or add emergency contacts in patient profile
 * @route POST /api/patients/emergency-contacts
 * @access Private (Patient only)
 */
const updateEmergencyContact = asyncHandler(async (req, res) => {
  const { contactId, name, phoneNumber, email, relationship } = req.body;
  console.log(contactId);
  const userId = req.user._id;

  // Find the patient profile
  const patientProfile = await PatientProfile.findOne({ owner: userId });

  if (!patientProfile) {
    throw new ApiError(404, "Patient profile not found");
  }

  let emergencyContact;

  // If contactId is provided, update an existing contact
  if (contactId) {
    emergencyContact = await EmergencyContact.findById(contactId);

    if (!emergencyContact) {
      throw new ApiError(404, "Emergency contact not found");
    }

    console.log(emergencyContact.owner, userId);
    // Verify this contact belongs to the user
    if (emergencyContact.owner.toString() !== patientProfile?._id?.toString()) {
      throw new ApiError(
        403,
        "You don't have permission to update this contact"
      );
    }

    // Update the contact
    if (name) emergencyContact.name = name;
    if (phoneNumber) emergencyContact.phoneNumber = phoneNumber;
    if (email !== undefined) emergencyContact.email = email;
    if (relationship !== undefined)
      emergencyContact.relationship = relationship;

    await emergencyContact.save();
  } else {
    // Create a new contact
    if (!name || !phoneNumber) {
      throw new ApiError(400, "Name and phone number are required");
    }

    emergencyContact = await EmergencyContact.create({
      owner: patientProfile._id,
      name,
      phoneNumber,
      email: email || "",
      relationship: relationship || "",
    });

    // Add to patient profile if not already present
    if (!patientProfile.emergencyContacts.includes(emergencyContact._id)) {
      patientProfile.emergencyContacts.push(emergencyContact._id);
      await patientProfile.save();
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        contactId
          ? "Emergency contact updated successfully"
          : "Emergency contact added successfully",
        emergencyContact
      )
    );
});

/**
 * Update medical history by adding or modifying diseases, allergies, or injuries
 * @route POST /api/patients/medical-history/:type
 * @access Private (Patient only)
 */
const updateMedicalHistory = asyncHandler(async (req, res) => {
  const { type } = req.params; // "disease", "allergy", or "injury"
  const { itemId, ...itemData } = req.body;
  const userId = req.user._id;

  // Validate type parameter
  if (!["disease", "allergy", "injury"].includes(type)) {
    throw new ApiError(400, "Invalid medical history type");
  }

  // Find the patient profile
  const patientProfile = await PatientProfile.findOne({ owner: userId });

  if (!patientProfile) {
    throw new ApiError(404, "Patient profile not found");
  }

  // Find or create medical history if it doesn't exist
  let medicalHistory = await MedicalHistory.findById(
    patientProfile.medicalHistory
  );

  if (!medicalHistory) {
    medicalHistory = await MedicalHistory.create({
      owner: patientProfile._id,
      diseases: [],
      allergies: [],
      injuries: [],
    });

    patientProfile.medicalHistory = medicalHistory._id;
    await patientProfile.save();
  }

  let result;
  let message;

  // Handle based on type
  switch (type) {
    case "disease":
      if (itemId) {
        // Update existing disease
        const disease = await Disease.findById(itemId);
        if (!disease) {
          throw new ApiError(404, "Disease not found");
        }

        // Validate if this disease belongs to the user's medical history
        if (!medicalHistory.diseases.includes(disease._id)) {
          throw new ApiError(
            403,
            "You don't have permission to update this disease"
          );
        }

        // Update fields
        if (itemData.name) disease.name = itemData.name;
        if (itemData.status) disease.status = itemData.status;
        if (itemData.from) disease.from = itemData.from;
        if (itemData.to !== undefined) disease.to = itemData.to;
        if (itemData.medication !== undefined)
          disease.medication = itemData.medication;

        await disease.save();
        result = disease;
        message = "Disease updated successfully";
      } else {
        // Create new disease
        if (!itemData.name || !itemData.status || !itemData.from) {
          throw new ApiError(
            400,
            "Name, status, and from date are required for disease"
          );
        }

        const disease = await Disease.create({
          ...itemData,
          owner: patientProfile._id, // Add the patientProfile ID as owner
        });

        medicalHistory.diseases.push(disease._id);
        await medicalHistory.save();
        result = disease;
        message = "Disease added successfully";
      }
      break;

    case "allergy":
      if (itemId) {
        // Update existing allergy
        const allergy = await Allergy.findById(itemId);
        if (!allergy) {
          throw new ApiError(404, "Allergy not found");
        }

        // Validate if this allergy belongs to the user's medical history
        if (!medicalHistory.allergies.includes(allergy._id)) {
          throw new ApiError(
            403,
            "You don't have permission to update this allergy"
          );
        }

        // Update fields
        if (itemData.reason) allergy.reason = itemData.reason;
        if (itemData.symptoms !== undefined)
          allergy.symptoms = itemData.symptoms;
        if (itemData.medication !== undefined)
          allergy.medication = itemData.medication;

        await allergy.save();
        result = allergy;
        message = "Allergy updated successfully";
      } else {
        // Create new allergy
        if (!itemData.reason) {
          throw new ApiError(400, "Reason is required for allergy");
        }

        const allergy = await Allergy.create({
          ...itemData,
          owner: patientProfile._id, // Add the patientProfile ID as owner
        });

        medicalHistory.allergies.push(allergy._id);
        await medicalHistory.save();
        result = allergy;
        message = "Allergy added successfully";
      }
      break;

    case "injury":
      if (itemId) {
        // Update existing injury
        const injury = await Injury.findById(itemId);
        if (!injury) {
          throw new ApiError(404, "Injury not found");
        }

        // Validate if this injury belongs to the user's medical history
        if (!medicalHistory.injuries.includes(injury._id)) {
          throw new ApiError(
            403,
            "You don't have permission to update this injury"
          );
        }

        // Update fields
        if (itemData.body_part) injury.body_part = itemData.body_part;
        if (itemData.surgery !== undefined) injury.surgery = itemData.surgery;
        if (itemData.stitches !== undefined)
          injury.stitches = itemData.stitches;
        if (itemData.recovered !== undefined)
          injury.recovered = itemData.recovered;
        if (itemData.injury_year) injury.injury_year = itemData.injury_year;
        if (itemData.surgery_year !== undefined)
          injury.surgery_year = itemData.surgery_year;

        await injury.save();
        result = injury;
        message = "Injury updated successfully";
      } else {
        // Create new injury
        if (!itemData.body_part || !itemData.injury_year) {
          throw new ApiError(
            400,
            "Body part and injury year are required for injury"
          );
        }

        const injury = await Injury.create({
          ...itemData,
          owner: patientProfile._id, // Add the patientProfile ID as owner
        });

        medicalHistory.injuries.push(injury._id);
        await medicalHistory.save();
        result = injury;
        message = "Injury added successfully";
      }
      break;
  }

  return res.status(200).json(new ApiResponse(200, message, result));
});

/**
 * Delete an emergency contact
 * @route DELETE /api/patients/emergency-contacts/:contactId
 * @access Private (Patient only)
 */
const deleteEmergencyContact = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const userId = req.user._id;

  // Find the contact
  const contact = await EmergencyContact.findById(contactId);
  console.log(contact);

  if (!contact) {
    throw new ApiError(404, "Emergency contact not found");
  }
  console.log(contact.owner.toString());
  console.log(userId.toString());
  console.log(contact.owner.toString() !== userId.toString());
  // Verify ownership
  if (contact.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You don't have permission to delete this contact");
  }

  // Find patient profile and remove reference
  const patientProfile = await PatientProfile.findOne({ owner: userId });

  if (patientProfile) {
    patientProfile.emergencyContacts = patientProfile.emergencyContacts.filter(
      (id) => id.toString() !== contactId
    );
    await patientProfile.save();
  }

  // Delete the contact
  await EmergencyContact.findByIdAndDelete(contactId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Emergency contact deleted successfully", null));
});

/**
 * Delete a medical history item (disease, allergy, or injury)
 * @route DELETE /api/patients/medical-history/:type/:itemId
 * @access Private (Patient only)
 */
const deleteMedicalHistoryItem = asyncHandler(async (req, res) => {
  const { type, itemId } = req.params;
  const userId = req.user._id;

  // Validate type parameter
  if (!["disease", "allergy", "injury"].includes(type)) {
    throw new ApiError(400, "Invalid medical history type");
  }

  // Find the patient profile
  const patientProfile = await PatientProfile.findOne({ owner: userId });

  if (!patientProfile || !patientProfile.medicalHistory) {
    throw new ApiError(404, "Medical history not found");
  }

  const medicalHistory = await MedicalHistory.findById(
    patientProfile.medicalHistory
  );

  if (!medicalHistory) {
    throw new ApiError(404, "Medical history not found");
  }

  let Model, arrayField;

  // Determine which model and array field to use based on type
  switch (type) {
    case "disease":
      Model = Disease;
      arrayField = "diseases";
      break;
    case "allergy":
      Model = Allergy;
      arrayField = "allergies";
      break;
    case "injury":
      Model = Injury;
      arrayField = "injuries";
      break;
  }

  // Find the item
  const item = await Model.findById(itemId);

  if (!item) {
    throw new ApiError(
      404,
      `${type.charAt(0).toUpperCase() + type.slice(1)} not found`
    );
  }

  // Verify the item belongs to the user's medical history
  if (!medicalHistory[arrayField].includes(itemId)) {
    throw new ApiError(403, "You don't have permission to delete this item");
  }

  // Remove the reference from medical history
  medicalHistory[arrayField] = medicalHistory[arrayField].filter(
    (id) => id.toString() !== itemId
  );
  await medicalHistory.save();

  // Delete the item
  await Model.findByIdAndDelete(itemId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        null
      )
    );
});

export {
  updatePatientProfile,
  updateMedicalHistory,
  updateEmergencyContact,
  getPatientProfile,
  deleteEmergencyContact,
  deleteMedicalHistoryItem,
};
