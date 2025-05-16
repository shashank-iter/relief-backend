import mongoose from "mongoose";

const bedDataSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalProfile",
      required: true,
    },
    type: {
      type: String, // e.g., ICU, General, Ventilator
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
    available: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const BedData = mongoose.model("BedData", bedDataSchema);
