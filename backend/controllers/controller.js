import { addCenter,getAllCenters,getCenterById,updateCenterDetails,deactivateCenter,
        claimAndCompleteProfile,getAllUsersByRole,searchUsersByName,updateUserBaseDetails,softDeactivateUser,
        addClassroom, getClassroomById, updateClassroomDetails, getClassesByCenter, deactivateClassroom, 
		addTimetable, getTimetableById, updateTimetableDetails, deleteTimetableSlot, getClassTimetableDashboard,
		addSubject, getSubjectById, getAllSubjects, getSubjectsByGrade, updateSubjectDetails, deleteSubject,
		assignTeacherToClass,getAssignmentsByClass,getAssignmentsByTeacher,removeTeacherAssignment,
        enrollLearnerToClass,getEnrollmentsByClassAndSubject,getEnrollmentsByLearner,removeLearnerEnrollment,teacherOwnsAssignment, createAttendanceSession,findOpenSessionByCode, isLearnerEnrolled,
        markLearnerPresent, getLearnerAttendanceHistory,getSessionsByTeacher, teacherOwnsSession, getSessionRoster,getCenterAttendanceOverview, getSessionsByClass,
        getLearnerRatesByClass, classBelongsToCenter, createFeedbackForm, getFormsByCenter, getFormWithQuestions,
        setFormOpenState, formBelongsToCenter,getOpenFormsForLearner, getFeedbackTargetsForLearner,
        hasLearnerCompleted, submitFeedbackResponse,getFormResults,
        getLearnerOwnAttendanceStats,teacherTeachesClass, createLessonPlan, getLessonsByTeacher,
        teacherOwnsLesson, updateLessonPlan, deleteLessonPlan,
        getLessonsForLearner,getLearnersForTeacher, getLearnersForCentre, getUserCentre,
        computeRiskForLearners,
		
		

    } from '../config/db.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { pool } from '../config/db.js';
import { autoGradeObjectiveAnswers, recomputeSubmissionStatus } from './gradingService.js';
import { getAssessmentWithQuestions, getSubmissionWithAnswers } from './serialize.js';




// Configure your transporter (use environment variables for credentials!)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});




