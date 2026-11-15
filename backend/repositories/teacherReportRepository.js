import { pool } from "../config/db.js";
import { termFromDate } from "../utils/termUtils.js";

const PRESENT_STATUSES = ["present", "late"];
const presentList = () => PRESENT_STATUSES.map((status) => `'${status.replace(/'/g, "''")}'`).join(",");
const percentage = (alias) => `(100.0 * ${alias}.score::numeric / NULLIF(${alias}.max_score, 0))`;

const getRows = async (query, params = []) => {
  const result = await pool.query(query, params);
  return result.rows;
};

const ATTENDANCE_OPPORTUNITIES = `attendance_opportunities AS (
  SELECT DISTINCT
    a.attendance_id,
    a.created_at AS attendance_date,
    ta.teacher_id,
    ta.subject_id,
    ta.class_id,
    le.learner_id,
    EXISTS (
      SELECT 1
      FROM attendance_record ar
      WHERE ar.attendance_id = a.attendance_id
        AND ar.learner_id = le.learner_id
        AND LOWER(ar.status) IN (${presentList()})
    ) AS is_present
  FROM attendance a
  JOIN teacher_assignments ta ON ta.assignment_id = a.assignment_id
  JOIN learner_enrollments le ON le.class_id = ta.class_id AND le.subject_id = ta.subject_id
  JOIN learners l ON l.user_id = le.learner_id
  JOIN users u ON u.user_id = l.user_id
  WHERE u.is_active = TRUE
    AND (LOWER(a.status) = 'closed' OR a.expires_at <= NOW())
)`;

export const getOverview = async (
  teacherId,
  { passMark = 50, atRiskMark = 60, atRiskAttendance = 75 } = {}
) => {
  const rows = await getRows(
    `WITH ${ATTENDANCE_OPPORTUNITIES},
    teacher_students AS (
      SELECT DISTINCT le.learner_id AS student_id
      FROM teacher_assignments ta
      JOIN learner_enrollments le ON le.class_id = ta.class_id AND le.subject_id = ta.subject_id
      JOIN learners l ON l.user_id = le.learner_id
      JOIN users u ON u.user_id = l.user_id
      WHERE ta.teacher_id = $1 AND u.is_active = TRUE
    ),
    student_marks AS (
      SELECT s.student_id, AVG(${percentage("s")}) AS average_mark
      FROM assessment_submissions s
      JOIN assessments a ON a.id = s.assessment_id
      WHERE a.teacher_id = $1 AND s.status = 'graded' AND s.score IS NOT NULL AND s.max_score > 0
      GROUP BY s.student_id
    ),
    attendance_stats AS (
      SELECT learner_id, COUNT(*) FILTER (WHERE is_present) AS present_count, COUNT(*) AS total_count
      FROM attendance_opportunities
      WHERE teacher_id = $1
      GROUP BY learner_id
    ),
    student_summary AS (
      SELECT ts.student_id,
        sm.average_mark IS NOT NULL AS has_marks,
        COALESCE(sm.average_mark, 0) AS average_mark,
        COALESCE(ast.total_count, 0) > 0 AS has_attendance,
        COALESCE(100.0 * ast.present_count::numeric / NULLIF(ast.total_count, 0), 0) AS attendance
      FROM teacher_students ts
      LEFT JOIN student_marks sm ON sm.student_id = ts.student_id
      LEFT JOIN attendance_stats ast ON ast.learner_id = ts.student_id
    )
    SELECT
      (SELECT COUNT(*) FROM teacher_students)::int AS "totalStudents",
      1 AS "totalTeachers",
      COALESCE((SELECT AVG(average_mark) FROM student_summary WHERE has_marks), 0) AS "averageMark",
      COALESCE((SELECT AVG(attendance) FROM student_summary WHERE has_attendance), 0) AS attendance,
      (SELECT COUNT(*) FROM student_summary WHERE average_mark < $2 OR attendance < $3)::int AS "atRisk",
      COALESCE(
        (SELECT 100.0 * COUNT(*) FILTER (WHERE has_marks AND average_mark >= $4)::numeric
          / NULLIF(COUNT(*) FILTER (WHERE has_marks), 0) FROM student_summary),
        0
      ) AS "passRate"`,
    [teacherId, atRiskMark, atRiskAttendance, passMark]
  );

  return rows[0] || {};
};

