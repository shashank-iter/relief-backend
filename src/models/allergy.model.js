import mongoose, {Schema} from "mongoose";

const allergySchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    symptoms: {
      type: String,
      trim: true,
    },
    medication: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Allergy = mongoose.model("Allergy", allergySchema);
