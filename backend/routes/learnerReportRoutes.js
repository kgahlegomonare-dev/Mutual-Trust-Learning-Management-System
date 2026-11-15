import express from "express";

import {
  getOverview,
  getSubjectPerformance,
  getPerformanceTrend,
  getAssessmentResults,
  getAttendance,
  getUpcomingAssessments,
} from "../controllers/learnerReportController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, authorize("Learner"), getOverview);

router.get("/subject-performance", protect, authorize("Learner"), getSubjectPerformance);

router.get("/performance-trends", protect, authorize("Learner"), getPerformanceTrend);

router.get("/assessment-results", protect, authorize("Learner"), getAssessmentResults);

router.get("/attendance", protect, authorize("Learner"), getAttendance);

router.get("/upcoming-assessments", protect, authorize("Learner"), getUpcomingAssessments);

export default router;