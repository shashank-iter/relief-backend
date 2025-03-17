// this middleware just verifies if theres a user or not
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next, roles) => {
  try {
    // firstly we are checking if the token is present or not
    const token =
      req.cookies?.accessToken || req.headers("Authorization")?.split(" ")[1];
    // if the token is present in cookies then we access it, or sometime maybe the request may come from the mobile application where the
    // token is not cookies but in the Authorization header, so we check for that too

    const refreshToken = req.cookies?.refreshToken;

    if (!token && !refreshToken) {
      throw new ApiError(401, "Unauthorized Request");
    } 
    else if (!token && refreshToken) {
    
    }
    // if there is no token then we throw an error

    // if token is there, we need to decode that, so we use jwt.verify() method and pass the secret key and the token
    // while making the token this secret key was used so only this can decode it.
    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    // now exract the user id (_id) from the decoded token
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    // if the user is not found then we throw an error
    if (!user) {
      //Frontend Discussion
      throw new ApiError(401, "Invalid Access Token");
    }

    if (!roles.includes(user.role)) {
      throw new ApiError(403, "Access Denied.");
    }

    // if finally the user is found just attach the user to the request object
    // now this user would be available to each controller where this middleware is used
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, "Invalid Access Token");
  }
});
