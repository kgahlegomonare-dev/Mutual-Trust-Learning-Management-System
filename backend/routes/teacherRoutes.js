import express from "express";
const router = express.Router();

import {
  getMyAssignmentsController, createAttendanceSessionController, getMySessionsController, getSessionRosterController,
  createLessonController,
  getMyLessonsController,
  updateLessonController,
  deleteLessonController,getTeacherFlaggingController,
} from "../controllers/controller.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

// @route   GET /api/teacher/attendance/assignments
router.get(
  "/attendance/assignments",
  protect,
  authorize("Teacher", "teacher"),
  getMyAssignmentsController
);

// @route   POST /api/teacher/attendance/sessions
router.post(
  "/attendance/sessions",
  protect,
  authorize("Teacher", "teacher"),
  createAttendanceSessionController
);


// ---------- LESSON PLANNER ----------

// @route POST /api/teacher/lessons
router.post(
  "/lessons",
  protect,
  authorize("Teacher", "teacher"),
  createLessonController
);

// @route GET /api/teacher/lessons
router.get(
  "/lessons",
  protect,
  authorize("Teacher", "teacher"),
  getMyLessonsController
);

// @route PATCH /api/teacher/lessons/:planner_id
router.patch(
  "/lessons/:planner_id",
  protect,
  authorize("Teacher", "teacher"),
  updateLessonController
);

// @route DELETE /api/teacher/lessons/:planner_id
router.delete(
  "/lessons/:planner_id",
  protect,
  authorize("Teacher", "teacher"),
  deleteLessonController
);


// @route GET /api/teacher/flagging
router.get(
  "/flagging",
  protect,
  authorize("Teacher", "teacher"),
  getTeacherFlaggingController
);
export default router;



// @route   GET /api/teacher/attendance/sessions
// @desc    List the teacher's attendance sessions with present/roster counts
router.get(
  "/attendance/sessions",
  protect,
  authorize("Teacher", "teacher"),
  getMySessionsController
);

// @route   GET /api/teacher/attendance/sessions/:attendance_id
// @desc    Full roster for one session (present + absent + stats)
router.get(
  "/attendance/sessions/:attendance_id",
  protect,
  authorize("Teacher", "teacher"),
  getSessionRosterController
);






//JAY'S TEACHER ROUTES
//--------------------------------------------------------------------------------------------------------------------------

// router.get('/assessments/:id/roster', protect, authorize("Teacher", "teacher"), assessmentsRosterController);

// router.get('/assessments/:id/gradebook', protect, authorize("Teacher", "teacher"), assessmentsGradebookController);

// router.get('/assessments/:id/memorandum', protect, authorize("Teacher", "teacher"), getMemoController);

// router.post('/assessments/:id/memorandum', protect, authorize("Teacher", "teacher"), postMemoController);

