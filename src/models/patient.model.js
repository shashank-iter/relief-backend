import mongoose, { Schema } from "mongoose";

const PatientProfileSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    address: {
      type: String,
    },
    pincode: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    aadharNumber: {
      type: String,
    },
    emergencyContacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmergencyContact",
      },
    ],
    medicalHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalHistory",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    lastKnownLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      lastUpdated: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index for location-based queries
PatientProfileSchema.index({ location: "2dsphere" });
PatientProfileSchema.index({ lastKnownLocation: "2dsphere" });

export const PatientProfile = mongoose.model(
  "PatientProfile",
  PatientProfileSchema
);
