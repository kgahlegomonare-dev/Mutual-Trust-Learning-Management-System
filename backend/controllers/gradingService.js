/**
 * Auto-grades every objective answer (multiple_choice / true_false) on a
 * submission against the question's correct option, and leaves subjective
 * answers (short_answer / essay) untouched (is_correct/points_awarded stay
 * NULL until a teacher grades them manually).
 */
export async function autoGradeObjectiveAnswers(client, submissionId) {
  await client.query(
    `UPDATE assessment_answers aa
     SET is_correct = COALESCE(o.is_correct, FALSE),
         points_awarded = CASE WHEN o.is_correct = TRUE THEN aq.points ELSE 0 END,
         updated_at = NOW()
     FROM assessment_questions aq
     LEFT JOIN assessment_question_options o 
            ON o.question_id = aq.id
     WHERE aa.submission_id = $1
       AND aq.id = aa.question_id
       AND o.id = aa.selected_option_id
       AND aq.question_type IN ('multiple_choice', 'true_false')`,
    [submissionId]
  );
}

/**
 * Recomputes a submission's status/score from its current answers:
 * - if every answer has a non-null points_awarded -> 'graded', score = sum, graded_at set
 * - otherwise -> 'submitted' (already turned in, awaiting manual grading), score stays NULL
 * Call this after auto-grading on submit, and again after every manual grade save.
 */
export async function recomputeSubmissionStatus(client, submissionId, graderId = null) {
  // 1. Fetch total assessment questions & total possible max points
  const { rows: stats } = await client.query(
    `SELECT 
        COUNT(aq.id) AS total_questions,
        COALESCE(SUM(aq.points), 0) AS max_score,
        COUNT(aa.id) FILTER (WHERE aa.points_awarded IS NOT NULL) AS graded_answers_count
     FROM assessment_submissions sub
     JOIN assessment_questions aq ON aq.assessment_id = sub.assessment_id
     LEFT JOIN assessment_answers aa ON aa.submission_id = sub.id AND aa.question_id = aq.id
     WHERE sub.id = $1
     GROUP BY sub.id`,
    [submissionId]
  );

  if (!stats[0]) throw new Error('Submission or related questions not found');

  const { total_questions, max_score, graded_answers_count } = stats[0];
  const allGraded = Number(total_questions) > 0 && Number(total_questions) === Number(graded_answers_count);

  if (allGraded) {
    const { rows: sumRow } = await client.query(
      `SELECT COALESCE(SUM(points_awarded), 0) AS total_score 
       FROM assessment_answers WHERE submission_id = $1`,
      [submissionId]
    );

    const { rows } = await client.query(
      `UPDATE assessment_submissions
          SET status = 'graded', 
              score = $1, 
              max_score = $2, 
              graded_at = NOW(),
              grader_id = COALESCE($3, grader_id), 
              updated_at = NOW()
        WHERE id = $4
        RETURNING *`,
      [sumRow[0].total_score, max_score, graderId, submissionId]
    );
    return rows[0];
  } else {
    const { rows } = await client.query(
      `UPDATE assessment_submissions
          SET status = 'submitted', 
              max_score = $1, 
              updated_at = NOW()
        WHERE id = $2
        RETURNING *`,
      [max_score, submissionId]
    );
    return rows[0];
  }
}