export const getSubjects = async (teacherId) => getRows(
  `SELECT DISTINCT s.subject_id AS "subjectId", s.subject_name AS "subjectName"
   FROM teacher_assignments ta
   JOIN subjects s ON s.subject_id = ta.subject_id
   WHERE ta.teacher_id = $1
   ORDER BY s.subject_name`,
  [teacherId]
);

export const getClasses = async (teacherId) => getRows(
  `SELECT DISTINCT c.class_id AS "classId", c.class_name AS "className", ta.grade
   FROM teacher_assignments ta
   JOIN classes c ON c.class_id = ta.class_id
   WHERE ta.teacher_id = $1
   ORDER BY ta.grade, c.class_name`,
  [teacherId]
);

export const verifyTeacherAssignment = async (teacherId, subjectId, classId) => {
  const rows = await getRows(
    `SELECT assignment_id FROM teacher_assignments
     WHERE teacher_id = $1 AND subject_id = $2 AND class_id = $3
     LIMIT 1`,
    [teacherId, subjectId, classId]
  );
  return rows.length > 0;
};

export const verifyTeacherClass = async (teacherId, classId) => {
  const rows = await getRows(
    `SELECT assignment_id FROM teacher_assignments
     WHERE teacher_id = $1 AND class_id = $2
     LIMIT 1`,
    [teacherId, classId]
  );
  return rows.length > 0;
};

export const getPerformanceTrend = async (teacherId, subjectId, classId, period = "term") => {
  const params = [teacherId, subjectId, classId];
  let dateCondition = "";

  if (period === "30days") {
    dateCondition = "AND s.submitted_at >= CURRENT_DATE - INTERVAL '30 days'";
  } else if (period === "year" || period === "academic-year") {
    dateCondition = "AND s.submitted_at >= CURRENT_DATE - INTERVAL '1 year'";
  } else {
    dateCondition = `AND ${termFromDate("a.created_at")} = ${termFromDate("CURRENT_DATE")}
      AND ${termFromDate("CURRENT_DATE")} IS NOT NULL
      AND EXTRACT(YEAR FROM a.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`;
  }

  return getRows(
    `SELECT TO_CHAR(DATE_TRUNC('week', s.submitted_at), 'DD Mon') AS label,
      AVG(${percentage("s")}) AS average
     FROM assessment_submissions s
     JOIN assessments a ON a.id = s.assessment_id
     WHERE a.teacher_id = $1 AND a.subject_id = $2 AND a.class_id = $3
       AND s.status = 'graded' AND s.submitted_at IS NOT NULL
       AND s.score IS NOT NULL AND s.max_score > 0
       ${dateCondition}
     GROUP BY DATE_TRUNC('week', s.submitted_at)
     ORDER BY DATE_TRUNC('week', s.submitted_at)`,
    params
  );
};

