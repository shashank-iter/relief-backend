import mongoose, { Schema } from "mongoose";
const medicalHistorySchema = new Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientProfile",
        required: true
      },
      diseases: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Disease"
        }
      ],
      allergies: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Allergy"
        }
      ],
      injuries: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Injury"
        }
      ]
    },
    { timestamps: true }
  );
  
  export const MedicalHistory = mongoose.model("MedicalHistory", medicalHistorySchema);