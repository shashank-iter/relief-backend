import mongoose, { Schema } from "mongoose";

const EmergencyContactSchema = new Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String
  },
  relationship: {
    type: String
  }
}, {
  timestamps: true
});

export const EmergencyContact = mongoose.model('EmergencyContact', EmergencyContactSchema);
