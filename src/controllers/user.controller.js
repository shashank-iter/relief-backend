import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefeshToken = async (userId) => {
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

const registerGeneralUser = asyncHandler(async (req, res) => {
  // get data from FT
  //validate data [check for the role to be "user"]
  // check if user already exists
  // create user object
  // create entry in DB
  // generate access and refresh token for frontend
  // check if response is successful or not
  // remove and refresh token from responses
  // return res

  console.log(req);
  const { fullName, email, password, phoneNumber, role } = req.body;
  console.log(fullName, email, password, phoneNumber, role);

  //   check if any mandatory data is missing
  if (
    [fullName, role, email, password, phoneNumber].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "Please provide all the fields");
  }

  if (role !== "user") {
    throw new ApiError(400, "Please register as a user.");
  }

  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    throw new ApiError(400, "User with this username or email already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    phoneNumber,
    role,
  });

  // send access and refresh token in cookies
  const { accessToken, refreshToken } = await generateAccessAndRefeshToken(
    user._id
  );

  console.log(accessToken, refreshToken);

  // check if user created successfully
  const createdUser = await User.findById(user._id);
  // console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  console.log("User created successfully", createdUser);

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
    .status(201)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const loginGeneralUser = asyncHandler(async (req, res) => {
  const { email, phoneNumber, role, password } = req.body;

  if (!email && !phoneNumber) {
    throw new ApiError(400, "Please provide username or password.");
  }

  if (!role || role !== "user") {
    throw new ApiError(400, "Invalid role, Access Denied.");
  }

  // find the user
  const user = await User.findOne({
    $or: [{ phoneNumber: phoneNumber }, { email: email }],
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

  // return response
  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
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

export { registerGeneralUser, loginGeneralUser };
