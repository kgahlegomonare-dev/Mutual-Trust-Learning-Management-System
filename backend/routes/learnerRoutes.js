import express from "express";
const router = express.Router();

import {
  submitAttendanceCodeController,
  getMyAttendanceHistoryController,
  getMyAttendanceStatsController,
  getMyFeedbackFormsController,
  getFeedbackFormForLearnerController,
  submitFeedbackController,
  getLearnerLessonsController,
} from "../controllers/controller.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

// @route POST /api/learner/attendance/submit
router.post(
  "/attendance/submit",
  protect,
  authorize("Learner", "learner"),
  submitAttendanceCodeController
);

// @route GET /api/learner/attendance/history
router.get(
  "/attendance/history",
  protect,
  authorize("Learner", "learner"),
  getMyAttendanceHistoryController
);

// @route GET /api/learner/attendance/stats
// @desc  The learner's own attendance percentage, overall and per subject
router.get(
  "/attendance/stats",
  protect,
  authorize("Learner", "learner"),
  getMyAttendanceStatsController
);

// @route GET /api/learner/lessons
// @desc  Lessons for the learner's enrolled classes
router.get(
  "/lessons",
  protect,
  authorize("Learner", "learner"),
  getLearnerLessonsController
);


// ---------- FEEDBACK ----------

// @route GET /api/learner/feedback/forms
// @desc  Forms currently open to this learner
router.get(
  "/feedback/forms",
  protect,
  authorize("Learner", "learner"),
  getMyFeedbackFormsController
);

// @route GET /api/learner/feedback/forms/:form_id
// @desc  A form's questions + the targets this learner may review
router.get(
  "/feedback/forms/:form_id",
  protect,
  authorize("Learner", "learner"),
  getFeedbackFormForLearnerController
);

// @route POST /api/learner/feedback/forms/:form_id/submit
// @desc  Submit a completed form anonymously
router.post(
  "/feedback/forms/:form_id/submit",
  protect,
  authorize("Learner", "learner"),
  submitFeedbackController
);

export default router;