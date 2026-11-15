import { getUserByEmail, IDNumberExists, pool, registerCenterManager,registerLearner, registerTeacher,authenticateUserLogin,enrollLearnerToClass,
  assignTeacherToClass
} from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

// Configure your transporter (use environment variables for credentials!)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Sign JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user.user_id, role: user.role, email: user.email, center_id: user.center_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// --- ADD THE 'export' KEYWORD TO EACH FUNCTION ---

export const verifyId = async (req, res) => {
  const { sa_id_number } = req.body;
  if (!sa_id_number || sa_id_number.length !== 13) {
    return res.status(400).json({ message: 'Invalid South African ID number.' });
  }
  try {
    const idExists = await IDNumberExists(sa_id_number);
    if (idExists) {
      return res.status(400).json({ message: 'ID number already exists.' });
    }
    return res.status(200).json({ message: 'ID number is valid.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying ID.' });
  }
};


// LOGIN CONTROLLER
export const loginUserController = async (req, res) => {
  const { login_number, password } = req.body;

  if (!login_number || !password) {
    return res.status(400).json({ message: "Operational login number and password are required." });
  }

  try {
    // 1. Query matching our updated single-parameter DB function signature
    const result = await authenticateUserLogin(login_number);
	
	console.log("=== DEBUG STEP 1: DB Result Status ===");
	  console.log("Returned Status:", result.status);
	  console.log("Returned Error (if any):", result.error);

    if (result.status !== 200) {
      return res.status(401).json({ message: "Invalid operational identifier number or credentials." });
    }

    const user = result.data;
	
	console.log("=== DEBUG STEP 2: DB User Payload ===");
  console.log("Found User ID:", user?.user_id);
  console.log("Incoming plain-text password:", password);
  console.log("Database hash being evaluated:", user?.password_hash);

    // 2. Verify password plaintext string against saved database bcrypt hash parameters
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
	
	console.log("=== DEBUG STEP 3: Bcrypt Match Evaluation ===");
  console.log("Does password match hash?:", isPasswordMatch);
  console.log("==========================================");
  
  
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid operational identifier number or credentials." });
    }

    // 3. Generate secure JWT payload token configuration data matrix
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.user_role,
      center_id: user.center_id,
      is_profile_claimed: user.is_profile_claimed
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 4. Return complete identity packet to client framework
    return res.status(200).json({
      message: "Authentication sequence successful.",
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.user_role,
		user_role: user.user_role,
        center_id: user.center_id,
        is_profile_claimed: user.is_profile_claimed
      }
    });

  } catch (error) {
    console.error("Login Controller Authentication Sequence Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};


// REGISTER MANAGER CONTROLLER
export const registerCenterManagerController = async (req, res) => {
  const { email, center_id } = req.body; // Using direct center_id integration matches standard REST patterns

  if (!email || !center_id) {
    return res.status(400).json({ message: "Email and target Center ID are required parameters." });
  }

  try {
    // 1. Generate unique 10-digit numeric identifier for Center Managers
    // Range: 1,000,000,000 to 9,999,999,999
    const managerNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const tempPasswordStr = managerNumber.toString(); 
    const passwordHash = await bcrypt.hash(tempPasswordStr, 10);

    // 2. Persist to database across subclass inheritance schemas
    const result = await registerCenterManager(email, managerNumber, center_id, passwordHash);

    if (result.status !== 201) {
      return res.status(result.status).json({ message: result.error });
    }

    // 3. Dispatch notification onboarding mail details
    const mailOptions = {
      from: `"Mutual Trust Management" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Manager Registration Invitation - Mutual Trust Portal',
      text: `Good Day,\n\nYour profile has been created successfully as a Center Manager.\n\n` +
            `Your Username / Registration Number: ${managerNumber}\n` +
            `Temporary Password: ${tempPasswordStr}\n\n` +
            `Please navigate to the profile completion screen upon your initial login sequence to claim your account and update your name details.\n\nWarm Regards,\nAdministration Team`
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Center Manager account created and registration invitation email dispatched successfully.",
      user: result.data
    });

  } catch (error) {
    console.error("Center Manager Registration Controller Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};


// REGISTER TEACHER CONTROLLER
export const registerTeacherController = async (req, res) => {
  // Destructure arrays out of request body with array fallbacks
  const { email, center_id, classIds = [], subjectIds = [], grades = [] } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Teacher notification email parameter is required." });
  }

  try {
    const finalCenterId = req.user.user_role === 'Admin' ? center_id : req.user.center_id;

    if (!finalCenterId) {
      return res.status(400).json({ message: "A valid Center ID context must be provided." });
    }

    const teacherNumber = Math.floor(100000000 + Math.random() * 900000000);
    const tempPasswordStr = teacherNumber.toString();
    const passwordHash = await bcrypt.hash(tempPasswordStr, 10);

    // 1. Create the core account profile
    const result = await registerTeacher(email, teacherNumber, finalCenterId, passwordHash);

    if (result.status !== 201) {
      return res.status(result.status).json({ message: result.error });
    }

    const newTeacherId = result.data.user_id;

    // 2. UPDATED: Multi-row pairing matrix including the new grades array structure
    if (classIds.length > 0 && subjectIds.length > 0) {
      for (const classId of classIds) {
        for (const subjectId of subjectIds) {
          // If you want each assignment row to link class + subject to each specific grade:
          if (grades.length > 0) {
            for (const grade of grades) {
              if (classId && subjectId && grade) {
                await assignTeacherToClass(
                  newTeacherId, 
                  parseInt(subjectId, 10), 
                  parseInt(classId, 10), 
                  parseInt(grade, 10) // <-- Passed down to your updated assignment matrix
                );
              }
            }
          } else {
            // Fallback if no specific grade array parameters were passed
            if (classId && subjectId) {
              await assignTeacherToClass(newTeacherId, parseInt(subjectId, 10), parseInt(classId, 10), null);
            }
          }
        }
      }
    }

    // 3. Dispatch automated onboarding email
    const mailOptions = {
      from: `"Mutual Trust Management" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Teacher Assignment Onboarding - Mutual Trust Portal',
      text: `Good Day,\n\nYou have been registered as an instructor under our system registry.\n\n` +
            `Your Username / Teacher Professional Number: ${teacherNumber}\n` +
            `Temporary Password: ${tempPasswordStr}\n\n` +
            `Please use these values to login and complete your profile configuration parameters.\n\nWarm Regards,\nCenter Administration`
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Teacher profile registered, invited, and assigned to curriculum schedules successfully.",
      user: result.data
    });

  } catch (error) {
    console.error("Teacher Registration Controller Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};


// REGISTER LEARNER CONTROLLER
export const registerLearnerController = async (req, res) => {
  // 1. ADD DEBUG LOG TO SEE EXACTLY WHAT THE FRONTEND SENDS
  console.log("Incoming registerLearner request body:", req.body);
  console.log("Authenticated User Session Context (req.user):", req.user);

  // Destructure with a fallback to both naming conventions
  const { email, grade, highschool, classId, classIds = [], subjectIds = [] } = req.body;

  if (!email || !grade || !highschool) {
    return res.status(400).json({ message: "Missing required onboarding fields: email, grade, or highschool." });
  }

  // Determine the target class ID (prefer the array element from the frontend form state)
  const targetClassId = classIds.length > 0 ? classIds[0] : classId;

  if (!targetClassId) {
    return res.status(400).json({ message: "A valid classroom or cohort block allocation is required for learners." });
  }

  if (!req.user || !req.user.center_id) {
    return res.status(403).json({ message: "Access Denied: Manager center tracking identification context is missing." });
  }

  try {
    const centerId = req.user.center_id;

    const learnerNumber = Math.floor(10000000 + Math.random() * 90000000);
    const tempPasswordStr = learnerNumber.toString();
    const passwordHash = await bcrypt.hash(tempPasswordStr, 10);

    // 2. Create core profile record using the verified targetClassId
    const result = await registerLearner(
      email, 
      learnerNumber, 
      centerId, 
      parseInt(grade, 10), 
      highschool, 
      passwordHash, 
      parseInt(targetClassId, 10)
    );

    if (result.status !== 201) {
      return res.status(result.status).json({ message: result.error });
    }

    const newLearnerId = result.data.user_id;

    // 3. Map multiple subject rows to the single class
    if (subjectIds.length > 0 && targetClassId) {
      for (const subjectId of subjectIds) {
        if (subjectId) {
          await enrollLearnerToClass(newLearnerId, parseInt(subjectId, 10), parseInt(targetClassId, 10));
        }
      }
    }

    // 4. Dispatch credentials via automated onboarding mail
    const mailOptions = {
      from: `"Mutual Trust Management" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Student Portal Access Account - Mutual Trust Portal',
      text: `Good Day,\n\nA academic student dashboard workspace has been reserved for you.\n\n` +
            `Your Username / Learner System Number: ${learnerNumber}\n` +
            `Temporary Password: ${tempPasswordStr}\n\n` +
            `Please use your learner number and temporary password to log in and set up your permanent login password.\n\nWarm Regards,\nAcademic Management Team`
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Learner profile initialized, class allocated, and subject catalogs bound successfully.",
      user: result.data
    });

  } catch (error) {
    console.error("Learner Registration Controller Error:", error);
    return res.status(500).json({ message: "Internal server processing failure." });
  }
};
// --------------------------------------------------------------------------------------------------------------------------------------------


// LOGOUT CONTROLLER
export const logoutUserController = async (req, res) => {
  try {
    // Since JWT architecture is inherently stateless, we instruct the 
    // client container to wipe its memory tokens cleanly.
    return res.status(200).json({ 
      message: "Logout successful. Clean up browser storage vectors downstream." 
    });
  } catch (error) {
    console.error("Logout Controller Processing Error:", error);
    return res.status(500).json({ message: "Internal server processing failure during logout." });
  }
};