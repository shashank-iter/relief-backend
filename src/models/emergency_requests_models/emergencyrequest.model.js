import mongoose from "mongoose";

const emergencyRequestSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    forSelf: {
      type: Boolean,
      default: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    patientPhoneNumber: {
      type: String,
      required: true,
    },

    photo: {
      type: String, // URL or path to the image
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    acceptedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HospitalProfile",
      },
    ],

    finalizedHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalProfile",
      default: null, // keep this default as null only or it will fuck up in hospital get request quries.
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "finalized", "resolved", "cancelled"],
      default: "pending",
    },

    is_ambulance_required: {
      type: Boolean,
      default: true,
    },
    
    patientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enable geospatial queries
emergencyRequestSchema.index({ location: "2dsphere" });

const EmergencyRequest = mongoose.model(
  "EmergencyRequest",
  emergencyRequestSchema
);

export default EmergencyRequest;
