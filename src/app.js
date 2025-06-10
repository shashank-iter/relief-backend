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
    origin: [
      "http://localhost:3000",
      "https://relief-patient.vercel.app",
      "https://relief-hospital-platform.vercel.app",
    ],
    credentials: true,
  })
);

//routes declaration
import userRouter from "./routes/user.routes.js";
import patientsRouter from "./routes/patients.routes.js";
import hospitalRouter from "./routes/hospital.routes.js";
import emerygencyRouter from "./routes/emergency.routes.js";
import adminRouter from "./routes/admin.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/users/patient", patientsRouter);
app.use("/api/v1/users/hospital", hospitalRouter);
app.use("/api/v1/emergency", emerygencyRouter);
app.use("/api/v1/admin", adminRouter);

export default app;
