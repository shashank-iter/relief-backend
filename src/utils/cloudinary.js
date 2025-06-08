import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});



const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      // if file path doesn't exits
      // we can also return thorw new Error("file path is required") to throw an error
      return null;
    }

    // upload the file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(response);

    console.log("file uploaded successfully", response.url);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got successful
    return response;
  } catch (error) {
    // we have to remove the file from the server in case of any error
    console.log(error);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
