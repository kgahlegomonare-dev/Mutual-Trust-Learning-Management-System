import { pool } from "../config/db.js";
import {
  assessmentTerm,
  getCurrentTerm,
  termFromDate,
} from "../utils/termUtils.js";

const ASSESSMENT_PK = "id";

const GRADED_STATUS = "graded";
const REQUIRE_GRADED_STATUS = false;

const gradedCheck = (alias) =>
  REQUIRE_GRADED_STATUS
    ? ` AND ${alias ? `${alias}.` : ""}status='${GRADED_STATUS}'`
    : "";

const PRESENT_STATUSES = ["present", "late"];

const presentList = () =>
  PRESENT_STATUSES
    .map((status) => `'${status.replace(/'/g, "''")}'`)
    .join(",");

const ATTENDANCE_OPPORTUNITIES = `attendance_opportunities AS (
  SELECT DISTINCT
    a.attendance_id,
    a.created_at AS attendance_date,
    le.learner_id,
    l.center_id,
    EXISTS (
      SELECT 1
      FROM attendance_record ar
      WHERE ar.attendance_id = a.attendance_id
        AND ar.learner_id = le.learner_id
        AND LOWER(ar.status) IN (${presentList()})
    ) AS is_present
  FROM attendance a
  JOIN teacher_assignments ta
    ON ta.assignment_id = a.assignment_id
  JOIN learner_enrollments le
    ON le.class_id = ta.class_id
    AND le.subject_id = ta.subject_id
  JOIN learners l
    ON l.user_id = le.learner_id
  JOIN users u
    ON u.user_id = l.user_id
  WHERE u.is_active = TRUE
    AND (
      LOWER(a.status) = 'closed'
      OR a.expires_at <= NOW()
    )
)`;

const PCT = (alias) =>
  `(100.0 * ${alias}.score::numeric / NULLIF(${alias}.max_score, 0))`;

const KEEP_AS_TEXT = new Set([
  "idNumber",
  "contactNumber",
  "email",
  "name",
  "surname",
]);

const NUMERIC_TEXT = /^-?\d+(\.\d+)?$/;

const numify = (row) => {
  if (!row || typeof row !== "object") {
    return row;
  }

  const output = {};

  for (const [key, value] of Object.entries(row)) {
    output[key] =
      typeof value === "string" &&
      !KEEP_AS_TEXT.has(key) &&
      NUMERIC_TEXT.test(value)
        ? Number(value)
        : value;
  }

  return output;
};

const rows = (result) => result.rows.map(numify);

const firstRow = (result) =>
  numify(result.rows[0]) ?? {};

const addFilters = (
  filters,
  values,
  aliases = {
    a: "a",
    l: "l",
    s: "sub",
  }
) => {
  const conditions = [];

  if (filters.term) {
    values.push(filters.term);

    conditions.push(
      `${assessmentTerm(aliases.a)} = $${values.length}`
    );
  }

  if (filters.grade) {
    values.push(filters.grade);

    conditions.push(
      `${aliases.l}.grade = $${values.length}`
    );
  }

  if (filters.subjectId) {
    values.push(filters.subjectId);

    conditions.push(
      `${aliases.a}.subject_id = $${values.length}`
    );
  }

  if (filters.centerId) {
    values.push(filters.centerId);

    conditions.push(
      `${aliases.l}.center_id = $${values.length}`
    );
  }

  return conditions.length
    ? ` AND ${conditions.join(" AND ")}`
    : "";
};

