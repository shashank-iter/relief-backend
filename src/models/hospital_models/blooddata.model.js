import mongoose from "mongoose";

const bloodDataSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalProfile",
      required: true,
      unique: true, // One-to-one relation
    },
    opos: { type: Number, default: 0 },
    oneg: { type: Number, default: 0 },
    apos: { type: Number, default: 0 },
    aneg: { type: Number, default: 0 },
    bpos: { type: Number, default: 0 },
    bneg: { type: Number, default: 0 },
    abpos: { type: Number, default: 0 },
    abneg: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Update is_blood_available in HospitalProfile based on total units
bloodDataSchema.pre("save", async function (next) {
  const totalUnits =
    this.opos +
    this.oneg +
    this.apos +
    this.aneg +
    this.bpos +
    this.bneg +
    this.abpos +
    this.abneg;

  await mongoose
    .model("HospitalProfile")
    .findByIdAndUpdate(this.owner, { is_blood_available: totalUnits > 0 });

  next();
});

export const BloodData = mongoose.model("BloodData", bloodDataSchema);
