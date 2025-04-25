import mongoose, { Schema } from "mongoose";
const injurySchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: true,
    },
    body_part: {
      type: String,
      required: true,
      trim: true,
    },
    surgery: {
      type: Boolean,
      default: false,
    },
    stitches: {
      type: Boolean,
      default: false,
    },
    recovered: {
      type: Boolean,
      default: false,
    },
    injury_year: {
      type: Number,
      required: true,
    },
    surgery_year: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Injury = mongoose.model("Injury", injurySchema);