export async function getOverview() {
  const query = `
    WITH ${ATTENDANCE_OPPORTUNITIES},
    perf AS (
      SELECT
        s.student_id,
        AVG(${PCT("s")}) AS avg_pct
      FROM assessment_submissions s
      JOIN assessments a
        ON a.${ASSESSMENT_PK} = s.assessment_id
      JOIN learners l
        ON l.user_id = s.student_id
      JOIN users u
        ON u.user_id = l.user_id
      WHERE s.score IS NOT NULL
        AND s.max_score > 0
        AND u.is_active = TRUE
        ${gradedCheck("s")}
      GROUP BY s.student_id
    ),
    ps AS (
      SELECT
        AVG(avg_pct) AS avg,
        COUNT(*) FILTER (WHERE avg_pct >= 50) AS pass,
        COUNT(*) AS assessed
      FROM perf
    ),
    att AS (
      SELECT
        100.0 * COUNT(*) FILTER (WHERE is_present)
        / NULLIF(COUNT(*), 0) AS rate
      FROM attendance_opportunities
    ),
    completed AS (
      SELECT COUNT(*) AS n
      FROM assessment_submissions
      WHERE score IS NOT NULL
      ${gradedCheck("")}
    )
    SELECT
      (
        SELECT COUNT(*)
        FROM learners l
        JOIN users u
          ON u.user_id = l.user_id
        WHERE u.is_active = TRUE
      )::int AS "totalActiveLearners",

      (
        SELECT COUNT(*)
        FROM centers
        WHERE is_active = TRUE
      )::int AS "totalCenters",

      (
        SELECT COUNT(*)
        FROM teachers t
        JOIN users u
          ON u.user_id = t.user_id
        WHERE u.is_active = TRUE
      )::int AS "totalTeachers",

      ROUND(COALESCE(ps.avg, 0), 2) AS "overallAverage",
      ROUND(COALESCE(att.rate, 0), 2) AS "overallAttendance",

      ROUND(
        COALESCE(
          100.0 * ps.pass / NULLIF(ps.assessed, 0),
          0
        ),
        2
      ) AS "passRate",

      ROUND(
        100 - COALESCE(
          100.0 * ps.pass / NULLIF(ps.assessed, 0),
          0
        ),
        2
      ) AS "failureRate",

      completed.n::int AS "assessmentsCompleted",
      ps.assessed::int AS "learnersAssessed"
    FROM ps, att, completed
  `;

  const result = await pool.query(query);

  return firstRow(result);
}

export async function getOrganisationPerformanceTrend(
  filters = {}
) {
  const values = [];

  const filterQuery = addFilters(
    filters,
    values,
    {
      a: "a",
      l: "l",
      s: "s",
    }
  );

  const term = assessmentTerm("a");

  const query = `
    SELECT
      ${term}::int AS term,
      ROUND(
        AVG(${PCT("s")}),
        2
      ) AS "averagePercentage"
    FROM assessment_submissions s
    JOIN assessments a
      ON a.${ASSESSMENT_PK} = s.assessment_id
    JOIN learners l
      ON l.user_id = s.student_id
    JOIN users u
      ON u.user_id = l.user_id
    WHERE s.score IS NOT NULL
      AND s.max_score > 0
      AND u.is_active = TRUE
      AND ${term} IS NOT NULL
      ${gradedCheck("s")}
      ${filterQuery}
    GROUP BY 1
    ORDER BY 1
  `;

  const result = await pool.query(
    query,
    values
  );

  return rows(result).map((record) => ({
    ...record,
    termLabel: `Term ${record.term}`,
  }));
}

export async function getCenterPerformance(
  filters = {}
) {
  const values = [];

  const filterQuery = addFilters(
    filters,
    values,
    {
      a: "a",
      l: "l",
      s: "sub",
    }
  );

  const query = `
    SELECT
      c.center_id AS "centerId",
      c.center_name AS "centerName",

      ROUND(
        AVG(${PCT("sub")}),
        2
      ) AS "averagePercentage",

      COUNT(
        DISTINCT sub.student_id
      )::int AS "learnersAssessed"

    FROM centers c
    JOIN learners l
      ON l.center_id = c.center_id
    JOIN users u
      ON u.user_id = l.user_id
    JOIN assessment_submissions sub
      ON sub.student_id = l.user_id
    JOIN assessments a
      ON a.${ASSESSMENT_PK} = sub.assessment_id

    WHERE c.is_active = TRUE
      AND u.is_active = TRUE
      ${gradedCheck("sub")}
      AND sub.score IS NOT NULL
      AND sub.max_score > 0
      ${filterQuery}

    GROUP BY
      c.center_id,
      c.center_name

    ORDER BY
      "averagePercentage" DESC NULLS LAST
  `;

  const result = await pool.query(
    query,
    values
  );

  return rows(result);
}

