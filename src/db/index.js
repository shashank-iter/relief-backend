import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        console.log("Connecting to database");
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(connectionInstance.connection.host);
        
        
        console.log(`Connected to database ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Error connecting to database", error);
        process.exit(1);
    }
};

export default connectDB;