export const getSubjectPerformance = async (teacherId, { passMark = 50 } = {}) => getRows(
  `WITH ${ATTENDANCE_OPPORTUNITIES},
   teacher_subjects AS (
     SELECT DISTINCT subject_id FROM teacher_assignments WHERE teacher_id = $1
   ),
   student_marks AS (
     SELECT a.subject_id, s.student_id, AVG(${percentage("s")}) AS average_mark
     FROM assessment_submissions s
     JOIN assessments a ON a.id = s.assessment_id
     WHERE a.teacher_id = $1 AND s.status = 'graded' AND s.score IS NOT NULL AND s.max_score > 0
     GROUP BY a.subject_id, s.student_id
   ),
   performance AS (
     SELECT subject_id, COUNT(*)::int AS students, AVG(average_mark) AS average,
       100.0 * COUNT(*) FILTER (WHERE average_mark >= $2)::numeric / NULLIF(COUNT(*), 0) AS pass_rate
     FROM student_marks GROUP BY subject_id
   ),
   attendance_stats AS (
     SELECT subject_id,
       100.0 * COUNT(*) FILTER (WHERE is_present)::numeric / NULLIF(COUNT(*), 0) AS attendance
     FROM attendance_opportunities WHERE teacher_id = $1 GROUP BY subject_id
   )
   SELECT s.subject_id AS "subjectId", s.subject_name AS subject,
     COALESCE(p.students, 0)::int AS students, COALESCE(p.average, 0) AS average,
     COALESCE(p.pass_rate, 0) AS "passRate", COALESCE(ast.attendance, 0) AS attendance
   FROM teacher_subjects ts
   JOIN subjects s ON s.subject_id = ts.subject_id
   LEFT JOIN performance p ON p.subject_id = ts.subject_id
   LEFT JOIN attendance_stats ast ON ast.subject_id = ts.subject_id
   ORDER BY average DESC`,
  [teacherId, passMark]
);

export const getClassPerformance = async (teacherId, { passMark = 50 } = {}) => getRows(
  `WITH ${ATTENDANCE_OPPORTUNITIES},
   teacher_classes AS (
     SELECT DISTINCT class_id FROM teacher_assignments WHERE teacher_id = $1
   ),
   student_marks AS (
     SELECT a.class_id, s.student_id, AVG(${percentage("s")}) AS average_mark
     FROM assessment_submissions s
     JOIN assessments a ON a.id = s.assessment_id
     WHERE a.teacher_id = $1 AND s.status = 'graded' AND s.score IS NOT NULL AND s.max_score > 0
     GROUP BY a.class_id, s.student_id
   ),
   performance AS (
     SELECT class_id, COUNT(*)::int AS students, AVG(average_mark) AS average,
       100.0 * COUNT(*) FILTER (WHERE average_mark >= $2)::numeric / NULLIF(COUNT(*), 0) AS pass_rate
     FROM student_marks GROUP BY class_id
   ),
   attendance_stats AS (
     SELECT class_id,
       100.0 * COUNT(*) FILTER (WHERE is_present)::numeric / NULLIF(COUNT(*), 0) AS attendance
     FROM attendance_opportunities WHERE teacher_id = $1 GROUP BY class_id
   )
   SELECT c.class_id AS "classId", c.class_name AS "className",
     COALESCE(p.students, 0)::int AS students, COALESCE(p.average, 0) AS average,
     COALESCE(p.pass_rate, 0) AS "passRate", COALESCE(ast.attendance, 0) AS attendance
   FROM teacher_classes tc
   JOIN classes c ON c.class_id = tc.class_id
   LEFT JOIN performance p ON p.class_id = tc.class_id
   LEFT JOIN attendance_stats ast ON ast.class_id = tc.class_id
   ORDER BY average DESC`,
  [teacherId, passMark]
);

export const getAttendanceTrend = async (teacherId, classId) => getRows(
  `WITH ${ATTENDANCE_OPPORTUNITIES}
   SELECT TO_CHAR(DATE_TRUNC('week', attendance_date), 'DD Mon') AS label,
     COALESCE(100.0 * COUNT(*) FILTER (WHERE is_present)::numeric / NULLIF(COUNT(*), 0), 0) AS attendance
   FROM attendance_opportunities
   WHERE teacher_id = $1 AND class_id = $2
   GROUP BY DATE_TRUNC('week', attendance_date)
   ORDER BY DATE_TRUNC('week', attendance_date)`,
  [teacherId, classId]
);