export async function getCenterHealth() {
  const query = `
    WITH ${ATTENDANCE_OPPORTUNITIES},
    perf AS (
      SELECT
        l.center_id,
        s.student_id,
        AVG(${PCT("s")}) AS avg
      FROM assessment_submissions s
      JOIN learners l
        ON l.user_id = s.student_id
      WHERE s.score IS NOT NULL
        AND s.max_score > 0
        ${gradedCheck("s")}
      GROUP BY
        l.center_id,
        s.student_id
    ),
    p AS (
      SELECT
        center_id,
        AVG(avg) AS avg,

        100.0
        * COUNT(*) FILTER (WHERE avg >= 50)
        / NULLIF(COUNT(*), 0) AS pass,

        COUNT(*) FILTER (
          WHERE avg < 50
        ) AS risk

      FROM perf
      GROUP BY center_id
    ),
    att AS (
      SELECT
        center_id,

        100.0
        * COUNT(*) FILTER (WHERE is_present)
        / NULLIF(COUNT(*), 0) AS rate

      FROM attendance_opportunities
      GROUP BY center_id
    )
    SELECT
      c.center_id AS "centerId",
      c.center_name AS "centerName",

      COUNT(
        DISTINCT l.user_id
      ) FILTER (
        WHERE lu.is_active = TRUE
      )::int AS learners,

      COUNT(
        DISTINCT t.user_id
      ) FILTER (
        WHERE tu.is_active = TRUE
      )::int AS teachers,

      ROUND(
        COALESCE(p.avg, 0),
        2
      ) AS average,

      ROUND(
        COALESCE(att.rate, 0),
        2
      ) AS attendance,

      ROUND(
        COALESCE(p.pass, 0),
        2
      ) AS "passRate",

      COALESCE(
        p.risk,
        0
      )::int AS "atRisk",

      ROUND(
        100.0
        * COUNT(
          DISTINCT l.user_id
        ) FILTER (
          WHERE lu.is_active = FALSE
        )
        / NULLIF(
          COUNT(DISTINCT l.user_id),
          0
        ),
        2
      ) AS dropout

    FROM centers c
    LEFT JOIN learners l
      ON l.center_id = c.center_id
    LEFT JOIN users lu
      ON lu.user_id = l.user_id
    LEFT JOIN teachers t
      ON t.center_id = c.center_id
    LEFT JOIN users tu
      ON tu.user_id = t.user_id
    LEFT JOIN p
      ON p.center_id = c.center_id
    LEFT JOIN att
      ON att.center_id = c.center_id

    WHERE c.is_active = TRUE

    GROUP BY
      c.center_id,
      c.center_name,
      p.avg,
      p.pass,
      p.risk,
      att.rate

    ORDER BY c.center_name
  `;

  const result = await pool.query(query);

  return rows(result);
}

