import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "hospital"],
      default: "user",
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  // as a callback function don't write arrow function as it does not has reference (this) to the elements in the schema

  // as a parameter to the callback function we use "next" as it tells the function to move to the next middleware when processing is done

  // actually we have programmed our pre hook to work when user tries to save the data, now that data can be any field other than password, maybe the user is trying to save the avatar but due to this pre hook password would be saved subsequently, we need to avoid this and to do so we need check whether password was even modified or not.

  // here was the problem as we have used pre save hook to hash the password but we have not checked if the password is modified or not

  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// schema object has a method called methods which is used to create custom methods

// here is the custom method to check if the password is correct or not

userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  // do check if it requires async or not

  // we are passing _id as the payload to the token because we can use this id to get the user details from the database

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  // do check if it requires async or not

  // we are passing _id as the payload to the token because we can use this id to get the user details from the database

  return jwt.sign(
    {
      id: this._id,
      // we take less data in refresh token as it is not sent to the client
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
// this User can talk to the database and perform operations on the database
