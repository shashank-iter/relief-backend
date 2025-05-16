import mongoose from "mongoose";

const phoneNumberSchema = new mongoose.Schema({
  label: {
    type: String,
    enum: ["primary", "secondary", "emergency", "reception", "other"],
    default: "primary",
  },
  number: {
    type: String,
    required: true,
  },
});

export default phoneNumberSchema;