// CENTER ROUTES
// ----------------------------------------------------------------------------------------------------------------------------
// @desc    Create a new center
// @route   POST /api/admin/centers
export const createCenter = async (req, res) => {
    try {
        const { center_name, location_address, center_capacity, province } = req.body;

        if (!center_name || !location_address || !center_capacity || !province) {
            return res.status(400).json({ message: "Please provide all required center details." });
        }

        const newCenter = await addCenter(
            center_name, 
            location_address, 
            parseInt(center_capacity, 10), 
            province 
        );

        if (!newCenter) {
            return res.status(500).json({ message: "Failed to create center." });
        }

        res.status(201).json({
            message: "Center created successfully",
            center: newCenter
        });
    } catch (error) {
        console.error("Controller Error (createCenter):", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Get a single center by ID
// @route   GET /api/admin/centers/:id
export const getCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const center = await getCenterById(id); 

        if (!center) {
            return res.status(404).json({ message: "Center not found." });
        }

        res.status(200).json(center); 
    } catch (error) {
        console.error("Controller Error (getCenter):", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Update existing center details
// @route   PUT /api/admin/centers/:id
export const updateCenter = async (req, res) => {
    try {
        const { id } = req.params; // ID comes directly from the URL route parameter
        const { center_name, location_address, center_capacity, province } = req.body;

        if (!center_name || !location_address || !center_capacity || !province) {
            return res.status(400).json({ 
                message: "Missing update values. Center name, location address, capacity, and province are all required." 
            });
        }

        // Uses clean ID-based database function
        const updatedCenter = await updateCenterDetails(id, {
            center_name: center_name,
            center_address: location_address,
            center_capacity: parseInt(center_capacity, 10),
            center_province: province
        });

        if (!updatedCenter) {
            return res.status(404).json({ message: "Active center matching criteria could not be located." });
        }

        return res.status(200).json({
            message: "Center metrics modified successfully.",
            center: updatedCenter
        });
        
    } catch (error) {
        console.error("Controller Error (updateCenter):", error);
        return res.status(500).json({ message: "Internal server error occurred while processing changes." });
    }
};

// @desc    Get all centers
// @route   GET /api/admin/centers/all
export const fetchAllCenters = async (req, res) => {
    try {
        const centers = await getAllCenters(false);
        res.status(200).json(centers);
    } catch (error) {
        console.error("Controller Error (fetchAllCenters):", error);
        res.status(500).json({ message: "Internal Server Error fetching centers." });
    }
};

// @desc    Deactivate a center (Soft Delete)
// @route   PATCH /api/admin/centers/deactivate/:id
export const removeCenter = async (req, res) => {
    try {
        const { id } = req.params; // ID comes from route parameters
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: "An explicit justification reason is required." });
        }

        // Uses clean ID-based deactivation function
        const deactivatedCenter = await deactivateCenter(id, reason);

        if (!deactivatedCenter) {
            return res.status(404).json({ message: "Active center matching criteria could not be located." });
        }

        return res.status(200).json({
            message: "Center status marked inactive successfully.",
            center: deactivatedCenter
        });
    } catch (error) {
        console.error("Controller Error (removeCenter):", error);
        return res.status(500).json({ message: "Internal server error occurred during center deactivation." });
    }
};


// --------------------------------------------------------------------------------------------------------------------------




// USER ROUTES
// ------------------------------------------------------------------------------------------------------------------------------

// Controller for Profile Onboarding Completion
export const completeProfileController = async (req, res) => {
  const { first_name, last_name, new_password } = req.body;
  
  // Extract token parameters injected dynamically by your protect/verifyJWT middleware
  const user_id = req.user?.user_id;
  const isAlreadyClaimed = req.user?.is_profile_claimed;

  // 1. Guard against re-onboarding a claimed profile
  if (isAlreadyClaimed) {
    return res.status(400).json({ 
      message: "Bad Request: This profile workspace has already been claimed and initialized." 
    });
  }

  if (!first_name || !last_name || !new_password) {
    return res.status(400).json({ message: "First name, last name, and your new password selection are required." });
  }

  try {
    const saltRounds = 10;
    const encryptedHash = await bcrypt.hash(new_password, saltRounds);

    const result = await claimAndCompleteProfile(user_id, first_name, last_name, encryptedHash);

    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(200).json({
      message: "Profile workspace claimed and structured successfully.",
      user: result.data
    });
  } catch (error) {
    console.error("Complete Profile Controller Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};


// Controller to View Users By Selected Role Type
export const getUsersByRoleController = async (req, res) => {
  const { role } = req.query;

  console.log("📡 [Backend] Controller invoked. Incoming Query Filter Role Parameter:", role);
  console.log("🔑 [Backend] Current Authenticated User Context session (req.user):", req.user);

  if (!role) {
    return res.status(400).json({ message: "Target role parameter filter must be provided." });
  }

  try {
    const result = await getAllUsersByRole(role);

    console.log(`🗄️ [Backend] Database query returned status ${result.status}. Total raw row count found:`, result.data?.length);


    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.error });
    }

    // Filter results locally if the requester is a Center Manager (Sandboxing isolation)
    let filteredData = result.data;


    if (req.user && req.user.user_role === 'Center Manager') {
      console.log(`🛡️ [Backend] Applying sandbox boundary isolation filter for Center ID:`, req.user.center_id);
      filteredData = result.data.filter(user => user.center_id === req.user.center_id);
      console.log(`🛡️ [Backend] Row count remaining post-sandbox filtration match:`, filteredData.length);
    }

    console.log("📤 [Backend] Dispatching response JSON wrapper payload array payload to client.");
    return res.status(200).json({ data: filteredData });
  } catch (error) {
    console.error("Get Users By Role Controller Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};


// Controller to Search Users with Built-in Campus Boundary Checking
export const searchUsersController = async (req, res) => {
  const { query, role } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Search query text parameter is required." });
  }

  try {
    const result = await searchUsersByName(query, role || null);

    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.error });
    }

    // Ensure Center Managers can't sneakily look up users from other campuses
    let filteredData = result.data;
    if (req.user && req.user.user_role === 'Center Manager') {
      filteredData = result.data.filter(user => user.center_id === req.user.center_id);
    }

    return res.status(200).json({ data: filteredData });
  } catch (error) {
    console.error("Search Users Controller Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};


// UPDATE USER CONTROLLER (With Cross-Campus Tenant Protection)
export const updateUserController = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role, grade, highschool } = req.body;

  if (!first_name || !last_name || !email || !role) {
    return res.status(400).json({ message: "Core profile fields (first_name, last_name, email, role) are required." });
  }

  try {
    const targetUserId = parseInt(id, 10);

    // 1. If the operator is a Center Manager, verify they own this user's profile context
    if (req.user && req.user.user_role === 'Center Manager') {
      // Re-using our secure login fetch layout to verify the target user's campus context
      const targetUserQuery = await authenticateUserLogin(targetUserId); 
      if (targetUserQuery.status !== 200 || targetUserQuery.data.center_id !== req.user.center_id) {
        return res.status(403).json({ message: "Access Denied: You cannot modify accounts outside your assigned center." });
      }
    }

    // 2. Perform the update operation safely
    const result = await updateUserBaseDetails(
      targetUserId,
      first_name,
      last_name,
      email,
      role,
      grade ? parseInt(grade, 10) : null,
      highschool || null
    );

    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error("Update User Controller Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};


// DEACTIVATE USER CONTROLLER (With Cross-Campus Tenant Protection)
export const deactivateUserController = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: "An administrative reason for account deactivation is required." });
  }

  try {
    const targetUserId = parseInt(id, 10);

    // 1. Verify cross-campus administrative tenant permissions
    if (req.user && req.user.user_role === 'Center Manager') {
      // Fallback fallback: Grab the target account details to verify center matching parameters
      const targetUserQuery = await authenticateUserLogin(targetUserId);
      if (targetUserQuery.status !== 200 || targetUserQuery.data.center_id !== req.user.center_id) {
        return res.status(403).json({ message: "Access Denied: You cannot deactivate accounts outside your assigned center." });
      }
    }

    // 2. Perform the soft deactivation step safely
    const result = await softDeactivateUser(targetUserId, reason);

    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(200).json({
      message: "User account successfully soft-deactivated.",
      data: result.data
    });
  } catch (error) {
    console.error("Deactivate User Controller Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};
// --------------------------------------------------------------------------------------------------------------------------------



// ================= CLASS CONTROLLERS =================
// ----------------------------------------------------------------------------------------------------------------------

// @desc    Create class venue
// @route   POST /api/manager/classes
export const createClass = async (req, res) => {
    try {
        const { class_name, class_capacity } = req.body;
        const center_id = req.user.center_id; // Securely verified from active JWT token context

        if (!class_name || !class_capacity) {
            return res.status(400).json({ message: "All fields required" });
        }

        const result = await addClassroom(
            class_name,
            parseInt(class_capacity),
            center_id
        );

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(201).json({
            message: "Class created successfully",
            data: result.data // Fixed: Send the raw row object data cleanly
        });

    } catch (error) {
        console.error("createClass error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// @desc    Get all classes (for a center)
// @route   GET /api/manager/classes
export const getClasses = async (req, res) => {
    try {
        const center_id = req.user.center_id;

        // Fixed: Swapped placeholder for our explicit center isolation helper
        const result = await getClassesByCenter(center_id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);

    } catch (error) {
        console.error("getClasses error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// @desc    Get single class
// @route   GET /api/manager/classes/:id
export const getClass = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await getClassroomById(id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data); // Fixed: Extract the object entry cleanly

    } catch (error) {
        console.error("getClass error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// @desc    Update class
// @route   PUT /api/manager/classes/:id
export const updateClassroom = async (req, res) => {
    try {
        const { id } = req.params;
        const { class_name, class_capacity } = req.body;

        const result = await updateClassroomDetails(
            id,
            class_name,
            parseInt(class_capacity)
        );

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json({
            message: "Class updated successfully",
            data: result.data
        });

    } catch (error) {
        console.error("updateClass error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// @desc    Deactivate class
// @route   PATCH /api/manager/classes/:id/deactivate
export const deactivateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // Fixed: Capture the management audit log tracking text string

        const result = await deactivateClassroom(id, reason || "No administrative reason provided.");

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json({
            message: "Class deactivated successfully",
            data: result.data
        });

    } catch (error) {
        console.error("deactivateClass error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ----------------------------------------------------------------------------------------------------------------------


// TIMETABLE CONTROLLERS
// ----------------------------------------------------------------------------------------------------------------------

// @desc    Create a new timetable slot assignment
// @route   POST /api/manager/timetables
export const createTimetableSlot = async (req, res) => {
    try {
        const { assignment_id, timetable_day, start_time, end_time } = req.body;

        if (!assignment_id || !timetable_day || !start_time || !end_time) {
            return res.status(400).json({ message: "All scheduling fields are required" });
        }

        // Validate day input matches your ENUM format limits
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        if (!validDays.includes(timetable_day.toLowerCase())) {
            return res.status(400).json({ message: "Invalid weekday value. Must be Monday through Friday." });
        }

        const result = await addTimetable(assignment_id, timetable_day, start_time, end_time);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(201).json({
            message: "Timetable session entry successfully created",
            data: result.data
        });

    } catch (error) {
        console.error("createTimetableSlot error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Get details for a single specific timetable slot
// @route   GET /api/manager/timetables/:id
export const getTimetableSlot = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await getTimetableById(id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);

    } catch (error) {
        console.error("getTimetableSlot error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Update an existing timetable slot record
// @route   PUT /api/manager/timetables/:id
export const updateTimetableSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignment_id, timetable_day, start_time, end_time } = req.body;

        if (!assignment_id || !timetable_day || !start_time || !end_time) {
            return res.status(400).json({ message: "All scheduling properties are required" });
        }

        const result = await updateTimetableDetails(id, assignment_id, timetable_day, start_time, end_time);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json({
            message: "Timetable record updated successfully",
            data: result.data
        });

    } catch (error) {
        console.error("updateTimetableSlot error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Hard remove a timetable calendar block
// @route   DELETE /api/manager/timetables/:id
export const removeTimetableSlot = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await deleteTimetableSlot(id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json({ message: result.data.message });

    } catch (error) {
        console.error("removeTimetableSlot error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Get entire visual calendar schedule matrix for a classroom
// @route   GET /api/manager/classes/:class_id/timetable
export const getClassTimetable = async (req, res) => {
    try {
        const { class_id } = req.params;

        // Uses our aggregate helper with table joins to supply rich information
        const result = await getClassTimetableDashboard(class_id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);

    } catch (error) {
        console.error("getClassTimetable error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ----------------------------------------------------------------------------------------------------------------------

//SUBJECT CONTROLLERS
// ----------------------------------------------------------------------------------------------------------------------
// @desc    Create a new subject curriculum record
// @route   POST /api/manager/subjects
export const createSubject = async (req, res) => {
    try {
        const { subject_name, subject_code, grade } = req.body;

        if (!subject_name || !subject_code || !grade) {
            return res.status(400).json({ message: "All subject field values are required" });
        }

        const result = await addSubject(subject_name, subject_code, grade);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(201).json({
            message: "Subject successfully registered in system database",
            data: result.data
        });

    } catch (error) {
        console.error("createSubject error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Get details for a single specific subject
// @route   GET /api/manager/subjects/:id
export const getSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await getSubjectById(id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);

    } catch (error) {
        console.error("getSubject error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Get all subjects (optionally filtered by a specific grade query)
// @route   GET /api/manager/subjects
export const getSubjects = async (req, res) => {
    try {
        const { grade } = req.query;
        let result;

        // If a query parameter like /api/manager/subjects?grade=10 is provided, use filter
        if (grade) {
            result = await getSubjectsByGrade(grade);
        } else {
            result = await getAllSubjects();
        }

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);

    } catch (error) {
        console.error("getSubjects error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Modify parameters of an existing academic subject
// @route   PUT /api/manager/subjects/:id
export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject_name, subject_code, grade } = req.body;

        if (!subject_name || !subject_code || !grade) {
            return res.status(400).json({ message: "All subject values are required for modifications" });
        }

        const result = await updateSubjectDetails(id, subject_name, subject_code, grade);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json({
            message: "Subject parameters successfully modified",
            data: result.data
        });

    } catch (error) {
        console.error("updateSubject error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Permanently delete an academic subject from curriculum
// @route   DELETE /api/manager/subjects/:id
export const removeSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await deleteSubject(id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json({ message: result.data.message });

    } catch (error) {
        console.error("removeSubject error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// ----------------------------------------------------------------------------------------------------------------------


//TEACHER ASSIGNMENT
// ----------------------------------------------------------------------------------------------------------------------
// @desc    Allocate a teacher to a specific subject and classroom venue
// @route   POST /api/manager/assignments
export const createAssignment = async (req, res) => {
    try {
        const { teacher_id, subject_id, class_id,grade } = req.body;

        if (!teacher_id || !subject_id || !class_id) {
            return res.status(400).json({ message: "Teacher, subject, and class ID selections are all required." });
        }

        const result = await assignTeacherToClass(teacher_id, subject_id, class_id,grade);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(201).json({
            message: "Teacher successfully assigned to classroom curriculum link.",
            data: result.data
        });

    } catch (error) {
        console.error("createAssignment error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Get all teacher assignments bound to a specific classroom
// @route   GET /api/manager/classes/:class_id/assignments
export const getClassAssignments = async (req, res) => {
    try {
        const { class_id } = req.params;

        const result = await getAssignmentsByClass(class_id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);

    } catch (error) {
        console.error("getClassAssignments error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Get all structural assignments linked to a specific teacher profile
// @route   GET /api/manager/teachers/:teacher_id/assignments
export const getTeacherAssignmentsList = async (req, res) => {
    try {
        const { teacher_id } = req.params;

        const result = await getAssignmentsByTeacher(teacher_id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);

    } catch (error) {
        console.error("getTeacherAssignmentsList error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc    Deallocate a teacher assignment structure link
// @route   DELETE /api/manager/assignments/:id
export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await removeTeacherAssignment(id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json({ message: result.data.message });

    } catch (error) {
        console.error("deleteAssignment error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// ----------------------------------------------------------------------------------------------------------------------







//LEARNER ASSIGNMENT
// ----------------------------------------------------------------------------------------------------------------------
// @desc Enroll a learner into a subject inside a specific classroom space
// @route POST /api/enrollments
export const createLearnerEnrollment = async (req, res) => {
    try {
        const { learner_id, subject_id, class_id } = req.body;

        // Simple validation check for mandatory payload vectors
        if (!learner_id || !subject_id || !class_id) {
            return res.status(400).json({ message: "Missing required fields: learner_id, subject_id, and class_id are mandatory." });
        }

        const result = await enrollLearnerToClass(learner_id, subject_id, class_id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(201).json(result.data);
    } catch (error) {
        console.error("createLearnerEnrollment error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc Get all enrolled learners for a specific subject within a classroom space
// @route GET /api/enrollments/class/:class_id/subject/:subject_id
export const getEnrollmentsByClassAndSubjectController = async (req, res) => {
    try {
        const { class_id, subject_id } = req.params;

        const result = await getEnrollmentsByClassAndSubject(class_id, subject_id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);
    } catch (error) {
        console.error("getEnrollmentsByClassAndSubjectController error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc Retrieve subject and class matrix records assigned to a single learner user
// @route GET /api/enrollments/learner/:learner_id
export const getLearnerEnrollments = async (req, res) => {
    try {
        const { learner_id } = req.params;

        const result = await getEnrollmentsByLearner(learner_id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);
    } catch (error) {
        console.error("getLearnerEnrollments error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @desc Remove a learner enrollment track record entirely 
// @route DELETE /api/enrollments/:enrollment_id
export const deleteLearnerEnrollment = async (req, res) => {
    try {
        const { enrollment_id } = req.params;

        const result = await removeLearnerEnrollment(enrollment_id);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json(result.data);
    } catch (error) {
        console.error("deleteLearnerEnrollment error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ----------------------------------------------------------------------------------------------------------------------









// =====================================================================
// ATTENDANCE CONTROLLERS (owner: Vhutali)
// =====================================================================

// @desc    List the logged-in teacher's assignments (for the dropdown)
// @route   GET /api/teacher/attendance/assignments
// @access  Private (Teacher)
export const getMyAssignmentsController = async (req, res) => {
  try {
    const teacher_user_id = req.user.user_id;

    const result = await getAssignmentsByTeacher(teacher_user_id);

    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    res.status(200).json(result.data);
  } catch (error) {
    console.error("getMyAssignmentsController error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Open an attendance session and return the generated code
// @route   POST /api/teacher/attendance/sessions
// @access  Private (Teacher)
export const createAttendanceSessionController = async (req, res) => {
  try {
    const teacher_user_id = req.user.user_id;
    const { assignment_id, timetable_id } = req.body;

    if (!assignment_id) {
      return res.status(400).json({ message: "assignment_id is required." });
    }

    const owns = await teacherOwnsAssignment(teacher_user_id, parseInt(assignment_id, 10));
    if (!owns) {
      return res.status(403).json({
        message: "You can only take attendance for your own assignments.",
      });
    }

    const result = await createAttendanceSession(
      parseInt(assignment_id, 10),
      timetable_id ? parseInt(timetable_id, 10) : null,
      10
    );

    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    res.status(201).json({
      message: "Attendance session opened.",
      data: result.data,
    });
  } catch (error) {
    console.error("createAttendanceSessionController error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




// =====================================================================
// STUDENT ATTENDANCE CONTROLLERS (owner: Vhutali)
// =====================================================================

// @desc    Learner submits an attendance code to mark themselves present.
// @route   POST /api/learner/attendance/submit
// @access  Private (Learner)
export const submitAttendanceCodeController = async (req, res) => {
  try {
    const learner_user_id = req.user.user_id;
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Please enter an attendance code." });
    }

    // 1. Find the session for this code
    const session = await findOpenSessionByCode(code);
    if (!session) {
      return res.status(404).json({ message: "Invalid code. Please check and try again." });
    }

    // 2. Still open and not expired?
    if (session.status !== "open") {
      return res.status(410).json({ message: "This attendance session has closed." });
    }
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      return res.status(410).json({ message: "This code has expired." });
    }

    // 3. Is the learner enrolled in this class + subject?
    const enrolled = await isLearnerEnrolled(
      learner_user_id,
      session.class_id,
      session.subject_id
    );
    if (!enrolled) {
      return res.status(403).json({
        message: "You are not enrolled in this class, so you can't mark attendance for it.",
      });
    }

    // 4. Record them present (duplicate handled inside)
    const result = await markLearnerPresent(session.attendance_id, learner_user_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(201).json({
      message: `You're marked present for ${session.subject_name} (${session.class_name}).`,
      data: result.data,
    });
  } catch (error) {
    console.error("submitAttendanceCodeController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Learner's recent attendance history.
// @route   GET /api/learner/attendance/history
// @access  Private (Learner)
export const getMyAttendanceHistoryController = async (req, res) => {
  try {
    const learner_user_id = req.user.user_id;
    const result = await getLearnerAttendanceHistory(learner_user_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getMyAttendanceHistoryController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// =====================================================================
// ATTENDANCE VIEWING CONTROLLERS — TEACHER (owner: Vhutali)
// =====================================================================

// @desc    List the teacher's attendance sessions (with present/roster counts)
// @route   GET /api/teacher/attendance/sessions
// @access  Private (Teacher)
export const getMySessionsController = async (req, res) => {
  try {
    const teacher_user_id = req.user.user_id;
    const result = await getSessionsByTeacher(teacher_user_id);

    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getMySessionsController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Full roster for one session: who's present, who's absent, plus stats
// @route   GET /api/teacher/attendance/sessions/:attendance_id
// @access  Private (Teacher)
export const getSessionRosterController = async (req, res) => {
  try {
    const teacher_user_id = req.user.user_id;
    const attendance_id = parseInt(req.params.attendance_id, 10);

    if (Number.isNaN(attendance_id)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    // Guard: teachers can only view their own sessions
    const owns = await teacherOwnsSession(teacher_user_id, attendance_id);
    if (!owns) {
      return res.status(403).json({
        message: "You can only view attendance for your own sessions.",
      });
    }

    const result = await getSessionRoster(attendance_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getSessionRosterController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



// =====================================================================
// ATTENDANCE OVERSIGHT — MANAGER / ADMIN (owner: Vhutali)
// =====================================================================

// Helper: work out which centre this request is allowed to look at.
// Manager  -> always their own center_id from the JWT (they can't override it)
// Admin    -> whichever centre they ask for via ?center_id=, else their own
function resolveCenterScope(req) {
  const role = (req.user?.user_role || '').toLowerCase();
  const isAdmin = role.includes('admin');

  if (isAdmin) {
    const requested = req.query.center_id;
    if (requested) {
      const parsed = parseInt(requested, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return req.user.center_id ?? null;
  }

  // Center Manager: locked to their own centre, no override allowed
  return req.user.center_id ?? null;
}

// @desc    Centre attendance overview: headline stats + per-class breakdown
// @route   GET /api/oversight/attendance/overview       (manager: own centre)
//          GET /api/oversight/attendance/overview?center_id=2   (admin only)
// @access  Private (Center Manager, Admin)
export const getAttendanceOverviewController = async (req, res) => {
  try {
    const center_id = resolveCenterScope(req);
    if (!center_id) {
      return res.status(400).json({ message: "No centre could be determined for this request." });
    }

    const result = await getCenterAttendanceOverview(center_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(200).json({ center_id, ...result.data });
  } catch (error) {
    console.error("getAttendanceOverviewController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Drill into a class: its sessions + its learners' attendance rates
// @route   GET /api/oversight/attendance/classes/:class_id
// @access  Private (Center Manager, Admin)
export const getClassAttendanceController = async (req, res) => {
  try {
    const class_id = parseInt(req.params.class_id, 10);
    if (Number.isNaN(class_id)) {
      return res.status(400).json({ message: "Invalid class id." });
    }

    const role = (req.user?.user_role || '').toLowerCase();
    const isAdmin = role.includes('admin');

    // Managers may only look inside their own centre. Admins may look anywhere.
    if (!isAdmin) {
      const allowed = await classBelongsToCenter(class_id, req.user.center_id);
      if (!allowed) {
        return res.status(403).json({
          message: "You can only view classes within your own centre.",
        });
      }
    }

    const [sessionsRes, learnersRes] = await Promise.all([
      getSessionsByClass(class_id),
      getLearnerRatesByClass(class_id),
    ]);

    if (sessionsRes.error) {
      return res.status(sessionsRes.status).json({ message: sessionsRes.error });
    }
    if (learnersRes.error) {
      return res.status(learnersRes.status).json({ message: learnersRes.error });
    }

    return res.status(200).json({
      class_id,
      sessions: sessionsRes.data,
      learners: learnersRes.data,
    });
  } catch (error) {
    console.error("getClassAttendanceController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




// =====================================================================
// FEEDBACK FORMS — MANAGER CONTROLLERS (owner: Vhutali)
// =====================================================================

// @desc    Create a feedback form with all its questions in one call.
// @route   POST /api/feedback/forms
// @access  Private (Center Manager, Admin)
export const createFeedbackFormController = async (req, res) => {
  try {
    const { title, description, target_type, closes_at, questions } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "A form title is required." });
    }
    if (!['teacher', 'subject', 'centre'].includes(target_type)) {
      return res.status(400).json({
        message: "target_type must be 'teacher', 'subject' or 'centre'.",
      });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "A form needs at least one question." });
    }

    // Validate every question before touching the database
    for (const q of questions) {
      if (!q.question_text || !q.question_text.trim()) {
        return res.status(400).json({ message: "Every question needs text." });
      }
      if (!['rating', 'text'].includes(q.question_type)) {
        return res.status(400).json({
          message: "Each question_type must be 'rating' or 'text'.",
        });
      }
    }

    const center_id = req.user.center_id;
    if (!center_id) {
      return res.status(400).json({ message: "No centre could be determined for this user." });
    }

    const result = await createFeedbackForm(
      {
        title,
        description,
        center_id,
        created_by: req.user.user_id,
        target_type,
        closes_at,
      },
      questions
    );

    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(201).json({
      message: "Feedback form created.",
      data: result.data,
    });
  } catch (error) {
    console.error("createFeedbackFormController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    List the centre's feedback forms.
// @route   GET /api/feedback/forms
// @access  Private (Center Manager, Admin)
export const getFeedbackFormsController = async (req, res) => {
  try {
    const center_id = req.user.center_id;
    if (!center_id) {
      return res.status(400).json({ message: "No centre could be determined for this user." });
    }

    const result = await getFormsByCenter(center_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getFeedbackFormsController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    One form with its questions.
// @route   GET /api/feedback/forms/:form_id
// @access  Private (Center Manager, Admin)
export const getFeedbackFormController = async (req, res) => {
  try {
    const form_id = parseInt(req.params.form_id, 10);
    if (Number.isNaN(form_id)) {
      return res.status(400).json({ message: "Invalid form id." });
    }

    const allowed = await formBelongsToCenter(form_id, req.user.center_id);
    if (!allowed) {
      return res.status(403).json({
        message: "You can only view forms in your own centre.",
      });
    }

    const result = await getFormWithQuestions(form_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getFeedbackFormController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Open or close a form for responses.
// @route   PATCH /api/feedback/forms/:form_id/state
//          body: { is_open: true|false }
// @access  Private (Center Manager, Admin)
export const setFeedbackFormStateController = async (req, res) => {
  try {
    const form_id = parseInt(req.params.form_id, 10);
    const { is_open } = req.body;

    if (Number.isNaN(form_id)) {
      return res.status(400).json({ message: "Invalid form id." });
    }
    if (typeof is_open !== 'boolean') {
      return res.status(400).json({ message: "is_open must be true or false." });
    }

    const allowed = await formBelongsToCenter(form_id, req.user.center_id);
    if (!allowed) {
      return res.status(403).json({
        message: "You can only manage forms in your own centre.",
      });
    }

    const result = await setFormOpenState(form_id, is_open);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(200).json({
      message: is_open ? "Form reopened." : "Form closed.",
      data: result.data,
    });
  } catch (error) {
    console.error("setFeedbackFormStateController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};





// =====================================================================
// FEEDBACK FORMS — LEARNER CONTROLLERS (owner: Vhutali)
// =====================================================================

// @desc    Forms currently open to this learner.
// @route   GET /api/learner/feedback/forms
// @access  Private (Learner)
export const getMyFeedbackFormsController = async (req, res) => {
  try {
    const result = await getOpenFormsForLearner(req.user.user_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getMyFeedbackFormsController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    One form's questions, plus the targets this learner may
//          give feedback about (and which they've already done).
// @route   GET /api/learner/feedback/forms/:form_id
// @access  Private (Learner)
export const getFeedbackFormForLearnerController = async (req, res) => {
  try {
    const form_id = parseInt(req.params.form_id, 10);
    if (Number.isNaN(form_id)) {
      return res.status(400).json({ message: "Invalid form id." });
    }

    const formResult = await getFormWithQuestions(form_id);
    if (formResult.error) {
      return res.status(formResult.status).json({ message: formResult.error });
    }
    const form = formResult.data;

    if (!form.is_open) {
      return res.status(410).json({ message: "This form is no longer accepting responses." });
    }

    const targetsResult = await getFeedbackTargetsForLearner(
      req.user.user_id,
      form_id,
      form.target_type
    );
    if (targetsResult.error) {
      return res.status(targetsResult.status).json({ message: targetsResult.error });
    }

    return res.status(200).json({
      form_id: form.form_id,
      title: form.title,
      description: form.description,
      target_type: form.target_type,
      questions: form.questions,
      targets: targetsResult.data,
    });
  } catch (error) {
    console.error("getFeedbackFormForLearnerController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Submit a completed feedback form (anonymously).
// @route   POST /api/learner/feedback/forms/:form_id/submit
//          body: { target_key, answers: [{ question_id, rating_value?, text_value? }] }
// @access  Private (Learner)
export const submitFeedbackController = async (req, res) => {
  try {
    const form_id = parseInt(req.params.form_id, 10);
    const { target_key, answers } = req.body;
    const learner_user_id = req.user.user_id;

    if (Number.isNaN(form_id)) {
      return res.status(400).json({ message: "Invalid form id." });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "No answers were submitted." });
    }

    // 1. Form must exist and still be open
    const formResult = await getFormWithQuestions(form_id);
    if (formResult.error) {
      return res.status(formResult.status).json({ message: formResult.error });
    }
    const form = formResult.data;

    if (!form.is_open) {
      return res.status(410).json({ message: "This form is no longer accepting responses." });
    }
    if (form.closes_at && new Date(form.closes_at).getTime() <= Date.now()) {
      return res.status(410).json({ message: "This form has closed." });
    }

    // 2. The target must be one this learner is allowed to review
    const targetsResult = await getFeedbackTargetsForLearner(
      learner_user_id, form_id, form.target_type
    );
    if (targetsResult.error) {
      return res.status(targetsResult.status).json({ message: targetsResult.error });
    }
    const validTarget = targetsResult.data.find(
      (t) => String(t.target_id) === String(target_key)
    );
    if (!validTarget) {
      return res.status(403).json({
        message: "You can't give feedback about that — it isn't one of yours.",
      });
    }

    // 3. Haven't already submitted for this target
    const already = await hasLearnerCompleted(form_id, learner_user_id, target_key);
    if (already) {
      return res.status(409).json({
        message: "You have already submitted this form for that target.",
      });
    }

    // 4. Validate the answers against the questions
    const questionsById = new Map(form.questions.map((q) => [q.question_id, q]));
    const answeredIds = new Set();

    for (const a of answers) {
      const q = questionsById.get(a.question_id);
      if (!q) {
        return res.status(400).json({
          message: "An answer was submitted for a question that isn't on this form.",
        });
      }
      if (answeredIds.has(a.question_id)) {
        return res.status(400).json({ message: "A question was answered twice." });
      }
      answeredIds.add(a.question_id);

      if (q.question_type === 'rating') {
        const r = a.rating_value;
        if (!Number.isInteger(r) || r < 1 || r > 5) {
          return res.status(400).json({
            message: `"${q.question_text}" needs a rating between 1 and 5.`,
          });
        }
        if (a.text_value) {
          return res.status(400).json({ message: "A rating question can't take text." });
        }
      } else {
        if (!a.text_value || !String(a.text_value).trim()) {
          if (q.is_required) {
            return res.status(400).json({
              message: `"${q.question_text}" needs an answer.`,
            });
          }
          // optional and blank — skip it entirely
          continue;
        }
        if (a.rating_value !== undefined && a.rating_value !== null) {
          return res.status(400).json({ message: "A text question can't take a rating." });
        }
      }
    }

    // 5. Every required question must be answered
    const missing = form.questions.filter(
      (q) => q.is_required && !answeredIds.has(q.question_id)
    );
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Please answer: ${missing.map((q) => q.question_text).join('; ')}`,
      });
    }

    // Drop blank optional text answers before writing
    const toWrite = answers.filter((a) => {
      const q = questionsById.get(a.question_id);
      if (q.question_type === 'text') {
        return a.text_value && String(a.text_value).trim();
      }
      return true;
    });

    const result = await submitFeedbackResponse(
      {
        form_id,
        target_type: form.target_type,
        target_key: parseInt(target_key, 10),
        learner_user_id,
      },
      toWrite
    );

    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(201).json({
      message: `Thanks — your feedback about ${validTarget.target_name} was submitted anonymously.`,
      data: result.data,
    });
  } catch (error) {
    console.error("submitFeedbackController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




// @desc    Aggregated results for one feedback form, grouped by target.
//          Targets below the minimum response threshold are suppressed
//          server-side to protect submitter anonymity.
// @route   GET /api/feedback/forms/:form_id/results
// @access  Private (Center Manager, Admin)
export const getFeedbackResultsController = async (req, res) => {
  try {
    const form_id = parseInt(req.params.form_id, 10);
    if (Number.isNaN(form_id)) {
      return res.status(400).json({ message: "Invalid form id." });
    }

    const allowed = await formBelongsToCenter(form_id, req.user.center_id);
    if (!allowed) {
      return res.status(403).json({
        message: "You can only view results for forms in your own centre.",
      });
    }

    const result = await getFormResults(form_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getFeedbackResultsController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    A learner's own attendance stats (overall + per subject).
// @route   GET /api/learner/attendance/stats
// @access  Private (Learner)
export const getMyAttendanceStatsController = async (req, res) => {
  try {
    const result = await getLearnerOwnAttendanceStats(req.user.user_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getMyAttendanceStatsController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//=========================================================================


//JAY'S CONTROLLERS
//-----------------------------------------------------------------------------------------------------------------

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Conflict', detail: err.detail });
    if (err.code === '23503') return res.status(400).json({ error: 'Invalid reference', detail: err.detail });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ----------------------------------------------------------------------------
// Ownership / access helpers — every handler below trusts req.user (from the
// main app's `protect` middleware), never a client-supplied id.
// ----------------------------------------------------------------------------

async function loadAssessmentOr404(assessmentId) {
  const id = parseInt(assessmentId, 10);
  if (isNaN(id)) throw new HttpError(400, 'Invalid assessment ID format');

  const { rows } = await pool.query(`SELECT * FROM assessments WHERE id = $1`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Assessment not found');
  return rows[0];
}

async function assertTeacherOwns(assessment, teacherId) {
  if (assessment.teacher_id !== teacherId) throw new HttpError(403, 'You do not own this assessment');
}

async function assertLearnerEnrolled(assessment, learnerId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM learner_enrollments
      WHERE learner_id = $1 AND subject_id = $2 AND class_id = $3`,
    [learnerId, assessment.subject_id, assessment.class_id]
  );
  if (!rows[0]) throw new HttpError(403, 'You are not enrolled in this class/subject');
}

async function assertSubmissionOwner(submission, learnerId) {
  if (Number(submission.student_id) !== Number(learnerId)) {
    throw new HttpError(403, 'Not your submission');
  }
}

// ----------------------------------------------------------------------------
// Identity
// ----------------------------------------------------------------------------

// GET /api/assessments/me
export const getMe = wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT user_id, first_name, last_name, email, user_role AS role, center_id FROM users WHERE user_id = $1`,
    [req.user.user_id]
  );
  if (!rows[0]) throw new HttpError(404, 'User not found');
  res.json(rows[0]);
});

// ----------------------------------------------------------------------------
// Teacher: subjects / classes (from teacher_assignments — no new tables needed)
// ----------------------------------------------------------------------------

// GET /api/assessments/teacher/subjects
export const getTeacherSubjects = wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT s.subject_id, s.subject_name, s.subject_code, s.grade
       FROM subjects s
       JOIN teacher_assignments ta ON ta.subject_id = s.subject_id
      WHERE ta.teacher_id = $1
      ORDER BY s.subject_name ASC`,
    [req.user.user_id]
  );
  res.json(rows);
});

// GET /api/assessments/teacher/classes?subjectId=
// GET /api/assessments/teacher/classes?subjectId=
export const getTeacherClasses = wrap(async (req, res) => {
  const { subjectId } = req.query;
  const params = [req.user.user_id];
  let subjectFilter = '';

  if (subjectId !== undefined && subjectId !== '' && subjectId !== null) {
    const parsedSubjectId = parseInt(subjectId, 10);
    if (isNaN(parsedSubjectId)) throw new HttpError(400, 'Invalid subjectId format');
    
    params.push(parsedSubjectId);
    subjectFilter = `AND ta.subject_id = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT DISTINCT c.class_id, c.class_name
       FROM classes c
       JOIN teacher_assignments ta ON ta.class_id = c.class_id
      WHERE ta.teacher_id = $1 ${subjectFilter}
      ORDER BY c.class_name ASC`,
    params
  );
  res.json(rows);
});

// ----------------------------------------------------------------------------
// Teacher: assessment CRUD
// ----------------------------------------------------------------------------

// GET /api/assessments/teacher/list?subjectId=&classId=&status=
export const listTeacherAssessments = wrap(async (req, res) => {
  const { subjectId, classId, status } = req.query;
  const conditions = ['a.teacher_id = $1'];
  const params = [req.user.user_id];

  if (subjectId !== undefined && subjectId !== '' && subjectId !== null) {
    const parsedSubjectId = parseInt(subjectId, 10);
    if (isNaN(parsedSubjectId)) throw new HttpError(400, 'Invalid subjectId format');
    params.push(parsedSubjectId);
    conditions.push(`a.subject_id = $${params.length}`);
  }

  if (classId !== undefined && classId !== '' && classId !== null) {
    const parsedClassId = parseInt(classId, 10);
    if (isNaN(parsedClassId)) throw new HttpError(400, 'Invalid classId format');
    params.push(parsedClassId);
    conditions.push(`a.class_id = $${params.length}`);
  }

  if (status !== undefined && status !== '' && status !== null) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  const { rows } = await pool.query(
    `SELECT a.*,
            (SELECT COUNT(*)::int FROM assessment_questions q WHERE q.assessment_id = a.id) AS question_count,
            (SELECT COALESCE(SUM(points), 0)::numeric FROM assessment_questions q WHERE q.assessment_id = a.id) AS total_points
       FROM assessments a
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.created_at DESC`,
    params
  );
  res.json(rows);
});

// POST /api/assessments/teacher
export const createAssessment = wrap(async (req, res) => {
  const teacherId = req.user.user_id;
  const {
    subject_id, class_id, title, description = '', type = 'quiz',
    time_limit_minutes = null, max_attempts = 1, shuffle_questions = false,
    available_from = null, available_until = null,
  } = req.body;

  if (!subject_id || !class_id || !title || typeof title !== 'string' || !title.trim()) {
    throw new HttpError(400, 'subject_id, class_id, and a valid title are required');
  }

  const parsedSubjectId = parseInt(subject_id, 10);
  const parsedClassId = parseInt(class_id, 10);
  if (isNaN(parsedSubjectId) || isNaN(parsedClassId)) {
    throw new HttpError(400, 'subject_id and class_id must be valid numbers');
  }

  if (available_from && available_until && new Date(available_from) >= new Date(available_until)) {
    throw new HttpError(400, 'available_until must be after available_from');
  }

  // Teacher authorization for this subject/class
  const { rows: assign } = await pool.query(
    `SELECT 1 FROM teacher_assignments WHERE teacher_id = $1 AND subject_id = $2 AND class_id = $3`,
    [teacherId, parsedSubjectId, parsedClassId]
  );
  if (!assign[0]) throw new HttpError(403, 'You are not assigned to teach this subject in this class');

  const { rows } = await pool.query(
    `INSERT INTO assessments
       (teacher_id, subject_id, class_id, title, description, type, time_limit_minutes,
        max_attempts, shuffle_questions, available_from, available_until)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      teacherId, parsedSubjectId, parsedClassId, title.trim(), description, type,
      time_limit_minutes ? parseInt(time_limit_minutes, 10) : null,
      parseInt(max_attempts, 10) || 1, Boolean(shuffle_questions),
      available_from ? new Date(available_from) : null,
      available_until ? new Date(available_until) : null
    ]
  );

  const assessment = rows[0];
  assessment.questions = [];
  res.status(201).json(assessment);
});

// GET /api/assessments/:id
// GET /api/assessments/:id
// GET /api/assessments/:id
export const getAssessment = wrap(async (req, res) => {
  const assessmentId = parseInt(req.params.id, 10);
  if (isNaN(assessmentId)) throw new HttpError(400, 'Invalid assessment ID format');

  const userRole = (req.user.role || '').toLowerCase();
  const isTeacher = userRole === 'teacher';

  const assessment = await getAssessmentWithQuestions(assessmentId, isTeacher);
  if (!assessment) throw new HttpError(404, 'Assessment not found');

  if (isTeacher) {
    await assertTeacherOwns(assessment, req.user.user_id);
  } else {
    if (assessment.status !== 'published') throw new HttpError(403, 'This assessment is not published');
    
    // Check time availability for learners
    const now = new Date();
    if (assessment.available_from && new Date(assessment.available_from) > now) {
      throw new HttpError(403, 'This assessment is not open yet');
    }
    if (assessment.available_until && new Date(assessment.available_until) < now) {
      throw new HttpError(403, 'This assessment has closed');
    }

    await assertLearnerEnrolled(assessment, req.user.user_id);
  }

  res.json(assessment);
});


// PATCH /api/assessments/:id
export const updateAssessment = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);

  const fields = ['title', 'description', 'type', 'time_limit_minutes', 'max_attempts',
    'shuffle_questions', 'available_from', 'available_until'];
  const sets = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { params.push(req.body[f]); sets.push(`${f} = $${params.length}`); }
  }
  if (sets.length === 0) throw new HttpError(400, 'No updatable fields provided');
  params.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE assessments SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params
  );
  res.json(rows[0]);
});

// POST /api/assessments/:id/publish
// POST /api/assessments/:id/publish
export const publishAssessment = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);

  // 1. Ensure questions exist
  const { rows: qRows } = await pool.query(
    `SELECT id, question_type FROM assessment_questions WHERE assessment_id = $1`, 
    [assessment.id]
  );
  if (qRows.length === 0) {
    throw new HttpError(400, 'Add at least one question before publishing.');
  }

  // 2. Ensure choice questions actually have options configured
  const choiceQuestionIds = qRows
    .filter(q => q.question_type === 'mcq' || q.question_type === 'single')
    .map(q => q.id);

  if (choiceQuestionIds.length > 0) {
    const { rows: optCounts } = await pool.query(
      `SELECT question_id, COUNT(*) as opt_count 
         FROM assessment_question_options 
        WHERE question_id = ANY($1::int[]) 
        GROUP BY question_id`,
      [choiceQuestionIds]
    );

    const questionsWithOpts = new Set(optCounts.map(r => r.question_id));
    const missingOpts = choiceQuestionIds.some(qId => !questionsWithOpts.has(qId));
    
    if (missingOpts) {
      throw new HttpError(400, 'All multiple/single choice questions must have at least one option before publishing.');
    }
  }

  const { rows } = await pool.query(
    `UPDATE assessments SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [assessment.id]
  );
  res.json(rows[0]);
});

// POST /api/assessments/:id/close
// POST /api/assessments/:id/close
export const closeAssessment = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);
  
  const { rows } = await pool.query(
    `UPDATE assessments SET status = 'closed', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [assessment.id]
  );
  res.json(rows[0]);
});

// DELETE /api/assessments/:id
// DELETE /api/assessments/:id
export const deleteAssessment = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);

  // Prevent accidental deletion if student submissions exist
  const { rows: subCheck } = await pool.query(
    `SELECT 1 FROM assessment_submissions WHERE assessment_id = $1 LIMIT 1`,
    [assessment.id]
  );
  if (subCheck[0]) {
    throw new HttpError(400, 'Cannot delete an assessment that has existing student submissions. Consider closing it instead.');
  }

  await pool.query(`DELETE FROM assessments WHERE id = $1`, [assessment.id]);
  res.status(204).end();
});

// POST /api/assessments/:id/questions
// POST /api/assessments/:id/questions
export const addQuestion = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);

  // Prevent modifying structure once published or closed
  if (assessment.status !== 'draft') {
    throw new HttpError(400, 'Cannot add questions to an assessment that is already published or closed');
  }

  const { question_text, question_type, points = 1, options = [] } = req.body;

  if (!question_text || typeof question_text !== 'string' || !question_text.trim()) {
    throw new HttpError(400, 'question_text is required');
  }
  if (!question_type) {
    throw new HttpError(400, 'question_type is required');
  }

  const parsedPoints = parseFloat(points);
  if (isNaN(parsedPoints) || parsedPoints < 0) {
    throw new HttpError(400, 'points must be a non-negative number');
  }

  // Validate choice-based question constraints
  const isChoiceType = question_type === 'mcq' || question_type === 'single';
  if (isChoiceType) {
    if (!Array.isArray(options) || options.length === 0) {
      throw new HttpError(400, 'Multiple/Single choice questions must include at least one option');
    }
    const hasCorrect = options.some(opt => Boolean(opt.is_correct));
    if (!hasCorrect) {
      throw new HttpError(400, 'At least one option must be marked as correct');
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: orderRows } = await client.query(
      `SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order 
         FROM assessment_questions 
        WHERE assessment_id = $1`,
      [assessment.id]
    );

    const { rows: qRows } = await client.query(
      `INSERT INTO assessment_questions (assessment_id, question_text, question_type, points, order_index)
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [assessment.id, question_text.trim(), question_type, parsedPoints, orderRows[0].next_order]
    );

    const question = qRows[0];
    question.options = [];

    if (options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt.option_text || typeof opt.option_text !== 'string' || !opt.option_text.trim()) {
          throw new HttpError(400, `Option at index ${i} requires valid option_text`);
        }

        const { rows: oRows } = await client.query(
          `INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [question.id, opt.option_text.trim(), Boolean(opt.is_correct), i + 1]
        );
        question.options.push(oRows[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(question);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// DELETE /api/assessments/questions/:id
// DELETE /api/assessments/questions/:id
export const deleteQuestion = wrap(async (req, res) => {
  const questionId = parseInt(req.params.id, 10);
  if (isNaN(questionId)) throw new HttpError(400, 'Invalid question ID format');

  const { rows } = await pool.query(
    `SELECT a.*, q.order_index 
       FROM assessments a
       JOIN assessment_questions q ON q.assessment_id = a.id
      WHERE q.id = $1`,
    [questionId]
  );
  if (!rows[0]) throw new HttpError(404, 'Question not found');

  const assessment = rows[0];
  await assertTeacherOwns(assessment, req.user.user_id);

  if (assessment.status !== 'draft') {
    throw new HttpError(400, 'Cannot delete questions from an assessment that is published or closed');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM assessment_questions WHERE id = $1`, [questionId]);

    // Shift down remaining order indices to maintain gapless ordering
    await client.query(
      `UPDATE assessment_questions 
          SET order_index = order_index - 1 
        WHERE assessment_id = $1 AND order_index > $2`,
      [assessment.id, assessment.order_index]
    );

    await client.query('COMMIT');
    res.status(204).end();
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ----------------------------------------------------------------------------
// Teacher: completion tracking / gradebook / memorandum
// ----------------------------------------------------------------------------

// GET /api/assessments/:id/roster?status=
// GET /api/assessments/:id/roster
export const getRoster = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);

  const { status } = req.query;

  // Added:
  // 1. TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS name
  // 2. l.learner_number
  // 3. LEFT JOIN learners l ON l.user_id = u.user_id
  let query = `
    SELECT u.user_id AS student_id,
           u.first_name, 
           u.last_name, 
           TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS name,
           u.email,
           l.learner_number,
           COALESCE(sub.status, 'not_submitted') AS status,
           sub.id AS submission_id, 
           sub.score, 
           sub.max_score,
           sub.started_at, 
           sub.submitted_at, 
           sub.graded_at
      FROM learner_enrollments le
      JOIN users u ON u.user_id = le.learner_id
      LEFT JOIN learners l ON l.user_id = u.user_id
      LEFT JOIN LATERAL (
        SELECT id, status, score, max_score, started_at, submitted_at, graded_at
          FROM assessment_submissions
         WHERE student_id = le.learner_id AND assessment_id = $1
         ORDER BY attempts DESC, started_at DESC
         LIMIT 1
      ) sub ON true
     WHERE le.subject_id = $2 AND le.class_id = $3
  `;

  const queryParams = [assessment.id, assessment.subject_id, assessment.class_id];

  if (status) {
    queryParams.push(status);
    query += ` AND COALESCE(sub.status, 'not_submitted') = $4`;
  }

  query += ` ORDER BY u.last_name ASC, u.first_name ASC`;

  const { rows } = await pool.query(query, queryParams);
  res.json(rows);
});

// GET /api/assessments/:id/gradebook
// GET /api/assessments/:id/gradebook
export const getGradebook = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);

  const { rows } = await pool.query(
    `WITH latest_subs AS (
       SELECT DISTINCT ON (student_id)
              id AS submission_id, student_id, status, score, max_score
         FROM assessment_submissions
        WHERE assessment_id = $1
        ORDER BY student_id, attempts DESC, started_at DESC
     ),
     graded_ranks AS (
       SELECT student_id,
              DENSE_RANK() OVER (ORDER BY score DESC) AS rank
         FROM latest_subs
        WHERE status = 'graded'
     )
     SELECT u.user_id AS student_id, 
            u.first_name, 
            u.last_name,
            sub.submission_id, 
            COALESCE(sub.status, 'not_submitted') AS status, 
            sub.score, 
            sub.max_score,
            g.rank,
            (SELECT COUNT(*) FROM learner_enrollments WHERE subject_id = $2 AND class_id = $3) AS total
       FROM learner_enrollments le
       JOIN users u ON u.user_id = le.learner_id
       LEFT JOIN latest_subs sub ON sub.student_id = le.learner_id
       LEFT JOIN graded_ranks g ON g.student_id = le.learner_id
      WHERE le.subject_id = $2 AND le.class_id = $3
      ORDER BY (sub.status = 'graded') DESC, sub.score DESC NULLS LAST, u.last_name ASC`,
    [assessment.id, assessment.subject_id, assessment.class_id]
  );

  res.json(rows);
})

// GET /api/assessments/:id/memorandum
// GET /api/assessments/:id/memorandum
export const getMemorandum = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);

  const { rows } = await pool.query(
    `SELECT id, assessment_id, teacher_id, content, released_at, created_at, updated_at 
       FROM assessment_memoranda 
      WHERE assessment_id = $1`, 
    [assessment.id]
  );
  
  res.json(rows[0] || null);
});

// POST /api/assessments/:id/memorandum   { content }
// POST /api/assessments/:id/memorandum
export const releaseMemorandum = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);
  await assertTeacherOwns(assessment, req.user.user_id);

  if (assessment.status === 'draft') {
    throw new HttpError(400, 'Cannot release a memorandum for a draft assessment.');
  }

  const { content } = req.body;
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new HttpError(400, 'Valid memorandum content is required');
  }

  // Verify all enrolled learners have finished/graded submissions
  const { rows: uncompleted } = await pool.query(
    `SELECT le.learner_id
       FROM learner_enrollments le
       LEFT JOIN LATERAL (
         SELECT status 
           FROM assessment_submissions
          WHERE student_id = le.learner_id AND assessment_id = $1
          ORDER BY attempts DESC, started_at DESC
          LIMIT 1
       ) sub ON true
      WHERE le.subject_id = $2 AND le.class_id = $3
        AND (sub.status IS NULL OR sub.status NOT IN ('submitted', 'graded'))`,
    [assessment.id, assessment.subject_id, assessment.class_id]
  );

  if (uncompleted.length > 0) {
    throw new HttpError(
      400, 
      `Cannot release memorandum. ${uncompleted.length} learner(s) have not completed or submitted the assessment.`
    );
  }

  const { rows } = await pool.query(
    `INSERT INTO assessment_memoranda (assessment_id, teacher_id, content, released_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (assessment_id)
     DO UPDATE SET content = EXCLUDED.content, released_at = NOW(), updated_at = NOW()
     RETURNING *`,
    [assessment.id, req.user.user_id, content.trim()]
  );

  res.status(201).json(rows[0]);
});

// ----------------------------------------------------------------------------
// Learner: subjects / assessment list
// ----------------------------------------------------------------------------

// GET /api/assessments/student/subjects
// GET /api/assessments/student/subjects
export const getStudentSubjects = wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT 
        s.subject_id AS id, 
        s.subject_name AS name, 
        s.subject_code, 
        s.grade
       FROM subjects s
       JOIN learner_enrollments le ON le.subject_id = s.subject_id
      WHERE le.learner_id = $1
      ORDER BY s.subject_name ASC`,
    [req.user.user_id]
  );
  res.json(rows);
});

// GET /api/assessments/student/list?subjectId=
// GET /api/assessments/student/list?subjectId=
export const listStudentAssessments = wrap(async (req, res) => {
  const subjectId = parseInt(req.query.subjectId, 10);
  if (isNaN(subjectId)) {
    throw new HttpError(400, 'Valid subjectId query parameter is required');
  }

  // Resolve the learner's class for this specific subject
  const { rows: enrollRows } = await pool.query(
    `SELECT class_id FROM learner_enrollments WHERE learner_id = $1 AND subject_id = $2 LIMIT 1`,
    [req.user.user_id, subjectId]
  );
  if (!enrollRows[0]) return res.json([]);
  const classId = enrollRows[0].class_id;

  const { rows } = await pool.query(
    `SELECT a.id,
            a.title,
            a.description,
            a.time_limit_minutes,
            a.available_until AS due_date,
            a.available_from,
            a.max_attempts,
            a.status AS assessment_status,
            COALESCE(q_stats.question_count, 0)::integer AS question_count,
            COALESCE(q_stats.total_points, 0)::float AS total_points,
            sub.id AS submission_id,
            sub.status AS submission_status,
            sub.score AS submission_score,
            sub.max_score AS submission_max_score
       FROM assessments a
       LEFT JOIN (
         SELECT assessment_id, 
                COUNT(*) AS question_count, 
                SUM(points) AS total_points
           FROM assessment_questions
          GROUP BY assessment_id
       ) q_stats ON q_stats.assessment_id = a.id
       LEFT JOIN LATERAL (
         SELECT id, status, score, max_score
           FROM assessment_submissions
          WHERE assessment_id = a.id AND student_id = $1
          ORDER BY attempts DESC, started_at DESC
          LIMIT 1
       ) sub ON true
      WHERE a.class_id = $2 AND a.subject_id = $3 AND a.status = 'published'
      ORDER BY a.created_at DESC`,
    [req.user.user_id, classId, subjectId]
  );

  res.json(rows);
});

// ----------------------------------------------------------------------------
// Submission lifecycle
// ----------------------------------------------------------------------------

// POST /api/assessments/:id/attempts
// POST /api/assessments/:id/attempts
export const startAttempt = wrap(async (req, res) => {
  const assessment = await loadAssessmentOr404(req.params.id);

  if (assessment.status !== 'published') {
    throw new HttpError(403, 'This assessment is not available for attempts');
  }

  await assertLearnerEnrolled(assessment, req.user.user_id);

  // Check existing attempts
  const { rows: existing } = await pool.query(
    `SELECT * FROM assessment_submissions
      WHERE assessment_id = $1 AND student_id = $2
      ORDER BY attempts DESC LIMIT 1`,
    [assessment.id, req.user.user_id]
  );

  if (existing[0]) {
    const latestAttempt = existing[0];

    // If active attempt exists (not yet submitted), resume it
    if (latestAttempt.status === 'not_submitted') {
      const submission = await getSubmissionWithAnswers(latestAttempt.id);
      return res.json(submission);
    }

    // Enforce max attempt limits if configured on assessment
    const maxAllowed = assessment.max_attempts || 1;
    if (latestAttempt.attempts >= maxAllowed) {
      throw new HttpError(
        400,
        `You have reached the maximum allowed attempts (${maxAllowed}) for this assessment.`
      );
    }
  }

  const nextAttemptNum = existing[0] ? existing[0].attempts + 1 : 1;

  // Insert new attempt using 'not_submitted' enum value
  const { rows } = await pool.query(
    `INSERT INTO assessment_submissions (assessment_id, student_id, status, attempts, started_at)
     VALUES ($1, $2, 'not_submitted', $3, NOW())
     RETURNING *`,
    [assessment.id, req.user.user_id, nextAttemptNum]
  );

  const submission = rows[0];
  submission.answers = [];
  res.status(201).json(submission);
});
// PUT /api/assessments/submissions/:id/answers   { question_id, answer_text?, selected_option_id? }
// POST /api/assessments/submissions/:id/answers
export const saveAnswer = wrap(async (req, res) => {
  const submission = await getSubmissionWithAnswers(req.params.id);
  if (!submission) throw new HttpError(404, 'Submission not found');
  await assertSubmissionOwner(submission, req.user.user_id);

  // Prevent saving answers to closed/submitted attempts
  if (submission.status !== 'in_progress' && submission.status !== 'not_submitted') {
    throw new HttpError(400, 'Cannot modify answers on a completed or submitted attempt.');
  }

  const { question_id, answer_text = null, selected_option_id = null } = req.body;
  
  const parsedQuestionId = parseInt(question_id, 10);
  if (isNaN(parsedQuestionId)) {
    throw new HttpError(400, 'Valid question_id is required');
  }

  // Ensure question belongs to this specific assessment
  const { rows: qRows } = await pool.query(
    `SELECT id FROM assessment_questions WHERE id = $1 AND assessment_id = $2`,
    [parsedQuestionId, submission.assessment_id]
  );
  if (!qRows[0]) {
    throw new HttpError(400, 'Question does not belong to this assessment');
  }

  const { rows } = await pool.query(
    `INSERT INTO assessment_answers (submission_id, question_id, answer_text, selected_option_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (submission_id, question_id)
     DO UPDATE SET answer_text = EXCLUDED.answer_text,
                   selected_option_id = EXCLUDED.selected_option_id,
                   updated_at = NOW()
     RETURNING *`,
    [submission.id, parsedQuestionId, answer_text, selected_option_id]
  );

  res.json(rows[0]);
});

// POST /api/assessments/submissions/:id/submit
// POST /api/assessments/submissions/:id/submit
export const submitAttempt = wrap(async (req, res) => {
  const existing = await getSubmissionWithAnswers(req.params.id);
  if (!existing) throw new HttpError(404, 'Submission not found');
  await assertSubmissionOwner(existing, req.user.user_id);

  // Guard against duplicate submissions
  if (existing.status === 'submitted' || existing.status === 'graded') {
    return res.json(existing);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock and update status
    await client.query(
      `UPDATE assessment_submissions 
          SET status = 'submitted', 
              submitted_at = NOW(), 
              updated_at = NOW() 
        WHERE id = $1`,
      [existing.id]
    );

    // Auto-grade objective questions & update overall status/scores
    await autoGradeObjectiveAnswers(client, existing.id);
    const updated = await recomputeSubmissionStatus(client, existing.id);

    await client.query('COMMIT');

    const full = await getSubmissionWithAnswers(updated.id);
    res.json(full);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/assessments/submissions/:id   (teacher marking view)
export const getSubmission = wrap(async (req, res) => {
  const submission = await getSubmissionWithAnswers(req.params.id);
  if (!submission) throw new HttpError(404, 'Submission not found');
  const assessment = await loadAssessmentOr404(submission.assessment_id);

  if (req.user.role === 'Teacher') await assertTeacherOwns(assessment, req.user.user_id);
  else await assertSubmissionOwner(submission, req.user.user_id);

  res.json(submission);
});

// GET /api/assessments/submissions/:id/result   (learner result view)
// GET /api/assessments/submissions/:id/result (learner/teacher review view)
export const getResult = wrap(async (req, res) => {
  const submission = await getSubmissionWithAnswers(req.params.id);
  if (!submission) throw new HttpError(404, 'Submission not found');
  const assessment = await loadAssessmentOr404(submission.assessment_id);

  const isTeacher = req.user.role === 'Teacher';
  if (isTeacher) {
    await assertTeacherOwns(assessment, req.user.user_id);
  } else {
    await assertSubmissionOwner(submission, req.user.user_id);
  }

  // Fetch questions with options
  const { rows: questions } = await pool.query(
    `SELECT q.*, 
            COALESCE(
              json_agg(
                json_build_object(
                  'id', o.id,
                  'option_text', o.option_text,
                  'order_index', o.order_index,
                  'is_correct', CASE WHEN $2 = true OR sub.status = 'graded' THEN o.is_correct ELSE NULL END
                ) ORDER BY o.order_index ASC
              ) FILTER (WHERE o.id IS NOT NULL), '[]'
            ) AS options
       FROM assessment_questions q
       LEFT JOIN assessment_question_options o ON o.question_id = q.id
       LEFT JOIN assessment_submissions sub ON sub.id = $1
      WHERE q.assessment_id = $3
      GROUP BY q.id
      ORDER BY q.order_index ASC`,
    [submission.id, isTeacher, submission.assessment_id]
  );

  // Ranking calculation across latest attempts of enrolled students
  let rank = null;
  if (submission.status === 'graded') {
    const { rows: rankRows } = await pool.query(
      `WITH latest_graded AS (
         SELECT DISTINCT ON (student_id) student_id, score
           FROM assessment_submissions
          WHERE assessment_id = $1 AND status = 'graded'
          ORDER BY student_id, attempts DESC
       )
       SELECT student_id, 
              RANK() OVER (ORDER BY score DESC)::integer AS rank, 
              COUNT(*) OVER ()::integer AS total
         FROM latest_graded`,
      [submission.assessment_id]
    );
    const mine = rankRows.find((r) => r.student_id === submission.student_id);
    if (mine) rank = { rank: mine.rank, total: mine.total };
  }

  // Learners only get the memorandum if it has actually been released
  let memorandum = null;
  const { rows: memoRows } = await pool.query(
    `SELECT * FROM assessment_memoranda WHERE assessment_id = $1`, 
    [submission.assessment_id]
  );

  if (memoRows[0]) {
    if (isTeacher || memoRows[0].released_at !== null) {
      memorandum = memoRows[0];
    }
  }

  res.json({
    submission,
    assessment,
    questions,
    rank,
    memorandum
  });
});

// PUT /api/assessments/answers/:id/grade   { points_awarded, feedback }
// POST /api/assessments/answers/:id/grade
export const gradeAnswer = wrap(async (req, res) => {
  const answerId = parseInt(req.params.id, 10);
  if (isNaN(answerId)) throw new HttpError(400, 'Invalid answer ID format');

  // Fetch answer along with associated question max points and submission/assessment info
  const { rows: ansCheck } = await pool.query(
    `SELECT aa.*, q.points AS max_points, sub.assessment_id, sub.submission_id
       FROM assessment_answers aa
       JOIN assessment_questions q ON q.id = aa.question_id
       JOIN assessment_submissions sub ON sub.id = aa.submission_id
      WHERE aa.id = $1`,
    [answerId]
  );
  if (!ansCheck[0]) throw new HttpError(404, 'Answer not found');

  const answer = ansCheck[0];
  const assessment = await loadAssessmentOr404(answer.assessment_id);
  await assertTeacherOwns(assessment, req.user.user_id);

  const { points_awarded, feedback = null } = req.body;
  
  const parsedPoints = parseFloat(points_awarded);
  if (isNaN(parsedPoints) || parsedPoints < 0) {
    throw new HttpError(400, 'points_awarded must be a non-negative number');
  }

  const maxPoints = parseFloat(answer.max_points);
  if (parsedPoints > maxPoints) {
    throw new HttpError(400, `points_awarded (${parsedPoints}) cannot exceed maximum question points (${maxPoints})`);
  }

  const isFullyCorrect = parsedPoints >= maxPoints;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: ansRows } = await client.query(
      `UPDATE assessment_answers
          SET points_awarded = $1::numeric,
              feedback = $2,
              is_correct = $3,
              updated_at = NOW()
        WHERE id = $4
        RETURNING *`,
      [parsedPoints, feedback, isFullyCorrect, answerId]
    );

    const submission = await recomputeSubmissionStatus(client, answer.submission_id, req.user.user_id);

    await client.query('COMMIT');
    res.json({ answer: ansRows[0], submission });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// POST /api/assessments/submissions/:id/finalize
// POST /api/assessments/submissions/:id/finalize
export const finalizeSubmission = wrap(async (req, res) => {
  const submissionId = parseInt(req.params.id, 10);
  if (isNaN(submissionId)) throw new HttpError(400, 'Invalid submission ID format');

  const submission = await getSubmissionWithAnswers(submissionId);
  if (!submission) throw new HttpError(404, 'Submission not found');

  const assessment = await loadAssessmentOr404(submission.assessment_id);
  await assertTeacherOwns(assessment, req.user.user_id);

  // Check if any answers require manual grading but haven't been scored yet
  const { rows: ungraded } = await pool.query(
    `SELECT q.id
       FROM assessment_questions q
       LEFT JOIN assessment_answers aa ON aa.question_id = q.id AND aa.submission_id = $1
      WHERE q.assessment_id = $2
        AND aa.points_awarded IS NULL`,
    [submission.id, assessment.id]
  );

  if (ungraded.length > 0) {
    throw new HttpError(
      400,
      `Cannot finalize submission. ${ungraded.length} question(s) still need to be graded.`
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Recompute total scores across all answers
    const updated = await recomputeSubmissionStatus(client, submission.id, req.user.user_id);

    // Explicitly transition status to 'graded' and stamp graded_at
    const { rows: finalRows } = await client.query(
      `UPDATE assessment_submissions
          SET status = 'graded',
              graded_at = NOW(),
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [submission.id]
    );

    await client.query('COMMIT');
    res.json(finalRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});




// =====================================================================
// LESSON PLANNER CONTROLLERS (owner: Vhutali)
// =====================================================================

// @desc    Create a lesson plan entry.
// @route   POST /api/teacher/lessons
// @access  Private (Teacher)
export const createLessonController = async (req, res) => {
  try {
    const { subject_id, class_id, week, lesson_date, topic, planner_type } = req.body;
    const teacher_id = req.user.user_id;

    if (!subject_id || !class_id) {
      return res.status(400).json({ message: "Subject and class are required." });
    }
    if (!lesson_date) {
      return res.status(400).json({ message: "A lesson date is required." });
    }
    if (week === undefined || week === null || Number.isNaN(parseInt(week, 10))) {
      return res.status(400).json({ message: "A week number is required." });
    }

    // Guard: teacher must actually teach this subject+class
    const teaches = await teacherTeachesClass(teacher_id, subject_id, class_id);
    if (!teaches) {
      return res.status(403).json({
        message: "You can only plan lessons for classes you teach.",
      });
    }

    const result = await createLessonPlan({
      teacher_id,
      subject_id: parseInt(subject_id, 10),
      class_id: parseInt(class_id, 10),
      week: parseInt(week, 10),
      lesson_date,
      topic,
      planner_type,
    });

    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(201).json({ message: "Lesson planned.", data: result.data });
  } catch (error) {
    console.error("createLessonController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    A teacher's own lessons.
// @route   GET /api/teacher/lessons
// @access  Private (Teacher)
export const getMyLessonsController = async (req, res) => {
  try {
    const result = await getLessonsByTeacher(req.user.user_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getMyLessonsController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Update a lesson.
// @route   PATCH /api/teacher/lessons/:planner_id
// @access  Private (Teacher)
export const updateLessonController = async (req, res) => {
  try {
    const planner_id = parseInt(req.params.planner_id, 10);
    if (Number.isNaN(planner_id)) {
      return res.status(400).json({ message: "Invalid lesson id." });
    }

    const owns = await teacherOwnsLesson(req.user.user_id, planner_id);
    if (!owns) {
      return res.status(403).json({ message: "You can only edit your own lessons." });
    }

    const { week, lesson_date, topic } = req.body;
    if (week !== undefined && week !== null && (Number.isNaN(parseInt(week, 10)) || parseInt(week, 10) < 1)) {
      return res.status(400).json({ message: "Week must be a positive number." });
    }
    const result = await updateLessonPlan(planner_id, { week, lesson_date, topic });
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json({ message: "Lesson updated.", data: result.data });
  } catch (error) {
    console.error("updateLessonController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Delete a lesson.
// @route   DELETE /api/teacher/lessons/:planner_id
// @access  Private (Teacher)
export const deleteLessonController = async (req, res) => {
  try {
    const planner_id = parseInt(req.params.planner_id, 10);
    if (Number.isNaN(planner_id)) {
      return res.status(400).json({ message: "Invalid lesson id." });
    }

    const owns = await teacherOwnsLesson(req.user.user_id, planner_id);
    if (!owns) {
      return res.status(403).json({ message: "You can only delete your own lessons." });
    }

    const result = await deleteLessonPlan(planner_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json({ message: "Lesson deleted." });
  } catch (error) {
    console.error("deleteLessonController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Lessons visible to a learner (their enrolled classes).
// @route   GET /api/learner/lessons
// @access  Private (Learner)
export const getLearnerLessonsController = async (req, res) => {
  try {
    const result = await getLessonsForLearner(req.user.user_id);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("getLearnerLessonsController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



// =====================================================================
// FLAGGING CONTROLLERS
// =====================================================================
 
// @desc    At-risk scores for a teacher's own classes.
// @route   GET /api/teacher/flagging
// @access  Private (Teacher)
export const getTeacherFlaggingController = async (req, res) => {
  try {
    const learnersResult = await getLearnersForTeacher(req.user.user_id);
    if (learnersResult.error) {
      return res.status(learnersResult.status).json({ message: learnersResult.error });
    }
    const scored = await computeRiskForLearners(learnersResult.data);
    // sort most at-risk first
    scored.sort((a, b) => b.total - a.total);
    return res.status(200).json(scored);
  } catch (error) {
    console.error("getTeacherFlaggingController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
 
// @desc    At-risk scores for a manager/admin's whole centre.
// @route   GET /api/oversight/flagging
// @access  Private (Center Manager, Admin)
export const getCentreFlaggingController = async (req, res) => {
  try {
    const centre = await getUserCentre(req.user.user_id);
    if (!centre) {
      return res.status(400).json({ message: "No centre is associated with your account." });
    }
    const learnersResult = await getLearnersForCentre(centre);
    if (learnersResult.error) {
      return res.status(learnersResult.status).json({ message: learnersResult.error });
    }
    const scored = await computeRiskForLearners(learnersResult.data);
    scored.sort((a, b) => b.total - a.total);
    return res.status(200).json(scored);
  } catch (error) {
    console.error("getCentreFlaggingController error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