export async function getCenterDrilldown(
  centerId
) {
  const query = `
    SELECT
      l.grade,
      subj.subject_id AS "subjectId",
      subj.subject_code AS "subjectName",
      cl.class_id AS "classId",
      cl.class_name AS "className",

      COUNT(
        DISTINCT l.user_id
      ) FILTER (
        WHERE u.is_active = TRUE
      )::int AS learners,

      ROUND(
        AVG(${PCT("s")}),
        2
      ) AS average,

      ROUND(
        100.0
        * COUNT(
          DISTINCT s.student_id
        ) FILTER (
          WHERE ${PCT("s")} >= 50
        )
        / NULLIF(
          COUNT(DISTINCT s.student_id),
          0
        ),
        2
      ) AS "passRate"

    FROM learners l
    JOIN users u
      ON u.user_id = l.user_id
    JOIN classes cl
      ON cl.class_id = l.class_id
    JOIN learner_enrollments le
      ON le.learner_id = l.user_id
    JOIN subjects subj
      ON subj.subject_id = le.subject_id

    LEFT JOIN assessments a
      ON a.class_id = cl.class_id
      AND a.subject_id = subj.subject_id

    LEFT JOIN assessment_submissions s
      ON s.assessment_id = a.${ASSESSMENT_PK}
      AND s.student_id = l.user_id
      ${gradedCheck("s")}
      AND s.max_score > 0

    WHERE l.center_id = $1

    GROUP BY
      l.grade,
      subj.subject_id,
      subj.subject_code,
      cl.class_id,
      cl.class_name

    ORDER BY
      l.grade,
      subj.subject_code,
      cl.class_name
  `;

  const result = await pool.query(
    query,
    [centerId]
  );

  return rows(result);
}

export async function getAttendanceTrend() {
  const query = `
    WITH ${ATTENDANCE_OPPORTUNITIES}
    SELECT
      TO_CHAR(
        DATE_TRUNC(
          'month',
          attendance_date
        ),
        'Mon YYYY'
      ) AS month,

      DATE_TRUNC(
        'month',
        attendance_date
      ) AS d,

      ROUND(
        100.0
        * COUNT(*) FILTER (
          WHERE is_present
        )
        / NULLIF(COUNT(*), 0),
        2
      ) AS attendance

    FROM attendance_opportunities

    GROUP BY 1, 2
    ORDER BY d
  `;

  const result = await pool.query(query);

  return rows(result);
}

export async function getAttendanceByCenter() {
  const query = `
    WITH ${ATTENDANCE_OPPORTUNITIES}
    SELECT
      c.center_id AS "centerId",
      c.center_name AS "centerName",

      ROUND(
        100.0
        * COUNT(
          ao.learner_id
        ) FILTER (
          WHERE ao.is_present
        )
        / NULLIF(
          COUNT(ao.learner_id),
          0
        ),
        2
      ) AS attendance,

      COUNT(
        ao.learner_id
      ) FILTER (
        WHERE ao.is_present
      )::int AS "recordCount"

    FROM centers c
    LEFT JOIN attendance_opportunities ao
      ON ao.center_id = c.center_id

    WHERE c.is_active = TRUE

    GROUP BY
      c.center_id,
      c.center_name

    ORDER BY c.center_name
  `;

  const result = await pool.query(query);

  return rows(result);
}

export async function getLowAttendanceDistribution(
  threshold = 75
) {
  const query = `
    WITH ${ATTENDANCE_OPPORTUNITIES},
    x AS (
      SELECT
        l.user_id,
        l.center_id,

        100.0
        * COUNT(
          ao.attendance_id
        ) FILTER (
          WHERE ao.is_present
        )
        / NULLIF(
          COUNT(ao.attendance_id),
          0
        ) AS rate

      FROM learners l
      JOIN users u
        ON u.user_id = l.user_id
      LEFT JOIN attendance_opportunities ao
        ON ao.learner_id = l.user_id

      WHERE u.is_active = TRUE

      GROUP BY
        l.user_id,
        l.center_id
    ),
    y AS (
      SELECT
        c.center_id,
        c.center_name,

        COUNT(
          x.user_id
        ) FILTER (
          WHERE x.rate < $1
        )::int AS n

      FROM centers c
      LEFT JOIN x
        ON x.center_id = c.center_id

      WHERE c.is_active = TRUE

      GROUP BY
        c.center_id,
        c.center_name
    )
    SELECT
      center_id AS "centerId",
      center_name AS "centerName",
      n AS "learnerCount",
      SUM(n) OVER()::int AS total
    FROM y
    ORDER BY
      n DESC,
      center_name
  `;

  const result = await pool.query(
    query,
    [threshold]
  );

  return rows(result);
}

