import express from 'express';
const router = express.Router();

// Import controllers
import {
  getMe,
  getTeacherSubjects,
  getTeacherClasses,
  listTeacherAssessments,
  createAssessment,
  getAssessment,
  updateAssessment,
  publishAssessment,
  closeAssessment,
  deleteAssessment,
  addQuestion,
  deleteQuestion,
  getRoster,
  getGradebook,
  getMemorandum,
  releaseMemorandum,
  getStudentSubjects,
  listStudentAssessments,
  startAttempt,
  saveAnswer,
  submitAttempt,
  getSubmission,
  getResult,
  gradeAnswer,
  finalizeSubmission,
} from '../controllers/controller.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

// ============================================================================
// 1. Identity & Context
// ============================================================================
router.get('/me', protect, getMe);

// ============================================================================
// 2. Static / Specific Teacher Routes (Must be before parameterized /:id)
// ============================================================================
router.get('/teacher/subjects', protect, authorize('Teacher'), getTeacherSubjects);
router.get('/teacher/classes', protect, authorize('Teacher'), getTeacherClasses);
router.get('/teacher/list', protect, authorize('Teacher'), listTeacherAssessments);
router.post('/teacher', protect, authorize('Teacher'), createAssessment);

// ============================================================================
// 3. Static / Specific Learner Routes (Must be before parameterized /:id)
// ============================================================================
router.get('/student/subjects', protect, authorize('Learner'), getStudentSubjects);
router.get('/student/list', protect, authorize('Learner'), listStudentAssessments);

// ============================================================================
// 4. Submission & Answer Lifecycle Routes (/submissions & /answers)
// ============================================================================
// Student saving answers & submitting attempt
router.put('/submissions/:id/answers', protect, authorize('Learner'), saveAnswer);
router.post('/submissions/:id/submit', protect, authorize('Learner'), submitAttempt);

// Teacher grading & finalization
router.post('/answers/:id/grade', protect, authorize('Teacher'), gradeAnswer);
router.post('/submissions/:id/finalize', protect, authorize('Teacher'), finalizeSubmission);

// Shared Submission Views (Controller handles ownership/role checks)
router.get('/submissions/:id', protect, authorize('Teacher', 'Learner'), getSubmission);
router.get('/submissions/:id/result', protect, authorize('Teacher', 'Learner'), getResult);

// ============================================================================
// 5. Specific Question & Sub-resource Actions
// ============================================================================
router.delete('/questions/:id', protect, authorize('Teacher'), deleteQuestion);

// ============================================================================
// 6. Parameterized Assessment Actions (/:id/...)
// ============================================================================
router.patch('/:id', protect, authorize('Teacher'), updateAssessment);
router.post('/:id/publish', protect, authorize('Teacher'), publishAssessment);
router.post('/:id/close', protect, authorize('Teacher'), closeAssessment);
router.delete('/:id', protect, authorize('Teacher'), deleteAssessment);
router.post('/:id/questions', protect, authorize('Teacher'), addQuestion);

// Teacher Analytics, Gradebook, and Memorandum
router.get('/:id/roster', protect, authorize('Teacher'), getRoster);
router.get('/:id/gradebook', protect, authorize('Teacher'), getGradebook);
router.get('/:id/memorandum', protect, authorize('Teacher'), getMemorandum);
router.post('/:id/memorandum', protect, authorize('Teacher'), releaseMemorandum);

// Learner Attempt Initialization
router.post('/:id/attempts', protect, authorize('Learner'), startAttempt);

// ============================================================================
// 7. Catch-All Assessment Fetch (MUST STAY AT THE VERY BOTTOM)
// ============================================================================
router.get('/:id', protect, authorize('Teacher', 'Learner'), getAssessment);

export default router;