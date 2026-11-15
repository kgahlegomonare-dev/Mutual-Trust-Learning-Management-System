import express from "express";
const router = express.Router();

import {
  getAttendanceOverviewController,
  getClassAttendanceController,getCentreFlaggingController,
} from "../controllers/controller.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

// Both routes are open to Center Managers and Admins.
// Scoping (own centre vs any centre) is enforced inside the controllers.
const OVERSIGHT_ROLES = [
  "Admin", "admin",
  "Center Manager", "center manager", "CenterManager", "center_manager", "manager",
];

// @route   GET /api/oversight/attendance/overview
// @desc    Centre headline stats + per-class attendance breakdown
router.get(
  "/attendance/overview",
  protect,
  authorize(...OVERSIGHT_ROLES),
  getAttendanceOverviewController
);

// @route   GET /api/oversight/attendance/classes/:class_id
// @desc    A class's sessions + its learners' attendance rates
router.get(
  "/attendance/classes/:class_id",
  protect,
  authorize(...OVERSIGHT_ROLES),
  getClassAttendanceController
);

// @route GET /api/oversight/flagging
router.get(
  "/flagging",
  protect,
  authorize("Center Manager", "center manager", "Admin", "admin"),
  getCentreFlaggingController
);

export default router;