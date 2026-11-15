import express from "express";

const router = express.Router();

import {
  getOverview,
  getStudentPerformance,
  getOverallAttendance,
  getAttendanceByClass,
  getStudentsBelowAttendanceThreshold,
} from "../controllers/managerReportController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

router.get(
  "/overview",
  protect,
  authorize("Center Manager"),
  getOverview
);

router.get(
  "/student-performance",
  protect,
  authorize("Center Manager"),
  getStudentPerformance
);

router.get(
  "/attendance",
  protect,
  authorize("Center Manager"),
  getOverallAttendance
);

router.get(
  "/attendance-by-class",
  protect,
  authorize("Center Manager"),
  getAttendanceByClass
);

router.get(
  "/students-below-attendance",
  protect,
  authorize("Center Manager"),
  getStudentsBelowAttendanceThreshold
);

export default router;