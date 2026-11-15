import { pool } from "../config/db.js";
import { termFromDate } from "../utils/termUtils.js";

const getRows = async (query, params = []) => (await pool.query(query, params)).rows;
const getOne = async (query, params = []) => (await pool.query(query, params)).rows[0] || null;

const LEARNER_ATTENDANCE = `learner_attendance AS (
  SELECT DISTINCT
    a.attendance_id,
    a.created_at AS attendance_date,
    EXISTS (
      SELECT 1 FROM attendance_record ar
      WHERE ar.attendance_id = a.attendance_id
        AND ar.learner_id = le.learner_id
        AND LOWER(ar.status) = 'present'
    ) AS is_present,
    EXISTS (
      SELECT 1 FROM attendance_record ar
      WHERE ar.attendance_id = a.attendance_id
        AND ar.learner_id = le.learner_id
        AND LOWER(ar.status) = 'late'
    ) AS is_late
  FROM attendance a
  JOIN teacher_assignments ta ON ta.assignment_id = a.assignment_id
  JOIN learner_enrollments le ON le.class_id = ta.class_id AND le.subject_id = ta.subject_id
  WHERE le.learner_id = $1
    AND (LOWER(a.status) = 'closed' OR a.expires_at <= NOW())
)`;

async function getLearnerById(learnerId) {
  return getOne(
    `SELECT l.user_id, l.learner_number, l.center_id, l.class_id, l.grade, l.highschool,
      u.first_name, u.last_name, u.email, c.center_name, c.center_province, cl.class_name
     FROM learners l
     JOIN users u ON u.user_id = l.user_id
     LEFT JOIN centers c ON c.center_id = l.center_id
     LEFT JOIN classes cl ON cl.class_id = l.class_id
     WHERE l.user_id = $1
     LIMIT 1`,
    [learnerId]
  );
}

async function getAcademicOverview(learnerId) {
  return getOne(
    `SELECT
      COUNT(*) FILTER (WHERE s.status IN ('submitted', 'graded'))::int AS assessments_completed,
      COUNT(*) FILTER (WHERE s.status = 'graded')::int AS graded_assessments,
      COUNT(*) FILTER (WHERE s.status = 'graded' AND s.max_score > 0)::int AS scored_assessments,
      COALESCE(AVG(CASE WHEN s.status = 'graded' AND s.max_score > 0
        THEN 100.0 * s.score::numeric / NULLIF(s.max_score, 0) END), 0) AS overall_average,
      COUNT(*) FILTER (WHERE s.status = 'graded' AND s.max_score > 0
        AND 100.0 * s.score::numeric / NULLIF(s.max_score, 0) >= 50)::int AS passed_assessments
     FROM assessment_submissions s
     WHERE s.student_id = $1`,
    [learnerId]
  );
}

async function getSubjectPerformance(learnerId) {
  return getRows(
    `WITH subject_scores AS (
      SELECT sub.subject_id, sub.subject_name, s.id AS submission_id,
        100.0 * s.score::numeric / NULLIF(s.max_score, 0) AS percentage,
        s.submitted_at
      FROM assessment_submissions s
      JOIN assessments a ON a.id = s.assessment_id
      JOIN subjects sub ON sub.subject_id = a.subject_id
      WHERE s.student_id = $1 AND s.status = 'graded' AND s.score IS NOT NULL AND s.max_score > 0
    ),
    subject_statistics AS (
      SELECT subject_id, subject_name, AVG(percentage) AS average,
        MAX(percentage) AS highest, MIN(percentage) AS lowest,
        COUNT(*)::int AS assessment_count,
        COUNT(*) FILTER (WHERE percentage >= 50)::int AS passed_count
      FROM subject_scores
      GROUP BY subject_id, subject_name
    ),
    subject_trends AS (
      SELECT DISTINCT subject_id,
        FIRST_VALUE(percentage) OVER (
          PARTITION BY subject_id ORDER BY submitted_at DESC NULLS LAST, submission_id DESC
        ) - FIRST_VALUE(percentage) OVER (
          PARTITION BY subject_id ORDER BY submitted_at ASC NULLS LAST, submission_id ASC
        ) AS trend
      FROM subject_scores
    )
    SELECT ss.subject_id, ss.subject_name AS subject,
      ROUND(ss.average::numeric, 2) AS average,
      ROUND(ss.highest::numeric, 2) AS highest,
      ROUND(ss.lowest::numeric, 2) AS lowest,
      ROUND(100.0 * ss.passed_count::numeric / NULLIF(ss.assessment_count, 0), 2) AS pass_rate,
      ROUND(COALESCE(st.trend, 0)::numeric, 2) AS trend,
      ss.assessment_count
    FROM subject_statistics ss
    LEFT JOIN subject_trends st ON st.subject_id = ss.subject_id
    ORDER BY ss.subject_name`,
    [learnerId]
  );
}

