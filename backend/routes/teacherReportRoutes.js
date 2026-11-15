import express from "express";

import {
  getOverview,
  getSubjects,
  getClasses,
  getPerformanceTrend,
  getSubjectPerformance,
  getClassPerformance,
  getAttendanceTrend,
  getStudentRanking,
  getInterventionStudents,
} from "../controllers/teacherReportController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/overview", protect, authorize('Teacher', 'teacher'), getOverview);

router.get("/subjects", protect, authorize("Teacher", "teacher"), getSubjects);

router.get("/classes", protect, authorize("Teacher", "teacher"), getClasses);

router.get("/performance-trend", protect, authorize("Teacher", "teacher"), getPerformanceTrend);

router.get("/subject-performance", protect, authorize("Teacher", "teacher"), getSubjectPerformance);

router.get("/class-performance", protect, authorize("Teacher", "teacher"), getClassPerformance);

router.get("/attendance-trend", protect, authorize("Teacher", "teacher"), getAttendanceTrend);

router.get("/student-ranking", protect, authorize("Teacher", "teacher"), getStudentRanking);

router.get("/intervention-students", protect, authorize("Teacher", "teacher"), getInterventionStudents);

export default router;