// Disease Model
import mongoose, { Schema } from "mongoose";

const diseaseSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["current", "earlier"],
      required: true,
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
    },
    medication: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Disease = mongoose.model("Disease", diseaseSchema);
