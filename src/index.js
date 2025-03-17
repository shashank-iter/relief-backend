import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
    path: "./env",
});

// First approach to connect to the database

// IFFI for more productive code

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error", (error) => {
//             console.log("Error connecting to database", error);
//         });
//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//     } catch (error) {
//         console.error("Error connecting to database", error);
//     }
// })();
console.log("Hello World");

// As connectDB is a async function it returns a promise.
connectDB()
    .then(() => {
        // listening on errors
        app.on("error", (error) => {
            console.log("Error connecting to database", error);
        });

        console.log("Connected to database");

        // starting server on successful DB connection
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to database", error);
    });
