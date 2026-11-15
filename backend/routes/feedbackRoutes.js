import express from "express";
const router = express.Router();

import {
  createFeedbackFormController,
  getFeedbackFormsController,
  getFeedbackFormController,
  setFeedbackFormStateController,
  getFeedbackResultsController,
} from "../controllers/controller.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

// Managers and Admins build and manage forms.
const MANAGER_ROLES = [
  "Admin", "admin",
  "Center Manager", "center manager", "CenterManager", "center_manager", "manager",
];

// @route   POST /api/feedback/forms
// @desc    Create a form with all its questions in one call
router.post(
  "/forms",
  protect,
  authorize(...MANAGER_ROLES),
  createFeedbackFormController
);

// @route   GET /api/feedback/forms
// @desc    List the centre's forms
router.get(
  "/forms",
  protect,
  authorize(...MANAGER_ROLES),
  getFeedbackFormsController
);

// @route   GET /api/feedback/forms/:form_id
// @desc    One form with its questions
router.get(
  "/forms/:form_id",
  protect,
  authorize(...MANAGER_ROLES),
  getFeedbackFormController
);

// @route   GET /api/feedback/forms/:form_id/results
// @desc    Aggregated, anonymised results for a form
router.get(
  "/forms/:form_id/results",
  protect,
  authorize(...MANAGER_ROLES),
  getFeedbackResultsController
);



// @route   PATCH /api/feedback/forms/:form_id/state
// @desc    Open or close a form for responses
router.patch(
  "/forms/:form_id/state",
  protect,
  authorize(...MANAGER_ROLES),
  setFeedbackFormStateController
);

export default router;