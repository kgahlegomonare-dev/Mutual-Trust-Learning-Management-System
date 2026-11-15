import express from 'express';
const router = express.Router();

// Note the .js extension - required for ES Modules
import {
  createCenter, updateCenter, getCenter, fetchAllCenters, removeCenter, completeProfileController, 
  getUsersByRoleController, searchUsersController, updateUserController, deactivateUserController,
  deactivateClass, updateClassroom, getClass, getClasses, createClass,
  createTimetableSlot, getTimetableSlot, updateTimetableSlot, removeTimetableSlot, getClassTimetable,
  createSubject, getSubject, getSubjects, updateSubject, removeSubject,
  createAssignment, getClassAssignments, getTeacherAssignmentsList, deleteAssignment,
  createLearnerEnrollment, getEnrollmentsByClassAndSubjectController, getLearnerEnrollments, deleteLearnerEnrollment,
  
  //JAY'S controllers
  getMe,
  getTeacherSubjects, getTeacherClasses,
  listTeacherAssessments, createAssessment, getAssessment, updateAssessment,
  publishAssessment, closeAssessment, deleteAssessment,
  addQuestion, deleteQuestion,
  getRoster, getGradebook, getMemorandum, releaseMemorandum,
  getStudentSubjects, listStudentAssessments,
  startAttempt, saveAnswer, submitAttempt, getSubmission, getResult,
  gradeAnswer, finalizeSubmission,
} from '../controllers/controller.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

/**
 * Route: POST /api/admin/register-staff
 * Access: Private (Admin Only)
 */

// CENTER ROUTES
// --------------------------------------------------------------------------------------------------

// ==================================================================================================
// CENTER ROUTES (Mounted under: /api)
// ==================================================================================================

// POST: /api/centers
router.post('/centers', protect, authorize('Admin', 'admin'), createCenter);

// GET: /api/centers/all
router.get('/centers/all', protect, authorize('Admin', 'admin'), fetchAllCenters);

// GET: /api/centers/:id
router.get('/centers/:id', protect, authorize('Admin', 'admin'), getCenter);

// PUT: /api/centers/:id
router.put('/centers/:id', protect, authorize('Admin', 'admin'), updateCenter);

// PATCH: /api/centers/deactivate/:id
router.patch('/centers/deactivate/:id', protect, authorize('Admin', 'admin'), removeCenter);
// --------------------------------------------------------------------------------------------------


// USER ROUTES
// -------------------------------------------------------------------------------------------------
/**
 * @route   PUT /api/users/complete-profile
 * @desc    Onboarding landing spot for any newly registered user to set their names and permanent password
 * @access  Private (Any authenticated user with an active token)
 */
router.put("/complete-profile", protect, completeProfileController);

/**
 * @route   GET /api/users/search
 * @desc    Search users by name across the system with an optional role scope query (?query=John&role=Teacher)
 * @access  Private (Admin and Center Managers)
 */
router.get("/users/search", protect, authorize("Admin", "admin", "Center Manager", "center manager"), searchUsersController);

/**
 * @route   GET /api/users
 * @desc    Fetch lists of active users filtered by their role (passed via query string: ?role=Teacher)
 * @access  Private (Restricted to management tiers: Admin and Center Manager)
 */
router.get("/users", protect, authorize("Admin", "admin", "Center Manager", "center manager"), getUsersByRoleController);

/**
 * @route   PUT /api/users/:id
 * @desc    Modify core details of an existing user account and conditional sub-table details
 * @access  Private (Admin and Center Managers)
 */
router.put("/users/:id", protect, authorize("Admin", "admin", "Center Manager", "center manager"), updateUserController);

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Soft-deactivate an account using a flag change and log an audit reason string
 * @access  Private (Admin and Center Managers)
 */
router.patch("/users/:id/deactivate", protect, authorize("Admin", "admin", "Center Manager", "center manager"), deactivateUserController);
// -------------------------------------------------------------------------------------------------


// CLASSROOM ROUTES
// --------------------------------------------------------------------------------------------------

// @route   POST /api/manager/classes
router.post('/manager/classes', protect, authorize('CenterManager', 'center_manager', 'Center Manager', 'manager'), createClass);

// @route   GET /api/manager/classes
router.get('/manager/classes', protect, authorize('CenterManager', 'center_manager', 'Center Manager', 'manager'), getClasses);

// @route   GET /api/manager/classes/:id
router.get('/manager/classes/:id', protect, authorize('CenterManager', 'center_manager', 'Center Manager', 'manager'), getClass);

// @route   PUT /api/manager/classes/:id
router.put('/manager/classes/:id', protect, authorize('CenterManager', 'center_manager', 'Center Manager', 'manager'), updateClassroom);

// @route   PATCH /api/manager/classes/:id/deactivate
router.patch('/manager/classes/:id/deactivate', protect, authorize('CenterManager', 'center_manager', 'Center Manager', 'manager'), deactivateClass);
// --------------------------------------------------------------------------------------------------


// Timetable ROUTES
// --------------------------------------------------------------------------------------------------

// @route   POST /api/manager/timetables
router.post('/manager/timetables', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), createTimetableSlot);

// @route   GET /api/manager/timetables/:id
router.get('/manager/timetables/:id', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), getTimetableSlot);

