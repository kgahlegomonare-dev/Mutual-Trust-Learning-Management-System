import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getOverview, getOrganisationPerformanceTrend, getCenterPerformance,
  getCenterHealth, getCenterDrilldown, getAttendanceTrend, getAttendanceByCenter,
  getLowAttendanceDistribution, getSubjectPerformance, getCapacityAnalytics,
  getTopStudents, exportTopStudents, getSubjectSatisfaction, getReportFilters
} from "../controllers/adminReportController.js";

const router = express.Router();

const ADMIN_ROLES = ["Admin", "admin", "ADMIN"];

router.use(protect, authorize(...ADMIN_ROLES));

// The more specific /top-students/export is registered before /top-students so
// it can never be shadowed by a future param route on the same prefix.
router.get("/top-students/export", exportTopStudents);

router.get("/overview", getOverview);
router.get("/performance-trend", getOrganisationPerformanceTrend);
router.get("/center-performance", getCenterPerformance);
router.get("/center-health", getCenterHealth);
router.get("/center-health/:centerId/drilldown", getCenterDrilldown);
router.get("/attendance-trend", getAttendanceTrend);
router.get("/attendance-by-center", getAttendanceByCenter);
router.get("/low-attendance", getLowAttendanceDistribution);
router.get("/subject-performance", getSubjectPerformance);
router.get("/capacity", getCapacityAnalytics);
router.get("/top-students", getTopStudents);
router.get("/subject-satisfaction", getSubjectSatisfaction);
router.get("/filters", getReportFilters);

export default router;
