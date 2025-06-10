import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getAdminDashboardData } from "../controllers/admin.controller.js";
const router = Router();

router
  .route("/dashboard-data")
  .get(verifyJWT(["admin"]), getAdminDashboardData);

export default router;