export async function getSubjectPerformance(
  filters = {}
) {
  const values = [];

  const filterQuery = addFilters(
    filters,
    values,
    {
      a: "a",
      l: "l",
      s: "s",
    }
  );

  const query = `
    SELECT
      subj.subject_id AS "subjectId",
      subj.subject_code AS "subjectName",

      ROUND(
        AVG(${PCT("s")}),
        2
      ) AS "organisationAverage",

      ROUND(
        100.0
        * COUNT(*) FILTER (
          WHERE ${PCT("s")} >= 50
        )
        / NULLIF(COUNT(*), 0),
        2
      ) AS "passRate",

      COUNT(
        DISTINCT s.student_id
      )::int AS learners

    FROM assessment_submissions s
    JOIN assessments a
      ON a.${ASSESSMENT_PK} = s.assessment_id
    JOIN subjects subj
      ON subj.subject_id = a.subject_id
    JOIN learners l
      ON l.user_id = s.student_id
    JOIN users u
      ON u.user_id = l.user_id

    WHERE s.score IS NOT NULL
      AND s.max_score > 0
      AND u.is_active = TRUE
      ${gradedCheck("s")}
      ${filterQuery}

    GROUP BY
      subj.subject_id,
      subj.subject_code

    ORDER BY
      "organisationAverage" DESC NULLS LAST
  `;

  const result = await pool.query(
    query,
    values
  );

  return rows(result);
}

export async function getCapacityAnalytics() {
  const query = `
    SELECT
      c.center_id AS "centerId",
      c.center_name AS "centerName",

      COUNT(
        DISTINCT l.user_id
      ) FILTER (
        WHERE lu.is_active = TRUE
      )::int AS learners,

      COUNT(
        DISTINCT t.user_id
      ) FILTER (
        WHERE tu.is_active = TRUE
      )::int AS teachers,

      ROUND(
        COUNT(
          DISTINCT l.user_id
        ) FILTER (
          WHERE lu.is_active = TRUE
        )::numeric
        / NULLIF(
          COUNT(
            DISTINCT t.user_id
          ) FILTER (
            WHERE tu.is_active = TRUE
          ),
          0
        ),
        1
      ) AS "learnersPerTeacher"

    FROM centers c
    LEFT JOIN learners l
      ON l.center_id = c.center_id
    LEFT JOIN users lu
      ON lu.user_id = l.user_id
    LEFT JOIN teachers t
      ON t.center_id = c.center_id
    LEFT JOIN users tu
      ON tu.user_id = t.user_id

    WHERE c.is_active = TRUE

    GROUP BY
      c.center_id,
      c.center_name

    ORDER BY
      "learnersPerTeacher" DESC NULLS LAST
  `;

  const result = await pool.query(query);
  const centers = rows(result);

  const totalLearners = centers.reduce(
    (total, center) =>
      total + Number(center.learners || 0),
    0
  );

  const totalTeachers = centers.reduce(
    (total, center) =>
      total + Number(center.teachers || 0),
    0
  );

  return {
    organisationRatio: totalTeachers
      ? Number(
          (
            totalLearners / totalTeachers
          ).toFixed(1)
        )
      : 0,
    totalLearners,
    totalTeachers,
    centers,
  };
}

