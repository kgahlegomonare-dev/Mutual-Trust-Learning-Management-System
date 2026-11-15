import { pool } from "../config/db.js";
import { termFromDate } from "../utils/termUtils.js";

const toNumber = (value, decimals = 2) => {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(decimals)) : 0;
};

const getManagerCenterId = async (managerId) => {
  const { rows } = await pool.query(
    "SELECT center_id FROM center_managers WHERE user_id = $1 LIMIT 1",
    [managerId]
  );

  if (!rows.length) throw new Error("The authenticated manager is not assigned to a centre.");
  return rows[0].center_id;
};

const ATTENDANCE_OPPORTUNITIES = `attendance_opportunities AS (
  SELECT DISTINCT
    a.attendance_id,
    a.created_at AS attendance_date,
    ta.class_id,
    ta.subject_id,
    le.learner_id,
    l.center_id,
    EXISTS (
      SELECT 1 FROM attendance_record ar
      WHERE ar.attendance_id = a.attendance_id
        AND ar.learner_id = le.learner_id
        AND LOWER(ar.status) IN ('present', 'late')
    ) AS is_present
  FROM attendance a
  JOIN teacher_assignments ta ON ta.assignment_id = a.assignment_id
  JOIN learner_enrollments le ON le.class_id = ta.class_id AND le.subject_id = ta.subject_id
  JOIN learners l ON l.user_id = le.learner_id
  JOIN users u ON u.user_id = l.user_id
  WHERE u.is_active = TRUE
    AND (LOWER(a.status) = 'closed' OR a.expires_at <= NOW())
)`;

export const getOverview = async (managerId) => {
  const centerId = await getManagerCenterId(managerId);
  const { rows } = await pool.query(
    `WITH ${ATTENDANCE_OPPORTUNITIES},
     active_students AS (
       SELECT l.user_id
       FROM learners l
       JOIN users u ON u.user_id = l.user_id
       WHERE l.center_id = $1 AND u.is_active = TRUE
     ),
     graded_submissions AS (
       SELECT sub.student_id,
         100.0 * sub.score::numeric / NULLIF(sub.max_score, 0) AS percentage
       FROM assessment_submissions sub
       JOIN assessments a ON a.id = sub.assessment_id
       JOIN learners l ON l.user_id = sub.student_id
       WHERE l.center_id = $1 AND sub.status = 'graded'
         AND sub.score IS NOT NULL AND sub.max_score > 0
     ),
     student_performance AS (
       SELECT ast.user_id AS student_id, COALESCE(AVG(gs.percentage), 0) AS average_mark
       FROM active_students ast
       LEFT JOIN graded_submissions gs ON gs.student_id = ast.user_id
       GROUP BY ast.user_id
     ),
     student_attendance AS (
       SELECT ast.user_id AS student_id,
         COALESCE(100.0 * COUNT(ao.attendance_id) FILTER (WHERE ao.is_present)::numeric
           / NULLIF(COUNT(ao.attendance_id), 0), 0) AS attendance_rate
       FROM active_students ast
       LEFT JOIN attendance_opportunities ao ON ao.learner_id = ast.user_id AND ao.center_id = $1
       GROUP BY ast.user_id
     )
     SELECT
       (SELECT COUNT(*) FROM active_students)::int AS total_students,
       (SELECT COUNT(*) FROM teachers t JOIN users u ON u.user_id = t.user_id
         WHERE t.center_id = $1 AND u.is_active = TRUE)::int AS total_teachers,
       COALESCE((SELECT AVG(percentage) FROM graded_submissions), 0) AS average_mark,
       COALESCE((SELECT 100.0 * COUNT(*) FILTER (WHERE is_present)::numeric / NULLIF(COUNT(*), 0)
         FROM attendance_opportunities WHERE center_id = $1), 0) AS attendance_rate,
       (SELECT COUNT(*) FROM student_performance p
         JOIN student_attendance att ON att.student_id = p.student_id
         WHERE p.average_mark < 50 OR att.attendance_rate < 75)::int AS at_risk,
       COALESCE((SELECT 100.0 * COUNT(*) FILTER (WHERE percentage >= 50)::numeric
         / NULLIF(COUNT(*), 0) FROM graded_submissions), 0) AS pass_rate`,
    [centerId]
  );

  const row = rows[0] || {};
  return {
    totalStudents: Number(row.total_students || 0),
    totalTeachers: Number(row.total_teachers || 0),
    averageMark: toNumber(row.average_mark),
    attendance: toNumber(row.attendance_rate),
    atRisk: Number(row.at_risk || 0),
    passRate: toNumber(row.pass_rate),
  };
};

