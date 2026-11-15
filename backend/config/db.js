import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Recreate __dirname for the config folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv - looks up one level to find .env in the /backend folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

pool.query('SELECT NOW()')
  .then(() => console.log('Database pool initialized successfully'))
  .catch((err) => console.error('Database connection pool failure:', err.message));


// Function to check if ID number exists
export async function IDNumberExists(idNumber) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT user_id FROM users WHERE id_number = $1',
      [idNumber]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking ID number existence:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Function to get user by email
export async function getUserByEmail(email) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT user_id, first_name, last_name, email, password_hash, role, is_active
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return result.rows.length === 0 ? null : result.rows[0];
  } catch (error) {
    console.error('Error fetching user by email:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

//CENTER MANAGEMENT FUNCTIONS
//---------------------------------------------------------------------------------------------------------------

// ADD CENTER FUNCTION
export async function addCenter(center_name, center_address, center_capacity, center_province) {
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO centers (
                center_name, 
                center_address, 
                center_capacity, 
                center_province
            ) 
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [
            (center_name || '').trim(), 
            (center_address || '').trim(), 
            Number(center_capacity), 
            (center_province || '').trim()
        ];

        const result = await client.query(query, values);
        console.log(`Center "${result.rows[0].center_name}" added with ID ${result.rows[0].center_id}.`);
        return result.rows[0];
    } catch (err) {
        console.error("Error adding center:", err.stack);
        throw err;
    } finally {
        if (client) client.release();
    }
}

// SELECT A SINGLE CENTER BY ID
export async function getCenterById(center_id) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                center_id,
                center_name,
                center_address,
                center_capacity,
                center_province,
                is_active,
                reason_for_deactivation
            FROM centers
            WHERE center_id = $1
        `;
        const result = await client.query(query, [center_id]);
        return result.rows.length === 0 ? null : result.rows[0];
    } catch (err) {
        console.error(`Database Error in getCenterById for ID ${center_id}:`, err.stack);
        throw err;
    } finally {
        if (client) client.release();
    }
}

// SELECT ALL CENTERS FUNCTION
export async function getAllCenters(active_only = false) {
    const client = await pool.connect();
    try {
        let query = `
            SELECT 
                center_id, 
                center_name, 
                center_province, 
                center_capacity, 
                center_address, 
                is_active 
            FROM centers
        `;
        
        if (active_only) {
            query += ` WHERE is_active = TRUE`;
        }

        query += ` ORDER BY center_province ASC, center_name ASC`; 

        const result = await client.query(query);
        console.log(`Fetched ${result.rows.length} centers.`);
        return result.rows;
    } catch (err) {
        console.error("Error fetching all centers:", err.stack);
        throw err;
    } finally {
        if (client) client.release();
    }
}

// UPDATE CENTER DETAILS BY ID
export async function updateCenterDetails(center_id, { center_name, center_address, center_capacity, center_province }) {
    const client = await pool.connect();
    try {
        const query = `
            UPDATE centers 
            SET center_name = $1, 
                center_address = $2, 
                center_capacity = $3, 
                center_province = $4
            WHERE center_id = $5 AND is_active = TRUE
            RETURNING *;
        `;

        const values = [
            (center_name || '').trim(),
            (center_address || '').trim(),
            Number(center_capacity),
            (center_province || '').trim(),
            center_id
        ];

        const result = await client.query(query, values);
        return result.rows.length === 0 ? null : result.rows[0];
    } catch (err) {
        console.error(`Error updating center details for ID ${center_id}:`, err.stack);
        throw err;
    } finally {
        if (client) client.release();
    }
}

// DEACTIVATE CENTER BY ID
export async function deactivateCenter(center_id, reason) {
    const client = await pool.connect();
    try {
        const query = `
            UPDATE centers 
            SET is_active = FALSE, 
                reason_for_deactivation = $1 
            WHERE center_id = $2 AND is_active = TRUE
            RETURNING center_id, center_name, center_province, is_active;
        `;
        
        const values = [
            (reason || '').trim(), 
            center_id
        ];
        
        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        console.log(`Center "${result.rows[0].center_name}" (ID: ${result.rows[0].center_id}) soft-deactivated.`);
        return result.rows[0];
    } catch (err) {
        console.error(`Error deactivating center ID ${center_id}:`, err.stack);
        throw err;
    } finally {
        if (client) client.release();
    }
}
//---------------------------------------------------------------------------------------------------------------------------



// USER FUNCTIONS
// ------------------------------------------------------------------------------------------------------------

// LOGIN FUNCTION (Optimized into a Single Join Query)
export async function authenticateUserLogin(login_number) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                u.user_id, 
                u.first_name, 
                u.last_name, 
                u.email, 
                u.password_hash, 
                u.user_role, 
                u.center_id, 
                u.is_profile_claimed, 
                u.is_active,
                COALESCE(
                    a.admin_number::TEXT, 
                    cm.manager_number::TEXT, 
                    t.teacher_number::TEXT, 
                    l.learner_number::TEXT
                ) AS login_number,
                l.grade,
                l.highschool
            FROM users u
            LEFT JOIN admin a ON u.user_id = a.user_id
            LEFT JOIN center_managers cm ON u.user_id = cm.user_id
            LEFT JOIN teachers t ON u.user_id = t.user_id
            LEFT JOIN learners l ON u.user_id = l.user_id
            WHERE a.admin_number::TEXT = $1
               OR cm.manager_number::TEXT = $1
               OR t.teacher_number::TEXT = $1
               OR l.learner_number::TEXT = $1
            LIMIT 1;
        `;
        
        const result = await client.query(query, [String(login_number).trim()]);

        if (result.rows.length === 0) {
            return { error: "Invalid operational number or credentials", status: 401 };
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return { error: "This user profile has been deactivated.", status: 403 };
        }

        return { data: user, status: 200 };

    } catch (err) {
        console.error("Database Error during user authentication: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}

// COMPLETE PROFILE (Overwrites the NULL names and changes claimed to true)
export async function claimAndCompleteProfile(user_id, first_name, last_name, new_password_hash) {
    const client = await pool.connect();
    try {
        const query = `
            UPDATE users
            SET 
                first_name = $1,
                last_name = $2,
                password_hash = $3,
                is_profile_claimed = true
            WHERE user_id = $4 AND is_active = true
            RETURNING user_id, first_name, last_name, email, user_role, is_profile_claimed;
        `;
        
        const values = [
            (first_name || '').trim(), 
            (last_name || '').trim(), 
            new_password_hash, 
            user_id
        ];
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return { error: "Active user profile not found or already claimed", status: 404 };
        }

        return { data: result.rows[0], status: 200 };

    } catch (err) {
        console.error("Database Error during profile onboarding completion: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}

// REGISTER CENTER MANAGER (Using pure NULL initialization)
export async function registerCenterManager(email, manager_number, center_id, temp_password_hash) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const checkQuery = `
            SELECT email FROM users WHERE email = $1
            UNION
            SELECT email FROM users u JOIN center_managers cm ON u.user_id = cm.user_id WHERE cm.manager_number = $2;
        `;
        const checkResult = await client.query(checkQuery, [email, manager_number]);
        
        if (checkResult.rows.length > 0) {
            await client.query("ROLLBACK");
            return { error: "Conflict: Email address or Manager Number already registered.", status: 409 };
        }

        // Updated: first_name and last_name default cleanly to NULL now
        const insertUserQuery = `
            INSERT INTO users (first_name, last_name, email, password_hash, user_role, center_id, is_profile_claimed, is_active)
            VALUES (NULL, NULL, $1, $2, 'Center Manager', $3, false, true)
            RETURNING user_id;
        `;
        const userResult = await client.query(insertUserQuery, [email, temp_password_hash, center_id]);
        const newUserId = userResult.rows[0].user_id;

        const insertManagerQuery = `
            INSERT INTO center_managers (user_id, manager_number, center_id)
            VALUES ($1, $2, $3);
        `;
        await client.query(insertManagerQuery, [newUserId, manager_number, center_id]);

        await client.query("COMMIT");
        return { data: { user_id: newUserId, manager_number, center_id, email }, status: 201 };

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Database Error during center manager registration: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}

// REGISTER TEACHER
export async function registerTeacher(email, teacher_number, center_id, temp_password_hash) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const checkQuery = `
            SELECT email FROM users WHERE email = $1
            UNION
            SELECT email FROM users u JOIN teachers t ON u.user_id = t.user_id WHERE t.teacher_number = $2;
        `;
        const checkResult = await client.query(checkQuery, [email, teacher_number]);
        
        if (checkResult.rows.length > 0) {
            await client.query("ROLLBACK");
            return { error: "Conflict: Email address or Teacher Number already registered.", status: 409 };
        }

        const insertUserQuery = `
            INSERT INTO users (first_name, last_name, email, password_hash, user_role, center_id, is_profile_claimed, is_active)
            VALUES (NULL, NULL, $1, $2, 'Teacher', $3, false, true)
            RETURNING user_id;
        `;
        const userResult = await client.query(insertUserQuery, [email, temp_password_hash, center_id]);
        const newUserId = userResult.rows[0].user_id;

        const insertTeacherQuery = `
            INSERT INTO teachers (user_id, teacher_number, center_id)
            VALUES ($1, $2, $3);
        `;
        await client.query(insertTeacherQuery, [newUserId, teacher_number, center_id]);

        await client.query("COMMIT");
        return { data: { user_id: newUserId, teacher_number, center_id, email }, status: 201 };

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Database Error during teacher registration: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}

// REGISTER LEARNERS
export async function registerLearner(email, learner_number, center_id, grade, highschool, temp_password_hash, class_id) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const checkQuery = `
            SELECT email FROM users WHERE email = $1
            UNION
            SELECT email FROM users u JOIN learners l ON u.user_id = l.user_id WHERE l.learner_number = $2;
        `;
        const checkResult = await client.query(checkQuery, [email, learner_number]);
        
        if (checkResult.rows.length > 0) {
            await client.query("ROLLBACK");
            return { error: "Conflict: Email address or Learner Number already registered.", status: 409 };
        }

        const insertUserQuery = `
            INSERT INTO users (first_name, last_name, email, password_hash, user_role, center_id, is_profile_claimed, is_active)
            VALUES (NULL, NULL, $1, $2, 'Learner', $3, false, true)
            RETURNING user_id;
        `;
        const userResult = await client.query(insertUserQuery, [email, temp_password_hash, center_id]);
        const newUserId = userResult.rows[0].user_id;

        // UPDATED: Added class_id to the insert columns
        const insertLearnerQuery = `
            INSERT INTO learners (user_id, learner_number, center_id, grade, highschool, class_id)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
        
        await client.query(insertLearnerQuery, [
            newUserId, 
            learner_number, 
            center_id, 
            parseInt(grade, 10),               
            (highschool || '').trim(),
            class_id ? parseInt(class_id, 10) : null // Fallback to null if not provided (requires Option 1)
        ]);

        await client.query("COMMIT");
        return { data: { user_id: newUserId, learner_number, center_id, grade, highschool, email }, status: 201 };

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Database Error during learner registration: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}


// GET ALL USERS (With Smart Unclaimed Tracking Sorting)
export async function getAllUsersByRole(role_filter) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                u.user_id, u.first_name, u.last_name, u.email, u.user_role, u.center_id,
                u.is_profile_claimed, u.is_active, u.reason_for_deactivation, u.created_at,
                a.admin_number, cm.manager_number, t.teacher_number,
                l.learner_number, l.grade, l.highschool,
                
                -- Dynamic aggregate grouping structures
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object('class_id', c.class_id, 'class_name', c.class_name)) 
                    FILTER (WHERE c.class_id IS NOT NULL), '[]'
                ) AS assigned_classes,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object('subject_id', s.subject_id, 'subject_name', s.subject_name)) 
                    FILTER (WHERE s.subject_id IS NOT NULL), '[]'
                ) AS assigned_subjects

            FROM users u
            LEFT JOIN admin a ON u.user_id = a.user_id
            LEFT JOIN center_managers cm ON u.user_id = cm.user_id
            LEFT JOIN teachers t ON u.user_id = t.user_id
            LEFT JOIN learners l ON u.user_id = l.user_id
            
            -- Multi-relation mapping tables
            LEFT JOIN teacher_assignments ta ON t.user_id = ta.teacher_id
            LEFT JOIN learner_enrollments le ON l.user_id = le.learner_id
            
            -- Catalog resolution joins
            LEFT JOIN classes c ON c.class_id = COALESCE(ta.class_id, le.class_id, l.class_id)
            LEFT JOIN subjects s ON s.subject_id = COALESCE(ta.subject_id, le.subject_id)
            
            WHERE u.user_role = $1
            GROUP BY u.user_id, a.admin_number, cm.manager_number, t.teacher_number, l.learner_number, l.grade, l.highschool
            ORDER BY u.is_profile_claimed ASC, u.last_name ASC, u.first_name ASC;
        `;
        
        const result = await client.query(query, [role_filter]);
        return { data: result.rows, status: 200 };

    } catch (err) {
        console.error("Database Error during role fetch pipeline: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}

// SEARCH USERS (Expanded to look up by Name, Email, or Unique ID Number)
export async function searchUsersByName(search_query, role_scope = null) {
    const client = await pool.connect();
    try {
        let query = `
            SELECT 
                u.user_id, u.first_name, u.last_name, u.email, u.user_role, u.center_id, u.is_active,
                u.is_profile_claimed, -- 🚀 FIXED: Added explicitly to restore frontend visibility
                cm.manager_number, t.teacher_number, l.learner_number,
                COALESCE(json_agg(DISTINCT jsonb_build_object('class_id', c.class_id, 'class_name', c.class_name)) FILTER (WHERE c.class_id IS NOT NULL), '[]') AS assigned_classes,
                COALESCE(json_agg(DISTINCT jsonb_build_object('subject_id', s.subject_id, 'subject_name', s.subject_name)) FILTER (WHERE s.subject_id IS NOT NULL), '[]') AS assigned_subjects
            FROM users u
            LEFT JOIN center_managers cm ON u.user_id = cm.user_id
            LEFT JOIN teachers t ON u.user_id = t.user_id
            LEFT JOIN learners l ON u.user_id = l.user_id
            LEFT JOIN teacher_assignments ta ON t.user_id = ta.teacher_id
            LEFT JOIN learner_enrollments le ON l.user_id = le.learner_id
            LEFT JOIN classes c ON c.class_id = COALESCE(ta.class_id, le.class_id, l.class_id)
            LEFT JOIN subjects s ON s.subject_id = COALESCE(ta.subject_id, le.subject_id)
            WHERE (
                u.first_name ILIKE $1 
                OR u.last_name ILIKE $1 
                OR u.email ILIKE $1
                OR CAST(cm.manager_number AS TEXT) ILIKE $1
                OR CAST(t.teacher_number AS TEXT) ILIKE $1
                OR CAST(l.learner_number AS TEXT) ILIKE $1
            )
        `;
        
        const values = [`%${search_query.trim()}%`];

        if (role_scope) {
            query += ` AND u.user_role = $2`;
            values.push(role_scope);
        }

        // FIXED: Appended u.is_profile_claimed to the GROUP BY rule to comply with SQL validation specs
        query += ` 
            GROUP BY u.user_id, u.is_profile_claimed, cm.manager_number, t.teacher_number, l.learner_number
            ORDER BY u.is_profile_claimed ASC, u.last_name ASC LIMIT 50;
        `;
        
        const result = await client.query(query, values);
        return { data: result.rows, status: 200 };

    } catch (err) {
        console.error("Database Error during user name search pattern matching: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}

// UPDATE USER
export async function updateUserBaseDetails(user_id, first_name, last_name, email, role, optional_grade = null, optional_highschool = null, classIds = [], subjectIds = []) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Core Profile Modification
        const updateBaseQuery = `
            UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE user_id = $4 RETURNING user_id;
        `;
        const baseResult = await client.query(updateBaseQuery, [
            (first_name || '').trim(), (last_name || '').trim(), (email || '').trim().toLowerCase(), user_id
        ]);

        if (baseResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return { error: "User account context not found", status: 404 };
        }

        // 2. Syncing Learner Extensions
        if (role === 'Learner') {
            const targetClassId = classIds.length > 0 ? parseInt(classIds[0], 10) : null;

            const updateLearnerQuery = `
                UPDATE learners
                SET grade = COALESCE($1, grade), highschool = COALESCE($2, highschool), class_id = COALESCE($3, class_id)
                WHERE user_id = $4;
            `;
            await client.query(updateLearnerQuery, [optional_grade, optional_highschool ? optional_highschool.trim() : null, targetClassId, user_id]);

            if (subjectIds.length > 0 && targetClassId) {
                // Wipe existing enrollments and update with the newly selected ones
                await client.query(`DELETE FROM learner_enrollments WHERE learner_id = $1`, [user_id]);
                const insertEnrollment = `INSERT INTO learner_enrollments (learner_id, class_id, subject_id) VALUES ($1, $2, $3);`;
                for (const subId of subjectIds) {
                    if (subId) await client.query(insertEnrollment, [user_id, targetClassId, parseInt(subId, 10)]);
                }
            }
        }

        // 3. Syncing Teacher Extensions
        if (role === 'Teacher' && classIds.length > 0 && subjectIds.length > 0) {
            // Wipe existing assignments and update with the newly selected combinations
            await client.query(`DELETE FROM teacher_assignments WHERE teacher_id = $1`, [user_id]);
            const insertAssignment = `INSERT INTO teacher_assignments (teacher_id, class_id, subject_id) VALUES ($1, $2, $3);`;
            for (const clId of classIds) {
                for (const subId of subjectIds) {
                    if (clId && subId) {
                        await client.query(insertAssignment, [user_id, parseInt(clId, 10), parseInt(subId, 10)]);
                    }
                }
            }
        }

        await client.query("COMMIT");
        return { data: { message: "Account profile records successfully modified" }, status: 200 };

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Database Error during data alteration execution: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}

// DELETE USER (Soft Deactivate)
export async function softDeactivateUser(user_id, reason_for_deactivation) {
    const client = await pool.connect();
    try {
        const query = `
            UPDATE users
            SET 
                is_active = false,
                reason_for_deactivation = $1
            WHERE user_id = $2
            RETURNING user_id, is_active, reason_for_deactivation;
        `;
        
        const result = await client.query(query, [(reason_for_deactivation || '').trim(), user_id]);

        if (result.rows.length === 0) {
            return { error: "User account registry target not found", status: 404 };
        }

        return { data: result.rows[0], status: 200 };

    } catch (err) {
        console.error("Database Error executing soft deactivation audit layout: " + err.stack);
        return { error: "Internal Server Error", status: 500 };
    } finally {
        client.release();
    }
}
// ------------------------------------------------------------------------------------------------------------------------



// CLASSROOM functions
// ------------------------------------------------------------------------------------------------------------------------
// @desc Add Class (Aligned with table schema constraints)
export async function addClassroom(class_name, class_capacity, center_id) {
  const client = await pool.connect();
  try {
    // center_id is strictly required by your fk_class_center constraint
    const result = await client.query(
      `INSERT INTO classes (class_name, class_capacity, center_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [class_name, class_capacity, center_id]
    );

    return { data: result.rows[0], status: 200 };
  } catch (error) {
    console.error("DB Error (addClassroom):", error.message);
    return { error: "Failed to create class", status: 500 };
  } finally {
    client.release();
  }
}


// @desc Get Class by ID
export async function getClassroomById(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM classes WHERE class_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return { error: "Class not found", status: 404 };
    }

    return { data: result.rows[0], status: 200 };
  } catch (error) {
    console.error("DB Error (getClassroomById):", error.message);
    return { error: "Error fetching class record", status: 500 };
  } finally {
    client.release();
  }
}


// @desc Update Class Details
export async function updateClassroomDetails(id, name, capacity) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE classes
       SET class_name = $1,
           class_capacity = $2
       WHERE class_id = $3
       RETURNING *`,
      [name, capacity, id]
    );

    if (result.rows.length === 0) {
      return { error: "Class not found", status: 404 };
    }

    return { data: result.rows[0], status: 200 };
  } catch (error) {
    console.error("DB Error (updateClassroomDetails):", error.message);
    return { error: "Failed to update class details", status: 500 };
  } finally {
    client.release();
  }
}


// @desc Optional: Fetch all classes belonging to a specific center (Crucial for Center Managers)
export async function getClassesByCenter(center_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM classes WHERE center_id = $1 ORDER BY class_name ASC`,
      [center_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getClassesByCenter):", error.message);
    return { error: "Failed to fetch center classes", status: 500 };
  } finally {
    client.release();
  }
}


// @desc Deactivate Classroom (Soft delete)
export async function deactivateClassroom(id, reason = null) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE classroom
       SET is_active = false,
           reason_for_deactivation = $1
       WHERE classroom_id = $2
       RETURNING *`,
      [reason, id]
    );

    if (result.rows.length === 0) {
      return { error: "Classroom not found", status: 404 };
    }

    return { data: result.rows[0] };
  } catch (error) {
    console.error("DB Error (deactivateClassroom):", error.message);
    return { error: "Failed to deactivate classroom", status: 500 };
  } finally {
    client.release();
  }
}
// ------------------------------------------------------------------------------------------------------------------------

//TIMETABLE FUNCTIONS
// ------------------------------------------------------------------------------------------------------------------------
// @desc Add a schedule slot to the Timetable
export async function addTimetable(assignment_id, timetable_day, start_time, end_time) {
  const client = await pool.connect();
  try {
      const conflictCheck = await client.query(
        `SELECT t.timetable_id 
        FROM timetables t
        JOIN teacher_assignments ta ON t.assignment_id = ta.assignment_id
        WHERE ta.class_id = (SELECT class_id FROM teacher_assignments WHERE assignment_id = $1)
          AND t.timetable_day = $2
          AND (t.start_time, t.end_time) OVERLAPS ($3::TIME, $4::TIME)`,
        [assignment_id, timetable_day.toLowerCase(), start_time, end_time]
      );

    if (conflictCheck.rows.length > 0) {
      return { error: "Double-booking detected! This time slot overlaps with an existing lesson for this class.", status: 400 };
    }
    // Aligned with: timetables (assignment_id, timetable_day, start_time, end_time)
    const result = await client.query(
      `INSERT INTO timetables (assignment_id, timetable_day, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [assignment_id, timetable_day.toLowerCase(), start_time, end_time]
    );

    return { data: result.rows[0], status: 201 };
  } catch (error) {
    console.error("DB Error (addTimetable):", error.message);
    return { error: "Failed to create timetable slot", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Get single timetable record by ID
export async function getTimetableById(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM timetables WHERE timetable_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return { error: "Timetable slot not found", status: 404 };
    }

    return { data: result.rows[0], status: 200 };
  } catch (error) {
    console.error("DB Error (getTimetableById):", error.message);
    return { error: "Error fetching timetable record", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Update an existing timetable slot
export async function updateTimetableDetails(id, assignment_id, timetable_day, start_time, end_time) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE timetables
       SET assignment_id = $1,
           timetable_day = $2,
           start_time = $3,
           end_time = $4
       WHERE timetable_id = $5
       RETURNING *`,
      [assignment_id, timetable_day.toLowerCase(), start_time, end_time, id]
    );

    if (result.rows.length === 0) {
      return { error: "Timetable record not found", status: 404 };
    }

    return { data: result.rows[0], status: 200 };
  } catch (error) {
    console.error("DB Error (updateTimetableDetails):", error.message);
    return { error: "Failed to update timetable slot", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Hard Delete a timetable slot (Typically better than soft-delete for scheduling changes)
export async function deleteTimetableSlot(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM timetables WHERE timetable_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return { error: "Timetable slot not found", status: 404 };
    }

    return { data: { message: "Slot deleted successfully" }, status: 200 };
  } catch (error) {
    console.error("DB Error (deleteTimetableSlot):", error.message);
    return { error: "Failed to delete timetable slot", status: 500 };
  } finally {
    client.release();
  }
}


// This joins tables together so the frontend gets a readable calendar view.
export async function getClassTimetableDashboard(class_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        t.timetable_id,
        t.timetable_day,
        t.start_time,
        t.end_time,
        ta.assignment_id,
        s.subject_name,
        s.subject_code,
        s.grade,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name
       FROM timetables t
       INNER JOIN teacher_assignments ta ON t.assignment_id = ta.assignment_id
       INNER JOIN subjects s ON ta.subject_id = s.subject_id
       INNER JOIN users u ON ta.teacher_id = u.user_id
       WHERE ta.class_id = $1
       ORDER BY 
        CASE t.timetable_day
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
        END ASC, t.start_time ASC`,
      [class_id]
    );

    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getClassTimetableDashboard):", error.message);
    return { error: "Failed to fetch aggregated class timetable matrix", status: 500 };
  } finally {
    client.release();
  }
}
// ------------------------------------------------------------------------------------------------------------------------

//SUBJECTS FUNCTIONS
// ------------------------------------------------------------------------------------------------------------------------
// @desc Add a new subject to the global curriculum map
export async function addSubject(subject_name, subject_code, grade) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO subjects (subject_name, subject_code, grade)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [subject_name, subject_code, parseInt(grade)]
    );

    return { data: result.rows[0], status: 201 };
  } catch (error) {
    console.error("DB Error (addSubject):", error.message);
    return { error: "Failed to create subject record", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Get a single subject's details by its ID
export async function getSubjectById(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM subjects WHERE subject_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return { error: "Subject not found", status: 404 };
    }

    return { data: result.rows[0], status: 200 };
  } catch (error) {
    console.error("DB Error (getSubjectById):", error.message);
    return { error: "Error fetching subject details", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Get all subjects (Useful for dropdown select matrices on the frontend)
export async function getAllSubjects() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM subjects ORDER BY grade ASC, subject_name ASC`
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getAllSubjects):", error.message);
    return { error: "Failed to fetch curriculum subjects list", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Get subjects filtered by a specific grade level (e.g., Grade 10)
export async function getSubjectsByGrade(grade) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM subjects WHERE grade = $1 ORDER BY subject_name ASC`,
      [parseInt(grade)]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getSubjectsByGrade):", error.message);
    return { error: "Failed to filter subjects by grade level", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Update details of an existing subject configuration
export async function updateSubjectDetails(id, subject_name, subject_code, grade) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE subjects
       SET subject_name = $1,
           subject_code = $2,
           grade = $3
       WHERE subject_id = $4
       RETURNING *`,
      [subject_name, subject_code, parseInt(grade), id]
    );

    if (result.rows.length === 0) {
      return { error: "Subject record not found", status: 404 };
    }

    return { data: result.rows[0], status: 200 };
  } catch (error) {
    console.error("DB Error (updateSubjectDetails):", error.message);
    return { error: "Failed to update subject configuration", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Delete a subject from the catalog
// NOTE: Due to ON DELETE CASCADE on teacherAssignments, removing a subject will clear related allocations automatically.
export async function deleteSubject(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM subjects WHERE subject_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return { error: "Subject record not found", status: 404 };
    }

    return { data: { message: "Subject deleted successfully from infrastructure" }, status: 200 };
  } catch (error) {
    console.error("DB Error (deleteSubject):", error.message);
    return { error: "Failed to delete subject entry", status: 500 };
  } finally {
    client.release();
  }
}
// ------------------------------------------------------------------------------------------------------------------------


//TEACHER ASSIGNMENTS
// ------------------------------------------------------------------------------------------------------------------

// @desc Allocate a teacher to a subject inside a specific classroom space
export async function assignTeacherToClass(teacher_id, subject_id, class_id, grade) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO teacher_assignments (teacher_id, subject_id, class_id, grade)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teacher_id, subject_id, class_id,grade]
    );

    return { data: result.rows[0], status: 201 };
  } catch (error) {
    console.error("DB Error (assignTeacherToClass):", error.message);
    
    // Check if the database rejected it due to your UNIQUE constraint rules
    if (error.code === '23505') {
      return { error: "This exact teacher, subject, and class combination already exists.", status: 400 };
    }
    return { error: "Failed to create teacher allocation record", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Get assignments for a specific classroom space (Includes INNER JOINs for human-readable frontend displays)
export async function getAssignmentsByClass(class_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        ta.assignment_id,
        ta.class_id,
        s.subject_id,
        s.subject_name,
        s.subject_code,
        s.grade,
        u.user_id AS teacher_id,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        u.email AS teacher_email
       FROM teacher_assignments ta
       INNER JOIN subjects s ON ta.subject_id = s.subject_id
       INNER JOIN users u ON ta.teacher_id = u.user_id
       WHERE ta.class_id = $1
       ORDER BY s.subject_name ASC`,
      [class_id]
    );

    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getAssignmentsByClass):", error.message);
    return { error: "Failed to fetch class allocation structures", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Retrieve allocations specifically assigned to a single teacher user
export async function getAssignmentsByTeacher(teacher_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        ta.assignment_id,
        c.class_id,
        c.class_name,
        s.subject_id,
        s.subject_name,
        s.subject_code
       FROM teacher_assignments ta
       INNER JOIN classes c ON ta.class_id = c.class_id
       INNER JOIN subjects s ON ta.subject_id = s.subject_id
       WHERE ta.teacher_id = $1
       ORDER BY c.class_name ASC`,
      [teacher_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getAssignmentsByTeacher):", error.message);
    return { error: "Failed to fetch teacher task allocations", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Remove a teacher assignment layout row
// NOTE: Due to ON DELETE CASCADE rules, breaking an assignment automatically wipes its associated timetable slots.
export async function removeTeacherAssignment(assignment_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM teacher_assignments WHERE assignment_id = $1 RETURNING *`,
      [assignment_id]
    );

    if (result.rows.length === 0) {
      return { error: "Assignment link not found", status: 404 };
    }

    return { data: { message: "Teacher assignment unlinked and associated timetables purged successfully" }, status: 200 };
  } catch (error) {
    console.error("DB Error (removeTeacherAssignment):", error.message);
    return { error: "Failed to unbind teacher allocation mapping", status: 500 };
  } finally {
    client.release();
  }
}
// ------------------------------------------------------------------------------------------------------------------



// LEARNER ENROLLMENTS
// ------------------------------------------------------------------------------------------------------------------

// @desc Enroll a learner into a subject inside a specific classroom space
export async function enrollLearnerToClass(learner_id, subject_id, class_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO learner_enrollments (learner_id, subject_id, class_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [learner_id, subject_id, class_id]
    );

    return { data: result.rows[0], status: 201 };
  } catch (error) {
    console.error("DB Error (enrollLearnerToClass):", error.message);
    
    // Check if the database rejected it due to your UNIQUE constraint rules
    if (error.code === '23505') {
      return { error: "This exact learner is already enrolled in this subject and class combination.", status: 400 };
    }
    return { error: "Failed to create learner enrollment record", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Get all enrolled learners for a specific subject within a classroom space (Includes INNER JOINs for human-readable frontend displays)
export async function getEnrollmentsByClassAndSubject(class_id, subject_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        le.enrollment_id,
        le.class_id,
        le.subject_id,
        u.user_id AS learner_id,
        u.first_name AS learner_first_name,
        u.last_name AS learner_last_name,
        u.email AS learner_email,
        u.learner_number
       FROM learner_enrollments le
       INNER JOIN users u ON le.learner_id = u.user_id
       WHERE le.class_id = $1 AND le.subject_id = $2
       ORDER BY u.last_name ASC, u.first_name ASC`,
      [class_id, subject_id]
    );

    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getEnrollmentsByClassAndSubject):", error.message);
    return { error: "Failed to fetch class roster allocation structures", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Retrieve subject and class matrix records assigned to a single learner user
export async function getEnrollmentsByLearner(learner_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        le.enrollment_id,
        c.class_id,
        c.class_name,
        s.subject_id,
        s.subject_name,
        s.subject_code
       FROM learner_enrollments le
       INNER JOIN classes c ON le.class_id = c.class_id
       INNER JOIN subjects s ON le.subject_id = s.subject_id
       WHERE le.learner_id = $1
       ORDER BY s.subject_name ASC`,
      [learner_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getEnrollmentsByLearner):", error.message);
    return { error: "Failed to fetch learner curriculum profiles", status: 500 };
  } finally {
    client.release();
  }
}

// @desc Remove a learner enrollment track record entirely 
export async function removeLearnerEnrollment(enrollment_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM learner_enrollments WHERE enrollment_id = $1 RETURNING *`,
      [enrollment_id]
    );

    if (result.rows.length === 0) {
      return { error: "Enrollment tracking instance not found", status: 404 };
    }

    return { data: { message: "Learner unlinked from curriculum track successfully" }, status: 200 };
  } catch (error) {
    console.error("DB Error (removeLearnerEnrollment):", error.message);
    return { error: "Failed to unbind learner record mapping", status: 500 };
  } finally {
    client.release();
  }
}










// =====================================================================
// ATTENDANCE FUNCTIONS (owner: Vhutali)
// =====================================================================

// 6-char alphanumeric code, excluding confusable chars (no 0/O, 1/I/L)
function generateAttendanceCode(length = 6) {
  const SAFE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return code;
}

// @desc  Confirm a teacher owns an assignment before opening attendance for it
export async function teacherOwnsAssignment(teacher_user_id, assignment_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT assignment_id
         FROM teacher_assignments
        WHERE assignment_id = $1 AND teacher_id = $2`,
      [assignment_id, teacher_user_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error (teacherOwnsAssignment):", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// @desc  Create an attendance session: unique code, 10-min expiry, status 'open'
export async function createAttendanceSession(assignment_id, timetable_id = null, valid_minutes = 10) {
  const client = await pool.connect();
  const maxAttempts = 5;
  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = generateAttendanceCode(6);
      try {
        const result = await client.query(
          `INSERT INTO attendance
             (assignment_id, timetable_id, attendance_code, status, created_at, expires_at)
           VALUES
             ($1, $2, $3, 'open', now(), now() + ($4 || ' minutes')::interval)
           RETURNING attendance_id, attendance_code, status, created_at, expires_at`,
          [assignment_id, timetable_id, code, valid_minutes]
        );
        return { data: result.rows[0], status: 201 };
      } catch (err) {
        if (err.code === "23505" && attempt < maxAttempts - 1) continue;
        if (err.code === "23503") return { error: "That assignment does not exist.", status: 400 };
        throw err;
      }
    }
    return { error: "Could not generate a unique code, please retry.", status: 500 };
  } catch (error) {
    console.error("DB Error (createAttendanceSession):", error.message);
    return { error: "Failed to create attendance session", status: 500 };
  } finally {
    client.release();
  }
}


// =====================================================================
// STUDENT ATTENDANCE SUBMISSION (owner: Vhutali)
// =====================================================================

// @desc  Find an attendance session by its code. Also returns class_id +
//        subject_id so we can check the learner is enrolled in that class.
export async function findOpenSessionByCode(code) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         a.attendance_id,
         a.assignment_id,
         a.status,
         a.expires_at,
         ta.class_id,
         ta.subject_id,
         s.subject_name,
         c.class_name
       FROM attendance a
       JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
       JOIN subjects s ON ta.subject_id = s.subject_id
       JOIN classes  c ON ta.class_id  = c.class_id
       WHERE a.attendance_code = $1
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [String(code).trim().toUpperCase()]
    );
    return result.rows.length === 0 ? null : result.rows[0];
  } catch (error) {
    console.error("DB Error (findOpenSessionByCode):", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// @desc  Is this learner enrolled in the given class + subject?
export async function isLearnerEnrolled(learner_user_id, class_id, subject_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT enrollment_id
         FROM learner_enrollments
        WHERE learner_id = $1 AND class_id = $2 AND subject_id = $3`,
      [learner_user_id, class_id, subject_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error (isLearnerEnrolled):", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// @desc  Mark a learner present. The UNIQUE constraint stops duplicates.
export async function markLearnerPresent(attendance_id, learner_user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO attendance_record (attendance_id, learner_id, status, submitted_at)
       VALUES ($1, $2, 'present', now())
       RETURNING record_id, attendance_id, learner_id, status, submitted_at`,
      [attendance_id, learner_user_id]
    );
    return { data: result.rows[0], status: 201 };
  } catch (err) {
    if (err.code === "23505") {
      return { error: "You have already marked yourself present for this session.", status: 409 };
    }
    console.error("DB Error (markLearnerPresent):", err.message);
    return { error: "Failed to record attendance", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  A learner's recent attendance history (last 10 records).
export async function getLearnerAttendanceHistory(learner_user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         ar.record_id,
         ar.status,
         ar.submitted_at,
         s.subject_name,
         c.class_name
       FROM attendance_record ar
       JOIN attendance a  ON ar.attendance_id = a.attendance_id
       JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
       JOIN subjects s ON ta.subject_id = s.subject_id
       JOIN classes  c ON ta.class_id  = c.class_id
       WHERE ar.learner_id = $1
       ORDER BY ar.submitted_at DESC
       LIMIT 10`,
      [learner_user_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getLearnerAttendanceHistory):", error.message);
    return { error: "Failed to fetch attendance history", status: 500 };
  } finally {
    client.release();
  }
}


// =====================================================================
// ATTENDANCE VIEWING — TEACHER (owner: Vhutali)
// =====================================================================


// @desc  All attendance sessions this teacher has opened, newest first.
//        Includes present-count and roster size so the list can show "4 / 12".
export async function getSessionsByTeacher(teacher_user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         a.attendance_id,
         a.attendance_code,
         a.status,
         a.created_at,
         a.expires_at,
         s.subject_name,
         s.subject_code,
         c.class_name,
         (SELECT COUNT(*) FROM attendance_record ar
           WHERE ar.attendance_id = a.attendance_id)::int AS present_count,
         (SELECT COUNT(*) FROM learner_enrollments le
           WHERE le.class_id = ta.class_id
             AND le.subject_id = ta.subject_id)::int AS roster_count,
         (a.status = 'open' AND a.expires_at > now()) AS is_live
       FROM attendance a
       JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
       JOIN subjects s ON ta.subject_id = s.subject_id
       JOIN classes  c ON ta.class_id  = c.class_id
       WHERE ta.teacher_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [teacher_user_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getSessionsByTeacher):", error.message);
    return { error: "Failed to fetch your attendance sessions", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Confirm a session belongs to this teacher.
export async function teacherOwnsSession(teacher_user_id, attendance_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT a.attendance_id
         FROM attendance a
         JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
        WHERE a.attendance_id = $1 AND ta.teacher_id = $2`,
      [attendance_id, teacher_user_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error (teacherOwnsSession):", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// @desc  Full roster for one session. Learners with no record are ABSENT.
//        This is where 'absent' is computed rather than stored.
export async function getSessionRoster(attendance_id) {
  const client = await pool.connect();
  try {
       const sessionRes = await client.query(
      `SELECT
         a.attendance_id,
         a.attendance_code,
         a.status,
         a.created_at,
         a.expires_at,
         (a.status = 'open' AND a.expires_at > now()) AS is_live,
         ta.class_id,
         ta.subject_id,
         s.subject_name,
         c.class_name
       FROM attendance a
       JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
       JOIN subjects s ON ta.subject_id = s.subject_id
       JOIN classes  c ON ta.class_id  = c.class_id
       WHERE a.attendance_id = $1`,
      [attendance_id]
    );

    if (sessionRes.rows.length === 0) {
      return { error: "Attendance session not found", status: 404 };
    }
    const session = sessionRes.rows[0];

    const rosterRes = await client.query(
      `SELECT
         u.user_id      AS learner_id,
         u.first_name,
         u.last_name,
         l.learner_number,
         COALESCE(ar.status, 'absent') AS status,
         ar.submitted_at
       FROM learner_enrollments le
       JOIN users    u ON le.learner_id = u.user_id
       JOIN learners l ON le.learner_id = l.user_id
       LEFT JOIN attendance_record ar
              ON ar.learner_id = le.learner_id
             AND ar.attendance_id = $1
       WHERE le.class_id = $2 AND le.subject_id = $3
       ORDER BY u.last_name ASC, u.first_name ASC`,
      [attendance_id, session.class_id, session.subject_id]
    );

    const roster = rosterRes.rows;
    const present_count = roster.filter((r) => r.status !== "absent").length;

    return {
      data: {
        session,
        roster,
        stats: {
          present_count,
          absent_count: roster.length - present_count,
          roster_count: roster.length,
        },
      },
      status: 200,
    };
  } catch (error) {
    console.error("DB Error (getSessionRoster):", error.message);
    return { error: "Failed to fetch the session roster", status: 500 };
  } finally {
    client.release();
  }
}




// =====================================================================
// ATTENDANCE OVERSIGHT — CENTER MANAGER / ADMIN (owner: Vhutali)=====================================================================

//
// Attendance rate definition:
//   For a learner: (sessions they attended) / (sessions run for the
//   class+subject combos they are enrolled in).
//   A learner with no record for a session they were enrolled for = absent.
// ---------------------------------------------------------------------

// @desc  Centre-level attendance summary + a per-class breakdown.
//        Pass center_id (manager: their own; admin: whichever they pick).
export async function getCenterAttendanceOverview(center_id) {
  const client = await pool.connect();
  try {
    // Per-class rollup. For each class in the centre:
    //   sessions_run   = attendance sessions opened for that class
    //   expected       = sum over sessions of (learners enrolled in that class+subject)
    //   attended       = actual attendance_record rows for those sessions
    const result = await client.query(
      `WITH session_stats AS (
         SELECT
           c.class_id,
           c.class_name,
           a.attendance_id,
           (SELECT COUNT(*) FROM learner_enrollments le
             WHERE le.class_id = ta.class_id
               AND le.subject_id = ta.subject_id)::int AS expected,
           (SELECT COUNT(*) FROM attendance_record ar
             WHERE ar.attendance_id = a.attendance_id)::int AS attended
         FROM attendance a
         JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
         JOIN classes c ON ta.class_id = c.class_id
         WHERE c.center_id = $1
       )
       SELECT
         class_id,
         class_name,
         COUNT(attendance_id)::int      AS sessions_run,
         COALESCE(SUM(expected), 0)::int AS total_expected,
         COALESCE(SUM(attended), 0)::int AS total_attended,
         CASE
           WHEN COALESCE(SUM(expected), 0) = 0 THEN 0
           ELSE ROUND(100.0 * SUM(attended) / SUM(expected))::int
         END AS attendance_rate
       FROM session_stats
       GROUP BY class_id, class_name
       ORDER BY attendance_rate ASC, class_name ASC`,
      [center_id]
    );

    const classes = result.rows;

    // Centre-wide headline numbers, derived from the same rollup
    const totals = classes.reduce(
      (acc, c) => {
        acc.sessions_run += c.sessions_run;
        acc.total_expected += c.total_expected;
        acc.total_attended += c.total_attended;
        return acc;
      },
      { sessions_run: 0, total_expected: 0, total_attended: 0 }
    );

    const overall_rate =
      totals.total_expected === 0
        ? 0
        : Math.round((100 * totals.total_attended) / totals.total_expected);

    return {
      data: {
        summary: {
          sessions_run: totals.sessions_run,
          total_expected: totals.total_expected,
          total_attended: totals.total_attended,
          overall_rate,
          classes_tracked: classes.length,
        },
        classes,
      },
      status: 200,
    };
  } catch (error) {
    console.error("DB Error (getCenterAttendanceOverview):", error.message);
    return { error: "Failed to build the attendance overview", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Every attendance session run for one class (any teacher, any subject).
export async function getSessionsByClass(class_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         a.attendance_id,
         a.attendance_code,
         a.created_at,
         a.expires_at,
         (a.status = 'open' AND a.expires_at > now()) AS is_live,
         s.subject_name,
         s.subject_code,
         c.class_name,
         u.first_name AS teacher_first_name,
         u.last_name  AS teacher_last_name,
         (SELECT COUNT(*) FROM attendance_record ar
           WHERE ar.attendance_id = a.attendance_id)::int AS present_count,
         (SELECT COUNT(*) FROM learner_enrollments le
           WHERE le.class_id = ta.class_id
             AND le.subject_id = ta.subject_id)::int AS roster_count
       FROM attendance a
       JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
       JOIN subjects s ON ta.subject_id = s.subject_id
       JOIN classes  c ON ta.class_id  = c.class_id
       JOIN users    u ON ta.teacher_id = u.user_id
       WHERE ta.class_id = $1
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [class_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getSessionsByClass):", error.message);
    return { error: "Failed to fetch sessions for that class", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Per-learner attendance rates within one class.
//        expected = sessions run for the class+subject combos THAT learner
//        is enrolled in (so a learner enrolled in 1 of 2 subjects isn't
//        penalised for the subject they don't take).
export async function getLearnerRatesByClass(class_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         u.user_id AS learner_id,
         u.first_name,
         u.last_name,
         l.learner_number,
         -- sessions this learner was expected at
         (SELECT COUNT(*)
            FROM attendance a2
            JOIN teacher_assignments ta2 ON a2.assignment_id = ta2.assignment_id
            JOIN learner_enrollments le2
              ON le2.class_id  = ta2.class_id
             AND le2.subject_id = ta2.subject_id
           WHERE le2.learner_id = u.user_id
             AND ta2.class_id = $1)::int AS expected,
         -- sessions this learner actually attended
         (SELECT COUNT(*)
            FROM attendance_record ar2
            JOIN attendance a3 ON ar2.attendance_id = a3.attendance_id
            JOIN teacher_assignments ta3 ON a3.assignment_id = ta3.assignment_id
           WHERE ar2.learner_id = u.user_id
             AND ta3.class_id = $1)::int AS attended
       FROM learners l
       JOIN users u ON l.user_id = u.user_id
       WHERE l.class_id = $1
       ORDER BY u.last_name ASC, u.first_name ASC`,
      [class_id]
    );

    // Compute the rate in JS so the SQL stays readable
    const learners = result.rows.map((r) => ({
      ...r,
      attendance_rate:
        r.expected === 0 ? null : Math.round((100 * r.attended) / r.expected),
    }));

    return { data: learners, status: 200 };
  } catch (error) {
    console.error("DB Error (getLearnerRatesByClass):", error.message);
    return { error: "Failed to fetch learner attendance rates", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Guard: does this class belong to the given centre?
//        Managers may only view classes inside their own centre.
export async function classBelongsToCenter(class_id, center_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT class_id FROM classes WHERE class_id = $1 AND center_id = $2`,
      [class_id, center_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error (classBelongsToCenter):", error.message);
    throw error;
  } finally {
    client.release();
  }
}




// =====================================================================
// FEEDBACK FORMS — MANAGER (owner: Vhutali)
// =====================================================================

// @desc  Create a form and all its questions in ONE transaction.
//        Either the whole form lands, or nothing does.
//        questions: [{ question_text, question_type, is_required }]
export async function createFeedbackForm(
  { title, description, center_id, created_by, target_type, closes_at },
  questions
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const formRes = await client.query(
      `INSERT INTO feedback_forms
         (title, description, center_id, created_by, target_type, closes_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING form_id, title, description, target_type, is_open, created_at, closes_at`,
      [
        title.trim(),
        description ? description.trim() : null,
        center_id,
        created_by,
        target_type,
        closes_at || null,
      ]
    );

    const form = formRes.rows[0];

    // Insert the questions, preserving the order they were given in
    const inserted = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qRes = await client.query(
        `INSERT INTO feedback_questions
           (form_id, question_text, question_type, display_order, is_required)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING question_id, question_text, question_type, display_order, is_required`,
        [
          form.form_id,
          q.question_text.trim(),
          q.question_type,
          i,
          q.is_required !== false, // default true
        ]
      );
      inserted.push(qRes.rows[0]);
    }

    await client.query("COMMIT");
    return { data: { ...form, questions: inserted }, status: 201 };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DB Error (createFeedbackForm):", error.message);
    return { error: "Failed to create the feedback form", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  All forms in a centre, with how many responses each has had.
export async function getFormsByCenter(center_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         f.form_id,
         f.title,
         f.description,
         f.target_type,
         f.is_open,
         f.created_at,
         f.closes_at,
         (SELECT COUNT(*) FROM feedback_questions q
           WHERE q.form_id = f.form_id)::int AS question_count,
         (SELECT COUNT(*) FROM feedback_responses r
           WHERE r.form_id = f.form_id)::int AS response_count
       FROM feedback_forms f
       WHERE f.center_id = $1
       ORDER BY f.created_at DESC`,
      [center_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getFormsByCenter):", error.message);
    return { error: "Failed to fetch feedback forms", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  One form with its questions.
export async function getFormWithQuestions(form_id) {
  const client = await pool.connect();
  try {
    const formRes = await client.query(
      `SELECT form_id, title, description, center_id, target_type,
              is_open, created_at, closes_at
         FROM feedback_forms
        WHERE form_id = $1`,
      [form_id]
    );
    if (formRes.rows.length === 0) {
      return { error: "Feedback form not found", status: 404 };
    }

    const qRes = await client.query(
      `SELECT question_id, question_text, question_type, display_order, is_required
         FROM feedback_questions
        WHERE form_id = $1
        ORDER BY display_order ASC`,
      [form_id]
    );

    return {
      data: { ...formRes.rows[0], questions: qRes.rows },
      status: 200,
    };
  } catch (error) {
    console.error("DB Error (getFormWithQuestions):", error.message);
    return { error: "Failed to fetch the form", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Open or close a form (managers stop collecting responses).
export async function setFormOpenState(form_id, is_open) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE feedback_forms
          SET is_open = $1
        WHERE form_id = $2
        RETURNING form_id, title, is_open`,
      [is_open, form_id]
    );
    if (result.rows.length === 0) {
      return { error: "Feedback form not found", status: 404 };
    }
    return { data: result.rows[0], status: 200 };
  } catch (error) {
    console.error("DB Error (setFormOpenState):", error.message);
    return { error: "Failed to update the form", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Guard: does this form belong to the given centre?
export async function formBelongsToCenter(form_id, center_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT form_id FROM feedback_forms
        WHERE form_id = $1 AND center_id = $2`,
      [form_id, center_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error (formBelongsToCenter):", error.message);
    throw error;
  } finally {
    client.release();
  }
}




// =====================================================================
// FEEDBACK FORMS — LEARNER (owner: Vhutali)
// =====================================================================

// @desc  Forms currently open to a learner (their centre, still open,
//        not past their closing date).
export async function getOpenFormsForLearner(learner_user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         f.form_id,
         f.title,
         f.description,
         f.target_type,
         f.closes_at,
         (SELECT COUNT(*) FROM feedback_questions q
           WHERE q.form_id = f.form_id)::int AS question_count
       FROM feedback_forms f
       JOIN learners l ON l.center_id = f.center_id
       WHERE l.user_id = $1
         AND f.is_open = true
         AND (f.closes_at IS NULL OR f.closes_at > now())
       ORDER BY f.created_at DESC`,
      [learner_user_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getOpenFormsForLearner):", error.message);
    return { error: "Failed to fetch available forms", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  The targets a learner is allowed to give feedback about for a
//        given form, plus whether they've already submitted for each.
//        teacher -> only teachers who teach classes they're enrolled in
//        subject -> only subjects they're enrolled in
//        centre  -> just their own centre
export async function getFeedbackTargetsForLearner(learner_user_id, form_id, target_type) {
  const client = await pool.connect();
  try {
    let sql;

    if (target_type === 'teacher') {
      sql = `
        SELECT
          u.user_id AS target_id,
          (u.first_name || ' ' || u.last_name) AS target_name,
          STRING_AGG(DISTINCT s.subject_name, ', ' ORDER BY s.subject_name) AS target_detail,
          EXISTS (
            SELECT 1 FROM feedback_completions fc
             WHERE fc.form_id = $2
               AND fc.learner_id = $1
               AND fc.target_key = u.user_id
          ) AS already_submitted
        FROM learner_enrollments le
        JOIN teacher_assignments ta
          ON ta.class_id = le.class_id AND ta.subject_id = le.subject_id
        JOIN users    u ON ta.teacher_id = u.user_id
        JOIN subjects s ON ta.subject_id = s.subject_id
        WHERE le.learner_id = $1
        GROUP BY u.user_id, u.first_name, u.last_name
        ORDER BY target_name ASC`;
    } else if (target_type === 'subject') {
      sql = `
        SELECT DISTINCT
          s.subject_id AS target_id,
          s.subject_name AS target_name,
          s.subject_code AS target_detail,
          EXISTS (
            SELECT 1 FROM feedback_completions fc
             WHERE fc.form_id = $2
               AND fc.learner_id = $1
               AND fc.target_key = s.subject_id
          ) AS already_submitted
        FROM learner_enrollments le
        JOIN subjects s ON le.subject_id = s.subject_id
        WHERE le.learner_id = $1
        ORDER BY target_name ASC`;
    } else {
      // centre — a learner has exactly one
      sql = `
        SELECT
          c.center_id AS target_id,
          c.center_name AS target_name,
          c.center_province AS target_detail,
          EXISTS (
            SELECT 1 FROM feedback_completions fc
             WHERE fc.form_id = $2
               AND fc.learner_id = $1
               AND fc.target_key = c.center_id
          ) AS already_submitted
        FROM learners l
        JOIN centers c ON l.center_id = c.center_id
        WHERE l.user_id = $1`;
    }

    const result = await client.query(sql, [learner_user_id, form_id]);
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getFeedbackTargetsForLearner):", error.message);
    return { error: "Failed to fetch feedback targets", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Has this learner already submitted this form for this target?
export async function hasLearnerCompleted(form_id, learner_user_id, target_key) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT completion_id FROM feedback_completions
        WHERE form_id = $1 AND learner_id = $2 AND target_key = $3`,
      [form_id, learner_user_id, target_key]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error (hasLearnerCompleted):", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// @desc  Submit a completed form. ONE transaction writes:
//          feedback_responses  (anonymous — no learner_id)
//          feedback_answers    (the answers)
//          feedback_completions(learner marker — NOT linked to the answers)
//        answers: [{ question_id, rating_value?, text_value? }]
export async function submitFeedbackResponse(
  { form_id, target_type, target_key, learner_user_id },
  answers
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // The anonymous response row. Exactly one about_* column is set.
    const aboutTeacher = target_type === 'teacher' ? target_key : null;
    const aboutSubject = target_type === 'subject' ? target_key : null;
    const aboutCenter  = target_type === 'centre'  ? target_key : null;

    const respRes = await client.query(
      `INSERT INTO feedback_responses
         (form_id, about_teacher_id, about_subject_id, about_center_id)
       VALUES ($1, $2, $3, $4)
       RETURNING response_id, submitted_at`,
      [form_id, aboutTeacher, aboutSubject, aboutCenter]
    );
    const response = respRes.rows[0];

    // The answers
    for (const a of answers) {
      await client.query(
        `INSERT INTO feedback_answers
           (response_id, question_id, rating_value, text_value)
         VALUES ($1, $2, $3, $4)`,
        [
          response.response_id,
          a.question_id,
          a.rating_value ?? null,
          a.text_value ? String(a.text_value).trim() : null,
        ]
      );
    }

    // The completion marker — deliberately NOT linked to response_id,
    // so nobody can join it back to the answers.
    await client.query(
      `INSERT INTO feedback_completions (form_id, learner_id, target_key)
       VALUES ($1, $2, $3)`,
      [form_id, learner_user_id, target_key]
    );

    await client.query("COMMIT");
    return { data: { submitted_at: response.submitted_at }, status: 201 };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return { error: "You have already submitted this form for that target.", status: 409 };
    }
    console.error("DB Error (submitFeedbackResponse):", err.message);
    return { error: "Failed to submit your feedback", status: 500 };
  } finally {
    client.release();
  }
}



// =====================================================================
// FEEDBACK RESULTS — MANAGER (owner: Vhutali)
// =====================================================================

// Minimum responses about a target before results are revealed.
// Protects submitter anonymity in small classes: with only one or two
// responses, a teacher could work out who said what.
export const FEEDBACK_MIN_RESPONSES = 1;

// @desc  Aggregated results for one form, grouped by target.
//        Rating questions -> average + count + distribution
//        Text questions   -> the list of comments
//        Targets below FEEDBACK_MIN_RESPONSES are returned WITHOUT their
//        answers, flagged as suppressed.
export async function getFormResults(form_id) {
  const client = await pool.connect();
  try {
    // The form and its questions
    const formRes = await client.query(
      `SELECT form_id, title, description, target_type, is_open, center_id
         FROM feedback_forms WHERE form_id = $1`,
      [form_id]
    );
    if (formRes.rows.length === 0) {
      return { error: "Feedback form not found", status: 404 };
    }
    const form = formRes.rows[0];

    const qRes = await client.query(
      `SELECT question_id, question_text, question_type, display_order
         FROM feedback_questions
        WHERE form_id = $1
        ORDER BY display_order ASC`,
      [form_id]
    );
    const questions = qRes.rows;

    // How many responses per target, and the target's display name
    let targetNameSql;
    if (form.target_type === 'teacher') {
      targetNameSql = `
        SELECT r.about_teacher_id AS target_id,
               (u.first_name || ' ' || u.last_name) AS target_name,
               COUNT(*)::int AS response_count
          FROM feedback_responses r
          JOIN users u ON r.about_teacher_id = u.user_id
         WHERE r.form_id = $1
         GROUP BY r.about_teacher_id, u.first_name, u.last_name
         ORDER BY target_name ASC`;
    } else if (form.target_type === 'subject') {
      targetNameSql = `
        SELECT r.about_subject_id AS target_id,
               s.subject_name AS target_name,
               COUNT(*)::int AS response_count
          FROM feedback_responses r
          JOIN subjects s ON r.about_subject_id = s.subject_id
         WHERE r.form_id = $1
         GROUP BY r.about_subject_id, s.subject_name
         ORDER BY target_name ASC`;
    } else {
      targetNameSql = `
        SELECT r.about_center_id AS target_id,
               c.center_name AS target_name,
               COUNT(*)::int AS response_count
          FROM feedback_responses r
          JOIN centers c ON r.about_center_id = c.center_id
         WHERE r.form_id = $1
         GROUP BY r.about_center_id, c.center_name
         ORDER BY target_name ASC`;
    }

    const targetsRes = await client.query(targetNameSql, [form_id]);
    const targets = [];

    for (const t of targetsRes.rows) {
      // Below the threshold: reveal nothing but the count
      if (t.response_count < FEEDBACK_MIN_RESPONSES) {
        targets.push({
          target_id: t.target_id,
          target_name: t.target_name,
          response_count: t.response_count,
          suppressed: true,
          min_required: FEEDBACK_MIN_RESPONSES,
          results: null,
        });
        continue;
      }

      // Which column identifies this target
      const col =
        form.target_type === 'teacher' ? 'about_teacher_id'
        : form.target_type === 'subject' ? 'about_subject_id'
        : 'about_center_id';

      // Rating aggregates per question
      const ratingRes = await client.query(
        `SELECT
           a.question_id,
           COUNT(*)::int AS answer_count,
           ROUND(AVG(a.rating_value)::numeric, 2)::float AS average,
           COUNT(*) FILTER (WHERE a.rating_value = 1)::int AS r1,
           COUNT(*) FILTER (WHERE a.rating_value = 2)::int AS r2,
           COUNT(*) FILTER (WHERE a.rating_value = 3)::int AS r3,
           COUNT(*) FILTER (WHERE a.rating_value = 4)::int AS r4,
           COUNT(*) FILTER (WHERE a.rating_value = 5)::int AS r5
         FROM feedback_answers a
         JOIN feedback_responses r ON a.response_id = r.response_id
        WHERE r.form_id = $1
          AND r.${col} = $2
          AND a.rating_value IS NOT NULL
        GROUP BY a.question_id`,
        [form_id, t.target_id]
      );

      // Text comments per question. Ordered randomly so the order can't
      // be matched against submission times.
      const textRes = await client.query(
        `SELECT a.question_id, a.text_value
           FROM feedback_answers a
           JOIN feedback_responses r ON a.response_id = r.response_id
          WHERE r.form_id = $1
            AND r.${col} = $2
            AND a.text_value IS NOT NULL
          ORDER BY random()`,
        [form_id, t.target_id]
      );

      const ratingsByQ = new Map(ratingRes.rows.map((r) => [r.question_id, r]));
      const commentsByQ = new Map();
      for (const row of textRes.rows) {
        if (!commentsByQ.has(row.question_id)) commentsByQ.set(row.question_id, []);
        commentsByQ.get(row.question_id).push(row.text_value);
      }

      const results = questions.map((q) => {
        if (q.question_type === 'rating') {
          const agg = ratingsByQ.get(q.question_id);
          return {
            question_id: q.question_id,
            question_text: q.question_text,
            question_type: 'rating',
            answer_count: agg ? agg.answer_count : 0,
            average: agg ? agg.average : null,
            distribution: agg
              ? { 1: agg.r1, 2: agg.r2, 3: agg.r3, 4: agg.r4, 5: agg.r5 }
              : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          };
        }
        return {
          question_id: q.question_id,
          question_text: q.question_text,
          question_type: 'text',
          comments: commentsByQ.get(q.question_id) || [],
        };
      });

      targets.push({
        target_id: t.target_id,
        target_name: t.target_name,
        response_count: t.response_count,
        suppressed: false,
        results,
      });
    }

    return {
      data: {
        form_id: form.form_id,
        title: form.title,
        description: form.description,
        target_type: form.target_type,
        is_open: form.is_open,
        min_required: FEEDBACK_MIN_RESPONSES,
        targets,
      },
      status: 200,
    };
  } catch (error) {
    console.error("DB Error (getFormResults):", error.message);
    return { error: "Failed to fetch form results", status: 500 };
  } finally {
    client.release();
  }
}


// @desc  A learner's own attendance rate — overall and per subject.
//        Same definition as the oversight rates: attended / sessions run
//        for the class+subject combos the learner is enrolled in.
export async function getLearnerOwnAttendanceStats(learner_user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         s.subject_id,
         s.subject_name,
         s.subject_code,
         (SELECT COUNT(*)
            FROM attendance a
            JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
           WHERE ta.class_id = le.class_id
             AND ta.subject_id = le.subject_id)::int AS sessions_run,
         (SELECT COUNT(*)
            FROM attendance_record ar
            JOIN attendance a ON ar.attendance_id = a.attendance_id
            JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
           WHERE ar.learner_id = $1
             AND ta.class_id = le.class_id
             AND ta.subject_id = le.subject_id)::int AS attended
       FROM learner_enrollments le
       JOIN subjects s ON le.subject_id = s.subject_id
       WHERE le.learner_id = $1
       ORDER BY s.subject_name ASC`,
      [learner_user_id]
    );

    const subjects = result.rows.map((r) => ({
      ...r,
      attendance_rate:
        r.sessions_run === 0 ? null : Math.round((100 * r.attended) / r.sessions_run),
    }));

    const totalRun = subjects.reduce((sum, s) => sum + s.sessions_run, 0);
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const overall_rate = totalRun === 0 ? null : Math.round((100 * totalAttended) / totalRun);

    return {
      data: {
        overall_rate,
        total_attended: totalAttended,
        total_sessions: totalRun,
        subjects,
      },
      status: 200,
    };
  } catch (error) {
    console.error("DB Error (getLearnerOwnAttendanceStats):", error.message);
    return { error: "Failed to fetch attendance stats", status: 500 };
  } finally {
    client.release();
  }
}

//==================================================================================


//JAY'S FUNCTIONS
//-------------------------------------------------------------------------------------------------------------------------



export async function getMemoranda(ass_id) {
  const client = await pool.connect();
  try {
    const result = await pool.query(`SELECT * FROM assessment_memoranda WHERE assessment_id = $1`, [ass_id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error Assessment memoranda not found:", error.message);
    throw error;
  } finally {
    client.release();
  }
}




// =====================================================================
// LESSON PLANNER (owner: Vhutali)
// Uses the existing lessonplanner table.
// One lesson per class per date (enforced by a unique constraint).
// =====================================================================

// @desc  Confirm a teacher is assigned to this subject+class before they
//        can plan a lesson for it.
export async function teacherTeachesClass(teacher_user_id, subject_id, class_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT assignment_id
         FROM teacher_assignments
        WHERE teacher_id = $1 AND subject_id = $2 AND class_id = $3`,
      [teacher_user_id, subject_id, class_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error (teacherTeachesClass):", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// @desc  Create a lesson-plan entry.
//        planner_type defaults to 'lesson'. Unique (class_id, lesson_date)
//        means one lesson per class per day — a clash returns 409.
export async function createLessonPlan({
  teacher_id, subject_id, class_id, week, lesson_date, topic, planner_type,
}) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO lessonplanner
         (teacher_id, subject_id, class_id, week, lesson_date, topic, planner_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING planner_id, teacher_id, subject_id, class_id, week,
                 lesson_date, topic, planner_type, created_at`,
      [
        teacher_id, subject_id, class_id, week, lesson_date,
        topic ? topic.trim() : null,
        planner_type || 'lesson',
      ]
    );
    return { data: result.rows[0], status: 201 };
  } catch (error) {
    if (error.code === "23505") {
      return { error: "A lesson is already planned for this class on that date.", status: 409 };
    }
    console.error("DB Error (createLessonPlan):", error.message);
    return { error: "Failed to create the lesson plan", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  A teacher's own lessons, newest date first, with subject/class names.
export async function getLessonsByTeacher(teacher_user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         lp.planner_id,
         lp.week,
         lp.lesson_date,
         lp.topic,
         lp.planner_type,
         lp.subject_id,
         lp.class_id,
         s.subject_name,
         s.subject_code,
         c.class_name
       FROM lessonplanner lp
       JOIN subjects s ON lp.subject_id = s.subject_id
       JOIN classes  c ON lp.class_id  = c.class_id
       WHERE lp.teacher_id = $1
       ORDER BY lp.lesson_date DESC`,
      [teacher_user_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getLessonsByTeacher):", error.message);
    return { error: "Failed to fetch your lessons", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Confirm a lesson belongs to this teacher (guard before edit/delete).
export async function teacherOwnsLesson(teacher_user_id, planner_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT planner_id FROM lessonplanner
        WHERE planner_id = $1 AND teacher_id = $2`,
      [planner_id, teacher_user_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("DB Error (teacherOwnsLesson):", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// @desc  Update a lesson's topic / week / date.
export async function updateLessonPlan(planner_id, { week, lesson_date, topic }) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE lessonplanner
          SET week = COALESCE($2, week),
              lesson_date = COALESCE($3, lesson_date),
              topic = COALESCE($4, topic)
        WHERE planner_id = $1
        RETURNING planner_id, week, lesson_date, topic, planner_type`,
      [planner_id, week ?? null, lesson_date ?? null, topic ? topic.trim() : null]
    );
    if (result.rows.length === 0) {
      return { error: "Lesson not found", status: 404 };
    }
    return { data: result.rows[0], status: 200 };
  } catch (error) {
    if (error.code === "23505") {
      return { error: "Another lesson is already planned for this class on that date.", status: 409 };
    }
    console.error("DB Error (updateLessonPlan):", error.message);
    return { error: "Failed to update the lesson", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Delete a lesson.
export async function deleteLessonPlan(planner_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM lessonplanner WHERE planner_id = $1 RETURNING planner_id`,
      [planner_id]
    );
    if (result.rows.length === 0) {
      return { error: "Lesson not found", status: 404 };
    }
    return { data: { deleted: planner_id }, status: 200 };
  } catch (error) {
    console.error("DB Error (deleteLessonPlan):", error.message);
    return { error: "Failed to delete the lesson", status: 500 };
  } finally {
    client.release();
  }
}

// @desc  Lessons a learner can see: for the classes+subjects they're enrolled in.
//        Full history + upcoming, newest first.
export async function getLessonsForLearner(learner_user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT DISTINCT
         lp.planner_id,
         lp.week,
         lp.lesson_date,
         lp.topic,
         lp.planner_type,
         s.subject_name,
         s.subject_code,
         c.class_name,
         (u.first_name || ' ' || u.last_name) AS teacher_name
       FROM lessonplanner lp
       JOIN learner_enrollments le
         ON le.class_id = lp.class_id AND le.subject_id = lp.subject_id
       JOIN subjects s ON lp.subject_id = s.subject_id
       JOIN classes  c ON lp.class_id  = c.class_id
       JOIN users    u ON lp.teacher_id = u.user_id
       WHERE le.learner_id = $1
       ORDER BY lp.lesson_date DESC`,
      [learner_user_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getLessonsForLearner):", error.message);
    return { error: "Failed to fetch lessons", status: 500 };
  } finally {
    client.release();
  }
}




// =====================================================================
// FLAGGING  (owner: Vhutali)
// Reads existing data and computes a per-learner risk score (0-70).
// Higher score = more at risk. Four components, per the spec:
//   attendance (20) + quiz participation (20)
//   + quiz performance (20) + material engagement (10)
//
// Each component function returns raw numbers for a set of learners so they can be tested in isolation. computeRiskForLearners() combines
// them into a score + breakdown per learner.
//=====================================================================

// ---- band helpers (translate a rate/percentage into risk points) ----

// Attendance: >=90->0, 80-89->5, 70-79->10, 60-69->15, <60->20
function attendancePoints(ratePct) {
  if (ratePct === null) return { points: 0, note: "no sessions yet" };
  if (ratePct >= 90) return { points: 0, note: `${ratePct}% attendance` };
  if (ratePct >= 80) return { points: 5, note: `${ratePct}% attendance` };
  if (ratePct >= 70) return { points: 10, note: `${ratePct}% attendance` };
  if (ratePct >= 60) return { points: 15, note: `${ratePct}% attendance` };
  return { points: 20, note: `${ratePct}% attendance (low)` };
}

// Quiz performance: >=75->0, 60-74->5, 50-59->10, 40-49->15, <40->20
function performancePoints(avgPct) {
  if (avgPct === null) return { points: 0, note: "no graded quizzes yet" };
  if (avgPct >= 75) return { points: 0, note: `${avgPct}% average` };
  if (avgPct >= 60) return { points: 5, note: `${avgPct}% average` };
  if (avgPct >= 50) return { points: 10, note: `${avgPct}% average` };
  if (avgPct >= 40) return { points: 15, note: `${avgPct}% average` };
  return { points: 20, note: `${avgPct}% average (low)` };
}

// =====================================================================
// COMPONENT 1: attendance rate per learner (for a set of learner ids)
// Rate = attended sessions / sessions run, across their enrolled
// subject+class combos. Returns { learner_id -> ratePct|null }.
// =====================================================================
export async function getAttendanceRates(learnerIds) {
  if (!learnerIds.length) return {};
  const client = await pool.connect();
  try {
    const result = await client.query(
      `WITH enrolled AS (
         SELECT le.learner_id, le.class_id, le.subject_id
           FROM learner_enrollments le
          WHERE le.learner_id = ANY($1)
       ),
       sessions AS (
         SELECT e.learner_id,
                (SELECT COUNT(*)
                   FROM attendance a
                   JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
                  WHERE ta.class_id = e.class_id AND ta.subject_id = e.subject_id) AS run,
                (SELECT COUNT(*)
                   FROM attendance_record ar
                   JOIN attendance a ON ar.attendance_id = a.attendance_id
                   JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
                  WHERE ar.learner_id = e.learner_id
                    AND ta.class_id = e.class_id AND ta.subject_id = e.subject_id) AS attended
           FROM enrolled e
       )
       SELECT learner_id,
              SUM(run)::int AS total_run,
              SUM(attended)::int AS total_attended
         FROM sessions
        GROUP BY learner_id`,
      [learnerIds]
    );
    const out = {};
    for (const r of result.rows) {
      out[r.learner_id] =
        r.total_run === 0 ? null : Math.round((100 * r.total_attended) / r.total_run);
    }
    // learners with no enrollment rows at all
    for (const id of learnerIds) if (!(id in out)) out[id] = null;
    return out;
  } finally {
    client.release();
  }
}

// =====================================================================
// COMPONENT 2: quiz participation per learner.
// published assessments for their enrolled subject+class = expected.
// attempted = has a submission (submitted or graded).
// Returns { learner_id -> { expected, attempted } }.
// =====================================================================
export async function getQuizParticipation(learnerIds) {
  if (!learnerIds.length) return {};
  const client = await pool.connect();
  try {
    const result = await client.query(
      `WITH expected AS (
         SELECT le.learner_id, a.id AS assessment_id
           FROM learner_enrollments le
           JOIN assessments a
             ON a.class_id = le.class_id AND a.subject_id = le.subject_id
          WHERE le.learner_id = ANY($1)
            AND a.status = 'published'
       )
       SELECT e.learner_id,
              COUNT(*)::int AS expected,
              COUNT(s.id)::int AS attempted
         FROM expected e
         LEFT JOIN assessment_submissions s
           ON s.assessment_id = e.assessment_id
          AND s.student_id = e.learner_id
        GROUP BY e.learner_id`,
      [learnerIds]
    );
    const out = {};
    for (const r of result.rows) {
      out[r.learner_id] = { expected: r.expected, attempted: r.attempted };
    }
    for (const id of learnerIds) if (!(id in out)) out[id] = { expected: 0, attempted: 0 };
    return out;
  } finally {
    client.release();
  }
}

// =====================================================================
// COMPONENT 3: quiz performance per learner.
// Average of (score/max_score) across GRADED submissions, as a %.
// Returns { learner_id -> avgPct|null }.
// =====================================================================
export async function getQuizPerformance(learnerIds) {
  if (!learnerIds.length) return {};
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT s.student_id AS learner_id,
              AVG( (s.score / NULLIF(s.max_score, 0)) * 100 ) AS avg_pct
         FROM assessment_submissions s
         JOIN assessments a ON s.assessment_id = a.id
        WHERE s.student_id = ANY($1)
          AND s.status = 'graded'
          AND s.score IS NOT NULL
          AND s.max_score IS NOT NULL
        GROUP BY s.student_id`,
      [learnerIds]
    );
    const out = {};
    for (const r of result.rows) {
      out[r.learner_id] = r.avg_pct === null ? null : Math.round(Number(r.avg_pct));
    }
    for (const id of learnerIds) if (!(id in out)) out[id] = null;
    return out;
  } finally {
    client.release();
  }
}

// =====================================================================
// COMPONENT 4: material engagement per learner (Approach 3).
// For each material in the learner's enrolled subject+class, judge their
// open against the material's uploaded_at:
//   opened before/on upload .. 0
//   within 3 days after ....... 3
//   more than 3 days after .... 6
//   never opened .............. 10
// Average those per-material points -> 0..10 engagement score.
// Returns { learner_id -> { avgPoints, materialsCount, openedCount } }.
// =====================================================================
export async function getMaterialEngagement(learnerIds) {
  if (!learnerIds.length) return {};
  const client = await pool.connect();
  try {
    const result = await client.query(
      `WITH learner_materials AS (
         SELECT DISTINCT le.learner_id, lm.material_id, lm.uploaded_at
           FROM learner_enrollments le
           JOIN learningmaterial lm
             ON lm.class_id = le.class_id AND lm.subject_id = le.subject_id
          WHERE le.learner_id = ANY($1)
       ),
       scored AS (
         SELECT lmx.learner_id,
                lmx.material_id,
                mo.opened_at,
                CASE
                  WHEN mo.opened_at IS NULL THEN 10
                  WHEN mo.opened_at <= lmx.uploaded_at THEN 0
                  WHEN mo.opened_at <= lmx.uploaded_at + INTERVAL '3 days' THEN 3
                  ELSE 6
                END AS points
           FROM learner_materials lmx
           LEFT JOIN LATERAL (
             SELECT mo.opened_at
               FROM material_opens mo
              WHERE mo.learner_id = lmx.learner_id
                AND mo.material_id = lmx.material_id
              ORDER BY mo.opened_at ASC
              LIMIT 1
           ) mo ON true
       )
       SELECT learner_id,
              COUNT(*)::int AS materials_count,
              COUNT(opened_at)::int AS opened_count,
              AVG(points) AS avg_points
         FROM scored
        GROUP BY learner_id`,
      [learnerIds]
    );
    const out = {};
    for (const r of result.rows) {
      out[r.learner_id] = {
        avgPoints: r.avg_points === null ? 0 : Math.round(Number(r.avg_points) * 10) / 10,
        materialsCount: r.materials_count,
        openedCount: r.opened_count,
      };
    }
    for (const id of learnerIds) if (!(id in out)) {
      out[id] = { avgPoints: 0, materialsCount: 0, openedCount: 0 };
    }
    return out;
  } finally {
    client.release();
  }
}

// =====================================================================
// COMBINER: compute the full risk score + breakdown for a set of learners.
// =====================================================================
export async function computeRiskForLearners(learners) {
  // learners: [{ learner_id, first_name, last_name, class_name, ... }]
  const ids = learners.map((l) => l.learner_id);
  if (!ids.length) return [];

  const [attendance, participation, performance, engagement] = await Promise.all([
    getAttendanceRates(ids),
    getQuizParticipation(ids),
    getQuizPerformance(ids),
    getMaterialEngagement(ids),
  ]);

  return learners.map((l) => {
    const id = l.learner_id;

    // 1. attendance (max 20)
    const att = attendancePoints(attendance[id]);

    // 2. participation (max 20): any expected quizzes not attempted -> 20
    const p = participation[id] || { expected: 0, attempted: 0 };
    let partPoints = 0;
    let partNote;
    if (p.expected === 0) {
      partNote = "no quizzes set yet";
    } else if (p.attempted >= p.expected) {
      partPoints = 0;
      partNote = `attempted all ${p.expected}`;
    } else {
      partPoints = 20;
      partNote = `attempted ${p.attempted} of ${p.expected}`;
    }

    // 3. performance (max 20)
    const perf = performancePoints(performance[id]);

    // 4. engagement (max 10) — already 0..10 from the component
    const eng = engagement[id] || { avgPoints: 0, materialsCount: 0, openedCount: 0 };
    const engPoints = Math.round(eng.avgPoints);
    const engNote =
      eng.materialsCount === 0
        ? "no materials yet"
        : `opened ${eng.openedCount} of ${eng.materialsCount} materials`;

    const total = att.points + partPoints + perf.points + engPoints;

    let band;
    if (total <= 20) band = "low";
    else if (total <= 40) band = "medium";
    else band = "high";

    return {
      learner_id: id,
      name: `${l.first_name} ${l.last_name}`,
      class_name: l.class_name,
      total,
      band,
      breakdown: {
        attendance: { points: att.points, max: 20, note: att.note },
        participation: { points: partPoints, max: 20, note: partNote },
        performance: { points: perf.points, max: 20, note: perf.note },
        engagement: { points: engPoints, max: 10, note: engNote },
      },
    };
  });
}



// =====================================================================
// FLAGGING - audience functions (who can each role see)
// =====================================================================
 
// @desc  Learners in the classes a teacher teaches (distinct).
export async function getLearnersForTeacher(teacher_user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT DISTINCT
         u.user_id AS learner_id,
         u.first_name,
         u.last_name,
         c.class_name
       FROM teacher_assignments ta
       JOIN learners l   ON l.class_id = ta.class_id
       JOIN users u      ON u.user_id = l.user_id
       JOIN classes c    ON c.class_id = l.class_id
       WHERE ta.teacher_id = $1
       ORDER BY u.last_name, u.first_name`,
      [teacher_user_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getLearnersForTeacher):", error.message);
    return { error: "Failed to fetch learners", status: 500 };
  } finally {
    client.release();
  }
}
 
// @desc  Learners in a centre (for manager/admin oversight).
export async function getLearnersForCentre(center_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         u.user_id AS learner_id,
         u.first_name,
         u.last_name,
         c.class_name
       FROM learners l
       JOIN users u   ON u.user_id = l.user_id
       JOIN classes c ON c.class_id = l.class_id
       WHERE l.center_id = $1
       ORDER BY u.last_name, u.first_name`,
      [center_id]
    );
    return { data: result.rows, status: 200 };
  } catch (error) {
    console.error("DB Error (getLearnersForCentre):", error.message);
    return { error: "Failed to fetch learners", status: 500 };
  } finally {
    client.release();
  }
}
 
// @desc  The centre a manager/admin belongs to (from users.center_id).
export async function getUserCentre(user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT center_id FROM users WHERE user_id = $1`,
      [user_id]
    );
    return result.rows[0]?.center_id ?? null;
  } catch (error) {
    console.error("DB Error (getUserCentre):", error.message);
    throw error;
  } finally {
    client.release();
  }
}
 