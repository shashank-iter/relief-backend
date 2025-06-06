import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { PatientProfile } from "../models/patient_models/patient.model.js";
import { HospitalProfile } from "../models/hospital_models/hospital.model.js";
import ApiResponse from "../utils/ApiResponse.js";

    const accessTokenOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    const refreshTokenOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    };

    const isLoginOptions = {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: true,
      httpOnly: false,
      sameSite: "None",
      domain: '.vercel.app'
    }

export const generateAccessAndRefeshToken = async (userId) => {
  // the user Id in the params is mongoDB user id

  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    // when we save the refreshToken in the database, the entire user object is saved again and asks for all the validation in the model so we need to disable validation for this call.
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { phoneNumber, password, role, dob } = req.body;

  console.log(password, phoneNumber, role, dob);

  // validate required fields
  if ([password, phoneNumber, role].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please provide all required fields");
  }

  if (role === "patient" && !dob) {
    throw new ApiError(400, "DOB is required for patient registration");
  }

  // check if user already exists
  const existingUser = await User.findOne({
    $or: [{ phoneNumber }],
  });

  console.log(existingUser, "existingUser");

  if (existingUser) {
    throw new ApiError(400, "User with this phone number already exists");
  }

  try {
    // create user
    const newUser = await User.create({
      phoneNumber,
      password,
      role,
    });

    let newProfile = null;

    if (role === "patient") {
      // create corresponding patient record
      newProfile = await PatientProfile.create({
        owner: newUser._id,
        dob: dob,
        phoneNumber: phoneNumber,
        // Optional: You can also prefill phoneNumber and email if Patient schema has those fields
      });

      // update user with patient profile id
      newUser.profile = newProfile._id;
      await newUser.save();
    }

    // generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefeshToken(
      newUser._id
    );

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    console.log("User registered successfully", createdUser);



    return res
      .status(201)
      .cookie("accessToken", accessToken, accessTokenOptions)
      .cookie("refreshToken", refreshToken, refreshTokenOptions)
      .cookie("is_login", 1, isLoginOptions)
      .json(
        new ApiResponse(
          201,
          "User registered successfully",
          {
            user: createdUser,
            accessToken,
            refreshToken,
          },
        )
      );
  } catch (error) {
    console.log("User registration error:", error);
    throw new ApiError(500, "Something went wrong while registering user");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const {  phoneNumber, role, password } = req.body;
  if (!phoneNumber) {
    throw new ApiError(400, "Please provide Phone number or password.");
  }

  if (!role || role !== "patient") {
    throw new ApiError(400, "Invalid role, Access Denied.");
  }

  // find the user
  const user = await User.findOne({
    $or: [{ phoneNumber: phoneNumber }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check the password
  const isPasswordValid = await user.verifyPassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // send access and refresh token in cookies
  const { accessToken, refreshToken } = await generateAccessAndRefeshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken -password"
  );


  // return response
  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .cookie("is_login", 1, isLoginOptions)
    .json(
      new ApiResponse(
        200,

        "User logged in successfully",
        {
          // here we are sending the accessToken and refreshToken in the response as well, cuz maybe the frontend in a mobile app which isn't able to set cookies.

          user: loggedInUser,
          accessToken,
          refreshToken,
        }
      )
    );
});

const getUserData = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(404, "User not found");
  }
  const user = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, "User data fetched successfully", user));
});

// For Hospital User

// integrated supabase data and then register from admin dashboard. 

// register controller for hospital
const registerHospitalUser = asyncHandler(async (req, res) => {
  const { phoneNumber, password, role, name, licenseNumber, type } = req.body;

  console.log(password, phoneNumber, role, name, licenseNumber, type);

  // Validate required fields
  if ([password, phoneNumber, role, name, licenseNumber, type].some(field => !field?.trim())) {
    throw new ApiError(400, "Please provide all required fields");
  }

  if (role !== "hospital") {
    throw new ApiError(400, "Invalid role for hospital registration");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ phoneNumber });

  if (existingUser) {
    throw new ApiError(400, "User with this phone number already exists");
  }

  try {
    // Create user
    const newUser = await User.create({
      phoneNumber,
      password,
      role,
      profileModel: "HospitalProfile",
    });

    // Create hospital profile with phoneNumbers field
    const newHospitalProfile = await HospitalProfile.create({
      owner: newUser._id,
      name,
      licenseNumber,
      type,
      phoneNumbers: [
        {
          label: "primary",
          number: phoneNumber,
        },
      ],
    });

    // Link profile to user
    newUser.profile = newHospitalProfile._id;
    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefeshToken(newUser._id);

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    console.log("Hospital user registered successfully", createdUser);

    const accessTokenOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };

    const refreshTokenOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    };

    return res
      .status(201)
      .cookie("accessToken", accessToken, accessTokenOptions)
      .cookie("refreshToken", refreshToken, refreshTokenOptions)
      .json(
        new ApiResponse(
          201,
          "Hospital registered successfully",
          {
            user: createdUser,
            accessToken,
            refreshToken,
          },
        )
      );
  } catch (error) {
    console.log("Hospital registration error:", error);
    throw new ApiError(500, "Something went wrong while registering hospital");
  }
});

// login controller for hospital
const loginHospitalUser = asyncHandler(async (req, res) => {
  const { phoneNumber, role, password } = req.body;

  if (!phoneNumber) {
    throw new ApiError(400, "Please provide Phone number or password.");
  }

  if (!role || role !== "hospital") {
    throw new ApiError(400, "Invalid role, Access Denied.");
  }

  // find the user
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check user role
  if (user.role !== "hospital") {
    throw new ApiError(403, "Access denied for this user role");
  }

  // check the password
  const isPasswordValid = await user.verifyPassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // send access and refresh token in cookies
  const { accessToken, refreshToken } = await generateAccessAndRefeshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-refreshToken -password");

  const accessTokenOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };

  const refreshTokenOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(
      new ApiResponse(
        200,
        "Hospital user logged in successfully",
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        }
      )
    );
});



export { registerUser, loginUser, getUserData, registerHospitalUser, loginHospitalUser };