async function getPerformanceTrend(learnerId, subjectName, startDate) {
  const params = [learnerId];
  let subjectFilter = "";
  let dateFilter = "";

  if (subjectName) {
    params.push(subjectName);
    subjectFilter = `AND sub.subject_name = $${params.length}`;
  }

  if (startDate && startDate !== "term") {
    params.push(startDate);
    dateFilter = `AND s.submitted_at >= $${params.length}`;
  } else {
    dateFilter = `AND ${termFromDate("a.created_at")} = ${termFromDate("CURRENT_DATE")}
      AND ${termFromDate("CURRENT_DATE")} IS NOT NULL
      AND EXTRACT(YEAR FROM a.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`;
  }

  return getRows(
    `SELECT s.id AS submission_id, a.id AS assessment_id, a.title AS assessment,
      a.subject_id, sub.subject_name AS subject, s.submitted_at,
      ${termFromDate("a.created_at")}::int AS term,
      ROUND(100.0 * s.score::numeric / NULLIF(s.max_score, 0), 2) AS percentage
     FROM assessment_submissions s
     JOIN assessments a ON a.id = s.assessment_id
     JOIN subjects sub ON sub.subject_id = a.subject_id
     WHERE s.student_id = $1 AND s.status = 'graded' AND s.score IS NOT NULL AND s.max_score > 0
       ${subjectFilter}
       ${dateFilter}
     ORDER BY s.submitted_at, s.id`,
    params
  );
}

async function getAssessmentResults(learnerId) {
  return getRows(
    `SELECT s.id, a.id AS assessment_id, a.title AS assessment, a.type,
      sub.subject_name AS subject, s.score AS mark, s.max_score AS total,
      CASE WHEN s.max_score > 0
        THEN ROUND(100.0 * s.score::numeric / NULLIF(s.max_score, 0), 2)
        ELSE 0 END AS percentage,
      COALESCE(s.submitted_at, s.graded_at, s.created_at) AS date,
      ${termFromDate("a.created_at")}::int AS term,
      s.status
     FROM assessment_submissions s
     JOIN assessments a ON a.id = s.assessment_id
     JOIN subjects sub ON sub.subject_id = a.subject_id
     WHERE s.student_id = $1
     ORDER BY COALESCE(s.submitted_at, s.graded_at, s.created_at) DESC`,
    [learnerId]
  );
}

async function getAttendanceSummary(learnerId) {
  return getOne(
    `WITH ${LEARNER_ATTENDANCE}
     SELECT COUNT(*)::int AS total_classes,
       COUNT(*) FILTER (WHERE is_present)::int AS present,
       COUNT(*) FILTER (WHERE NOT is_present AND NOT is_late)::int AS absent,
       COUNT(*) FILTER (WHERE is_late)::int AS late
     FROM learner_attendance`,
    [learnerId]
  );
}

async function getAttendanceTrend(learnerId) {
  return getRows(
    `WITH ${LEARNER_ATTENDANCE}
     SELECT DATE_TRUNC('week', attendance_date) AS week_start,
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE is_present)::int AS present,
       COUNT(*) FILTER (WHERE is_late)::int AS late,
       COUNT(*) FILTER (WHERE NOT is_present AND NOT is_late)::int AS absent
     FROM learner_attendance
     GROUP BY DATE_TRUNC('week', attendance_date)
     ORDER BY week_start`,
    [learnerId]
  );
}

async function getUpcomingAssessments(learnerId) {
  return getRows(
    `SELECT DISTINCT a.id, a.title, a.type, a.available_from, a.available_until,
      sub.subject_name AS subject, ${termFromDate("a.created_at")}::int AS term
     FROM assessments a
     JOIN subjects sub ON sub.subject_id = a.subject_id
     JOIN learner_enrollments le ON le.subject_id = a.subject_id
       AND le.class_id = a.class_id AND le.learner_id = $1
     WHERE a.status = 'published' AND a.available_from IS NOT NULL
       AND a.available_from > CURRENT_TIMESTAMP
     ORDER BY a.available_from`,
    [learnerId]
  );
}

async function getOutstandingAssessments(learnerId) {
  return getOne(
    `SELECT COUNT(*)::int AS outstanding
     FROM assessments a
     JOIN learner_enrollments le ON le.subject_id = a.subject_id
       AND le.class_id = a.class_id AND le.learner_id = $1
     WHERE a.status = 'published'
       AND (a.available_from IS NULL OR a.available_from <= CURRENT_TIMESTAMP)
       AND (a.available_until IS NULL OR a.available_until >= CURRENT_TIMESTAMP)
       AND NOT EXISTS (
         SELECT 1 FROM assessment_submissions s
         WHERE s.assessment_id = a.id AND s.student_id = $1
           AND s.status IN ('submitted', 'graded')
       )`,
    [learnerId]
  );
}

export default {
  getLearnerById,
  getAcademicOverview,
  getSubjectPerformance,
  getPerformanceTrend,
  getAssessmentResults,
  getAttendanceSummary,
  getAttendanceTrend,
  getUpcomingAssessments,
  getOutstandingAssessments,
};
