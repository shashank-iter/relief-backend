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
      locality: String,
      city: String,
      state: String,
      pincode: String,
    },
    dob: { type: Date, required: true },
    age: { type: Number }, // Can be auto-calculated via middleware if needed
    phoneNumber: {
      type: String,
      unique: true,
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

PatientProfileSchema.pre('save', function (next) {
  if (this.dob) {
    const today = new Date();
    let age = today.getFullYear() - this.dob.getFullYear();
    const m = today.getMonth() - this.dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < this.dob.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

// Create a geospatial index for location-based queries
PatientProfileSchema.index({ location: "2dsphere" });
PatientProfileSchema.index({ lastKnownLocation: "2dsphere" });

export const PatientProfile = mongoose.model(
  "PatientProfile",
  PatientProfileSchema
);
