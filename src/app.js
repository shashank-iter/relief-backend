import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// configuration for data coming through the json format
app.use(
  express.json({
    limit: "16kb",
  })
);

// configuration for data coming from urls
app.use(express.urlencoded({ extended: true }));
// extended true allows to parse the nested objects

// configuration for holding temporary data into your server
app.use(express.static("public"));

// configuration for cookieParse
// used to set secure cookies in the browser of client and access it
app.use(cookieParser());

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN],
    credentials: true,
  })
);

//routes declaration
import userRouter from "./routes/user.routes.js";
import patientsRouter from "./routes/patients.routes.js";
import hospitalRouter from "./routes/hospital.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/users/patient", patientsRouter)
app.use("/api/v1/users/hospital", hospitalRouter);

export default app;