export const getStudentPerformance = async (managerId, filters = {}) => {
  const centerId = await getManagerCenterId(managerId);
  const { grade = null, subjectId = null, classId = null, term = null } = filters;
  const values = [centerId];
  const conditions = [];

  if (grade !== null && grade !== undefined && grade !== "") {
    values.push(grade);
    conditions.push(`l.grade = $${values.length}`);
  }
  if (subjectId !== null && subjectId !== undefined && subjectId !== "") {
    values.push(subjectId);
    conditions.push(`s.subject_id = $${values.length}`);
  }
  if (classId !== null && classId !== undefined && classId !== "") {
    values.push(classId);
    conditions.push(`c.class_id = $${values.length}`);
  }

  let assessmentTermFilter = "";
  if (term !== null && term !== undefined && term !== "") {
    values.push(term);
    assessmentTermFilter = `AND ${termFromDate("a.created_at")} = $${values.length}`;
  }

  const whereFilters = conditions.length ? `AND ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT l.grade, s.subject_id, s.subject_name, s.subject_code,
      c.class_id, c.class_name, l.user_id AS student_id, l.learner_number,
      u.first_name, u.last_name,
      COALESCE(AVG(100.0 * sub.score::numeric / NULLIF(sub.max_score, 0)), 0) AS average_mark,
      COUNT(DISTINCT sub.id)::int AS assessments_completed
     FROM learners l
     JOIN users u ON u.user_id = l.user_id
     JOIN learner_enrollments le ON le.learner_id = l.user_id
     JOIN classes c ON c.class_id = le.class_id
     JOIN subjects s ON s.subject_id = le.subject_id
     LEFT JOIN assessments a ON a.subject_id = s.subject_id AND a.class_id = c.class_id ${assessmentTermFilter}
     LEFT JOIN assessment_submissions sub ON sub.assessment_id = a.id
       AND sub.student_id = l.user_id AND sub.status = 'graded'
       AND sub.score IS NOT NULL AND sub.max_score > 0
     WHERE l.center_id = $1 AND u.is_active = TRUE ${whereFilters}
     GROUP BY l.grade, s.subject_id, s.subject_name, s.subject_code,
       c.class_id, c.class_name, l.user_id, l.learner_number, u.first_name, u.last_name
     ORDER BY l.grade, s.subject_name, c.class_name, average_mark DESC`,
    values
  );

  return rows.map((row) => ({
    grade: Number(row.grade),
    subjectId: Number(row.subject_id),
    subjectName: row.subject_name,
    subjectCode: row.subject_code,
    classId: Number(row.class_id),
    className: row.class_name,
    studentId: Number(row.student_id),
    learnerNumber: row.learner_number,
    firstName: row.first_name,
    lastName: row.last_name,
    averageMark: toNumber(row.average_mark),
    assessmentsCompleted: Number(row.assessments_completed || 0),
  }));
};

export const getOverallAttendance = async (managerId) => {
  const centerId = await getManagerCenterId(managerId);
  const { rows } = await pool.query(
    `WITH ${ATTENDANCE_OPPORTUNITIES}
     SELECT COUNT(*)::int AS total_records,
       COUNT(*) FILTER (WHERE is_present)::int AS attended_records,
       COALESCE(100.0 * COUNT(*) FILTER (WHERE is_present)::numeric / NULLIF(COUNT(*), 0), 0) AS attendance_rate
     FROM attendance_opportunities
     WHERE center_id = $1`,
    [centerId]
  );

  const row = rows[0] || {};
  return {
    totalRecords: Number(row.total_records || 0),
    attendedRecords: Number(row.attended_records || 0),
    attendance: toNumber(row.attendance_rate),
  };
};

