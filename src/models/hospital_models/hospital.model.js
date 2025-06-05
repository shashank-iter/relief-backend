import mongoose from "mongoose";
import phoneNumberSchema from "./phonenumber.model.js";

const hospitalProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: [
        "PHC",
        "CHC",
        "NURSING HOME",
        "CLINIC",
        "MULTI_SPECIALITY",
        "SUPER_SPECIALITY",
        "OTHERS",
      ],
      required: true,
    },
    phoneNumbers: {
      type: [phoneNumberSchema],
      default: [],
      required: true,
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    bedData: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BedData",
        required: false,
      },
    ],
    bloodData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodData",
      required: false,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: false,
    },
    is_blood_available: { type: Boolean, default: false },
    is_ambulance_available: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

hospitalProfileSchema.index({ location: "2dsphere" });

export const HospitalProfile = mongoose.model(
  "HospitalProfile",
  hospitalProfileSchema
);