// @route   PUT /api/manager/timetables/:id
router.put('/manager/timetables/:id', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), updateTimetableSlot);

// @route   DELETE /api/manager/timetables/:id
router.delete('/manager/timetables/:id', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), removeTimetableSlot);

// @route   GET /api/manager/classes/:class_id/timetable
router.get('/manager/classes/:class_id/timetable', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), getClassTimetable);
// --------------------------------------------------------------------------------------------------


//SUBJECT ROUTES
// --------------------------------------------------------------------------------------------------
// @route   POST /api/manager/subjects
router.post('/manager/subjects', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), createSubject);

// @route   GET /api/manager/subjects
router.get('/manager/subjects', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), getSubjects);

// @route   GET /api/manager/subjects/:id
router.get('/manager/subjects/:id', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), getSubject);

// @route   PUT /api/manager/subjects/:id
router.put('/manager/subjects/:id', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), updateSubject);

// @route   DELETE /api/manager/subjects/:id
router.delete('/manager/subjects/:id', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), removeSubject);
// --------------------------------------------------------------------------------------------------


//TEACHER ASSIGNMENT
// --------------------------------------------------------------------------------------------------

// @route   POST /api/manager/assignments
router.post('/manager/assignments', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), createAssignment);

// @route   GET /api/manager/classes/:class_id/assignments
router.get('/manager/classes/:class_id/assignments', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), getClassAssignments);

// @route   GET /api/manager/teachers/:teacher_id/assignments
router.get('/manager/teachers/:teacher_id/assignments', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), getTeacherAssignmentsList);

// @route   DELETE /api/manager/assignments/:id
router.delete('/manager/assignments/:id', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), deleteAssignment);
// --------------------------------------------------------------------------------------------------


// LEARNER ENROLLMENT MANAGEMENT ROUTES
// --------------------------------------------------------------------------------------------------

// @route   POST /api/manager/enrollments
router.post('/manager/enrollments', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), createLearnerEnrollment);

// @route   GET /api/manager/classes/:class_id/subjects/:subject_id/enrollments
router.get('/manager/classes/:class_id/subjects/:subject_id/enrollments', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), getEnrollmentsByClassAndSubjectController);

// @route   GET /api/manager/learners/:learner_id/enrollments
router.get('/manager/learners/:learner_id/enrollments', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), getLearnerEnrollments);

// @route   DELETE /api/manager/enrollments/:enrollment_id
router.delete('/manager/enrollments/:enrollment_id', protect, authorize('Admin', 'admin', 'CenterManager', 'center_manager', 'Center Manager', 'manager'), deleteLearnerEnrollment);
// --------------------------------------------------------------------------------------------------




//JAY'S ROUTES
// -----------------------------------------------------------------------------------------------------------------------
// Identity
router.get('/me', getMe);

// Teacher: subjects/classes derived from teacher_assignments
router.get('/teacher/subjects', protect, authorize('Teacher'), getTeacherSubjects);
router.get('/teacher/classes', protect, authorize('Teacher'), getTeacherClasses);

// Teacher: assessment CRUD
router.get('/teacher/list', protect, authorize('Teacher'), listTeacherAssessments);
router.post('/teacher', protect, authorize('Teacher'), createAssessment);
router.patch('/:id', protect, authorize('Teacher'), updateAssessment);
router.post('/:id/publish', protect, authorize('Teacher'), publishAssessment);
router.post('/:id/close', protect, authorize('Teacher'), closeAssessment);
router.delete('/:id', protect, authorize('Teacher'), deleteAssessment);
router.post('/:id/questions', protect, authorize('Teacher'), addQuestion);
router.delete('/questions/:id', protect, authorize('Teacher'), deleteQuestion);

// Teacher: completion tracking / gradebook / memorandum
router.get('/:id/roster', protect, authorize('Teacher'), getRoster);
router.get('/:id/gradebook', protect, authorize('Teacher'), getGradebook);
router.get('/:id/memorandum', protect, authorize('Teacher'), getMemorandum);
router.post('/:id/memorandum', protect, authorize('Teacher'), releaseMemorandum);
router.put('/answers/:id/grade', protect, authorize('Teacher'), gradeAnswer);
router.post('/submissions/:id/finalize', protect, authorize('Teacher'), finalizeSubmission);

// Learner: subjects / assessment list / taking a quiz
router.get('/student/subjects', protect, authorize('Learner'), getStudentSubjects);
router.get('/student/list', protect, authorize('Learner'), listStudentAssessments);
router.post('/:id/attempts', protect, authorize('Learner'), startAttempt);
router.put('/submissions/:id/answers', protect, authorize('Learner'), saveAnswer);
router.post('/submissions/:id/submit', protect, authorize('Learner'), submitAttempt);

// Shared (ownership checked inside the controller for both roles)
router.get('/submissions/:id', protect, authorize('Teacher', 'Learner'), getSubmission);
router.get('/submissions/:id/result', protect, authorize('Teacher', 'Learner'), getResult);

// NOTE: keep this LAST — it's a catch-all single-:id GET and would otherwise
// shadow more specific routes like /teacher/list if placed above them.
router.get('/:id', protect, authorize('Teacher', 'Learner'), getAssessment);
export default router;

/** I have Added the Reports Routes in a different file */