export const getStudentRanking = async (
  teacherId,
  subjectId,
  classId,
  sortBy = "average",
  order = "desc"
) => {
  const sortColumn = sortBy === "attendance" ? "attendance" : "average";
  const sortDirection = order === "asc" ? "ASC" : "DESC";

  return getRows(
    `WITH ${ATTENDANCE_OPPORTUNITIES},
     marks AS (
       SELECT s.student_id, AVG(${percentage("s")}) AS average
       FROM assessment_submissions s
       JOIN assessments a ON a.id = s.assessment_id
       WHERE a.teacher_id = $1 AND a.subject_id = $2 AND a.class_id = $3
         AND s.status = 'graded' AND s.score IS NOT NULL AND s.max_score > 0
       GROUP BY s.student_id
     ),
     attendance_stats AS (
       SELECT learner_id,
         100.0 * COUNT(*) FILTER (WHERE is_present)::numeric / NULLIF(COUNT(*), 0) AS attendance
       FROM attendance_opportunities
       WHERE teacher_id = $1 AND subject_id = $2 AND class_id = $3
       GROUP BY learner_id
     )
     SELECT l.user_id AS "studentId", CONCAT(u.first_name, ' ', u.last_name) AS name,
       c.class_name AS "className", COALESCE(m.average, 0) AS average,
       COALESCE(ast.attendance, 0) AS attendance
     FROM learner_enrollments le
     JOIN learners l ON l.user_id = le.learner_id
     JOIN users u ON u.user_id = l.user_id
     JOIN classes c ON c.class_id = le.class_id
     LEFT JOIN marks m ON m.student_id = le.learner_id
     LEFT JOIN attendance_stats ast ON ast.learner_id = le.learner_id
     WHERE le.subject_id = $2 AND le.class_id = $3 AND u.is_active = TRUE
       AND EXISTS (
         SELECT 1 FROM teacher_assignments ta
         WHERE ta.teacher_id = $1 AND ta.subject_id = $2 AND ta.class_id = $3
       )
     ORDER BY ${sortColumn} ${sortDirection}, name ASC`,
    [teacherId, subjectId, classId]
  );
};

export const getInterventionStudents = async (
  teacherId,
  { atRiskMark = 60, atRiskAttendance = 75 } = {}
) => getRows(
  `WITH ${ATTENDANCE_OPPORTUNITIES},
   teacher_students AS (
     SELECT DISTINCT le.learner_id, le.class_id
     FROM teacher_assignments ta
     JOIN learner_enrollments le ON le.class_id = ta.class_id AND le.subject_id = ta.subject_id
     JOIN users u ON u.user_id = le.learner_id
     WHERE ta.teacher_id = $1 AND u.is_active = TRUE
   ),
   marks AS (
     SELECT s.student_id, AVG(${percentage("s")}) AS average
     FROM assessment_submissions s
     JOIN assessments a ON a.id = s.assessment_id
     WHERE a.teacher_id = $1 AND s.status = 'graded' AND s.score IS NOT NULL AND s.max_score > 0
     GROUP BY s.student_id
   ),
   attendance_stats AS (
     SELECT learner_id,
       100.0 * COUNT(*) FILTER (WHERE is_present)::numeric / NULLIF(COUNT(*), 0) AS attendance
     FROM attendance_opportunities WHERE teacher_id = $1 GROUP BY learner_id
   )
   SELECT l.user_id AS "studentId", CONCAT(u.first_name, ' ', u.last_name) AS name,
     c.class_name AS "className", COALESCE(m.average, 0) AS average,
     COALESCE(ast.attendance, 0) AS attendance
   FROM teacher_students ts
   JOIN learners l ON l.user_id = ts.learner_id
   JOIN users u ON u.user_id = l.user_id
   JOIN classes c ON c.class_id = ts.class_id
   LEFT JOIN marks m ON m.student_id = ts.learner_id
   LEFT JOIN attendance_stats ast ON ast.learner_id = ts.learner_id
   WHERE COALESCE(m.average, 0) < $2 OR COALESCE(ast.attendance, 0) < $3
   ORDER BY COALESCE(m.average, 0), COALESCE(ast.attendance, 0)`,
  [teacherId, atRiskMark, atRiskAttendance]
);
