// this middleware just verifies if theres a user or not
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { generateAccessAndRefeshToken } from "../controllers/user.controller.js";

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

export const verifyJWT = (roles) =>
  asyncHandler(async (req, res, next) => {
    let accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      throw new ApiError(401, "Unauthorized Request");
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select(
        "-password -refreshToken"
      );

      if (!user) throw new ApiError(401, "Invalid Access Token");
      if (!roles.includes(user.role)) throw new ApiError(403, "Access Denied");

      req.user = user;
      return next();
    } catch (err) {
      // If it's already an ApiError (like your 403), don't override it
      if (err instanceof ApiError) {
        return next(err);
      }

      if (err.name === "TokenExpiredError" && refreshToken) {
        try {
          const decodedRefresh = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
          );
          const user = await User.findById(decodedRefresh._id);

          if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(401, "Invalid Refresh Token");
          }

          //  Generate new tokens using utility
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefeshToken(user._id);

          //  Set cookies
          res.cookie("accessToken", newAccessToken, accessTokenOptions);

          res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);

          res.cookie("is_login", 1, isLoginOptions);

          //  Attach user and proceed
          req.user = await User.findById(user._id).select(
            "-password -refreshToken"
          );
          return next();
        } catch (refreshErr) {
          return next(new ApiError(401, "Refresh Token Expired or Invalid"));
        }
      }

      return next(new ApiError(401, "Invalid Access Token"));
    }
  });
