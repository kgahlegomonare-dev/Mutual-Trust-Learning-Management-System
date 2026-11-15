import { pool } from '../config/db.js';

export async function getAssessmentWithQuestions(assessmentId, isTeacher = false) {
  const { rows: aRows } = await pool.query(`SELECT * FROM assessments WHERE id = $1`, [assessmentId]);
  if (!aRows[0]) return null;
  const assessment = aRows[0];

  const { rows: questions } = await pool.query(
    `SELECT * FROM assessment_questions WHERE assessment_id = $1 ORDER BY order_index ASC, id ASC`,
    [assessmentId]
  );

  // If student, omit `is_correct` from the SQL query to prevent answer leaks
  const optionSelect = isTeacher 
    ? `o.*` 
    : `o.id, o.question_id, o.option_text, o.order_index, o.created_at, o.updated_at`;

  const { rows: options } = await pool.query(
    `SELECT ${optionSelect} FROM assessment_question_options o
       JOIN assessment_questions q ON q.id = o.question_id
      WHERE q.assessment_id = $1
      ORDER BY o.order_index ASC, o.id ASC`,
    [assessmentId]
  );

  const optionsByQuestion = {};
  for (const o of options) {
    (optionsByQuestion[o.question_id] ||= []).push(o);
  }

  assessment.questions = questions.map((q) => ({
    ...q,
    options: optionsByQuestion[q.id] || []
  }));

  return assessment;
}

export async function getSubmissionWithAnswers(submissionId) {
  const { rows: sRows } = await pool.query(`SELECT * FROM assessment_submissions WHERE id = $1`, [submissionId]);
  if (!sRows[0]) return null;
  const submission = sRows[0];

  // Join question details so the caller gets question context alongside student answers
  const { rows: answers } = await pool.query(
    `SELECT aa.*, 
            aq.question_text, 
            aq.question_type, 
            aq.points AS max_points
       FROM assessment_answers aa
       JOIN assessment_questions aq ON aq.id = aa.question_id
      WHERE aa.submission_id = $1`,
    [submissionId]
  );

  submission.answers = answers;
  return submission;
}
