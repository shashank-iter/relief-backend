// this middleware just verifies if theres a user or not
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = (roles) =>
  asyncHandler(async (req, res, next) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", ""); // Fixed header access

      const refreshToken = req.cookies?.refreshToken;

      if (!token && !refreshToken) {
        throw new ApiError(401, "Unauthorized Request");
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken"
      );

      if (!roles.includes(user.role)) throw new ApiError(403, "Access Denied");
      if (!user) throw new ApiError(401, "Invalid Access Token");

      req.user = user;
      next();
    } catch (error) {
      next(new ApiError(401, "Invalid Access Token")); // Use next() for error propagation
    }
  });
