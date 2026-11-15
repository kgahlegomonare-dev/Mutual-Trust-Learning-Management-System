import express from 'express';
const router = express.Router();


// Note the .js extensions
import { loginUserController, verifyId, registerCenterManagerController, registerTeacherController, registerLearnerController } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';



//----------------- Public Auth Routes ------------------

router.post('/verify-id', verifyId);


/**
 * @route   POST /api/users/register-manager
 * @desc    Admin registers a new Center Manager and sends an invitation
 * @access  Private (Admin Only)
 */
router.post("/register-manager", protect, authorize("Admin"), registerCenterManagerController);

/**
 * @route   POST /api/users/register-teacher
 * @desc    Center Manager registers an instructor for their assigned center
 * @access  Private (Center Manager Only)
 */
router.post("/register-teacher", protect, authorize("Center Manager"), registerTeacherController);



/**
 * @route   POST /api/users/register-learner
 * @desc    Center Manager registers a student under their assigned center
 * @access  Private (Center Manager Only)
 */
router.post("/register-learner", protect, authorize("Center Manager"), registerLearnerController);


/**
 * @route   POST /api/users/login
 * @desc    Authenticates professional user identifiers and distributes JWT session access tokens
 * @access  Public (Unprotected)
 */
router.post("/login", loginUserController);

export default router;