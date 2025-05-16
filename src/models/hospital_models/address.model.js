import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HospitalProfile",
    required: true,
  },
  locality: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
}, {
  timestamps: true
});

export const Address = mongoose.model("Address", addressSchema);