export const getStudentAttendance = async (managerId, filters = {}) => {
  const centerId = await getManagerCenterId(managerId);
  const { grade = null, classId = null } = filters;
  const values = [centerId];
  const conditions = [];

  if (grade !== null && grade !== undefined && grade !== "") {
    values.push(grade);
    conditions.push(`l.grade = $${values.length}`);
  }
  if (classId !== null && classId !== undefined && classId !== "") {
    values.push(classId);
    conditions.push(`c.class_id = $${values.length}`);
  }

  const whereFilters = conditions.length ? `AND ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `WITH ${ATTENDANCE_OPPORTUNITIES},
     student_attendance AS (
       SELECT learner_id, COUNT(*)::int AS total_records,
         COUNT(*) FILTER (WHERE is_present)::int AS attended_records,
         COALESCE(100.0 * COUNT(*) FILTER (WHERE is_present)::numeric / NULLIF(COUNT(*), 0), 0) AS attendance_rate
       FROM attendance_opportunities
       WHERE center_id = $1
       GROUP BY learner_id
     )
     SELECT l.user_id AS student_id, l.learner_number, l.grade,
       c.class_id, c.class_name, u.first_name, u.last_name,
       COALESCE(sa.total_records, 0)::int AS total_records,
       COALESCE(sa.attended_records, 0)::int AS attended_records,
       COALESCE(sa.attendance_rate, 0) AS attendance_rate
     FROM learners l
     JOIN users u ON u.user_id = l.user_id
     JOIN classes c ON c.class_id = l.class_id
     LEFT JOIN student_attendance sa ON sa.learner_id = l.user_id
     WHERE l.center_id = $1 AND u.is_active = TRUE ${whereFilters}
     ORDER BY attendance_rate DESC, u.last_name, u.first_name`,
    values
  );

  return rows.map((row) => {
    const attendanceRate = toNumber(row.attendance_rate);
    let status = "Critical";
    if (attendanceRate >= 90) status = "Excellent";
    else if (attendanceRate >= 80) status = "Good";
    else if (attendanceRate >= 75) status = "Monitor";

    return {
      studentId: Number(row.student_id),
      learnerNumber: row.learner_number,
      firstName: row.first_name,
      lastName: row.last_name,
      grade: Number(row.grade),
      classId: Number(row.class_id),
      className: row.class_name,
      totalRecords: Number(row.total_records || 0),
      attendedRecords: Number(row.attended_records || 0),
      attendanceRate,
      status,
    };
  });
};

export const getAttendanceByClass = async (managerId) => {
  const centerId = await getManagerCenterId(managerId);
  const { rows } = await pool.query(
    `WITH ${ATTENDANCE_OPPORTUNITIES}
     SELECT c.class_id, c.class_name,
       COUNT(ao.attendance_id)::int AS total_records,
       COUNT(ao.attendance_id) FILTER (WHERE ao.is_present)::int AS attended_records,
       COALESCE(100.0 * COUNT(ao.attendance_id) FILTER (WHERE ao.is_present)::numeric
         / NULLIF(COUNT(ao.attendance_id), 0), 0) AS attendance_rate
     FROM classes c
     LEFT JOIN attendance_opportunities ao ON ao.class_id = c.class_id AND ao.center_id = $1
     WHERE c.center_id = $1 AND c.is_active = TRUE
     GROUP BY c.class_id, c.class_name
     ORDER BY attendance_rate DESC, c.class_name`,
    [centerId]
  );

  return rows.map((row) => ({
    classId: Number(row.class_id),
    className: row.class_name,
    totalRecords: Number(row.total_records || 0),
    attendedRecords: Number(row.attended_records || 0),
    attendanceRate: toNumber(row.attendance_rate),
  }));
};

export const getStudentsBelowAttendanceThreshold = async (managerId, threshold = 75) => {
  const students = await getStudentAttendance(managerId);
  return students.filter((student) => student.attendanceRate < threshold).map((student) => {
    let status = "Warning";
    if (student.attendanceRate < 50) status = "Critical";
    else if (student.attendanceRate < 65) status = "High Risk";
    return { ...student, status };
  });
};