export async function getTopStudents(
  filters = {}
) {
  const values = [];

  const filterQuery = addFilters(
    filters,
    values,
    {
      a: "a",
      l: "l",
      s: "s",
    }
  );

  values.push(
    Math.min(
      Math.max(
        Number(filters.limit) || 20,
        1
      ),
      1000
    )
  );

  const limitParameter = `$${values.length}`;

  const query = `
    SELECT
      u.first_name AS name,
      u.last_name AS surname,
      l.id_number AS "idNumber",
      l.contact_number AS "contactNumber",
      u.email,
      c.center_name AS "centerName",
      l.grade,

      ROUND(
        AVG(${PCT("s")}),
        2
      ) AS "averagePercentage"

    FROM assessment_submissions s
    JOIN assessments a
      ON a.${ASSESSMENT_PK} = s.assessment_id
    JOIN learners l
      ON l.user_id = s.student_id
    JOIN users u
      ON u.user_id = l.user_id
    JOIN centers c
      ON c.center_id = l.center_id

    WHERE s.score IS NOT NULL
      AND s.max_score > 0
      AND u.is_active = TRUE
      ${gradedCheck("s")}
      ${filterQuery}

    GROUP BY
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      l.user_id,
      l.id_number,
      l.contact_number,
      l.grade,
      c.center_name

    ORDER BY
      "averagePercentage" DESC

    LIMIT ${limitParameter}
  `;

  const result = await pool.query(
    query,
    values
  );

  return rows(result);
}

export async function getSubjectSatisfaction(
  filters = {}
) {
  const values = [];

  const conditions = [
    "fa.rating_value IS NOT NULL",
  ];

  if (filters.term) {
    values.push(filters.term);

    conditions.push(
      `${termFromDate("ff.created_at")} = $${values.length}`
    );
  }

  if (filters.grade) {
    values.push(filters.grade);

    conditions.push(
      `s.grade = $${values.length}`
    );
  }

  if (filters.centerId) {
    values.push(filters.centerId);

    conditions.push(
      `fr.about_center_id = $${values.length}`
    );
  }

  if (filters.subjectId) {
    values.push(filters.subjectId);

    conditions.push(
      `fr.about_subject_id = $${values.length}`
    );
  }

  const query = `
    SELECT
      COUNT(*) FILTER (
        WHERE fa.rating_value >= 4
      )::int AS satisfied,

      COUNT(*) FILTER (
        WHERE fa.rating_value <= 3
      )::int AS "notSatisfied",

      COUNT(*)::int AS "totalResponses",

      ROUND(
        100.0
        * COUNT(*) FILTER (
          WHERE fa.rating_value >= 4
        )
        / NULLIF(COUNT(*), 0),
        2
      ) AS "satisfactionRate"

    FROM feedback_answers fa
    JOIN feedback_responses fr
      ON fr.response_id = fa.response_id
    JOIN feedback_forms ff
      ON ff.form_id = fr.form_id
    JOIN subjects s
      ON s.subject_id = fr.about_subject_id

    WHERE ${conditions.join(" AND ")}
  `;

  const result = await pool.query(
    query,
    values
  );

  return firstRow(result);
}

export async function getReportFilters() {
  const term = assessmentTerm("a");

  const [
    centers,
    subjects,
    grades,
    terms,
  ] = await Promise.all([
    pool.query(`
      SELECT
        center_id AS "centerId",
        center_name AS "centerName"
      FROM centers
      WHERE is_active = TRUE
      ORDER BY center_name
    `),

    pool.query(`
      SELECT
        subject_id AS "subjectId",
        subject_code AS "subjectName",
        grade
      FROM subjects
      ORDER BY
        subject_code,
        grade
    `),

    pool.query(`
      SELECT DISTINCT grade
      FROM learners
      WHERE grade IS NOT NULL
      ORDER BY grade
    `),

    pool.query(`
      SELECT DISTINCT
        ${term}::int AS term
      FROM assessment_submissions sub
      JOIN assessments a
        ON a.${ASSESSMENT_PK} = sub.assessment_id
      WHERE sub.submitted_at IS NOT NULL
        AND ${term} IS NOT NULL
        ${gradedCheck("sub")}
      ORDER BY term
    `),
  ]);

return {
  currentTerm: getCurrentTerm(),
  terms: terms.rows.map(
    (record) => Number(record.term)
  ),
  centers: rows(centers),
  subjects: rows(subjects),
  grades: grades.rows.map(
    (record) => Number(record.grade)
  ),
};
}