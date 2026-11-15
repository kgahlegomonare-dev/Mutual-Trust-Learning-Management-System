import learnerReportRepository from "../repositories/learnerReportRepository.js";

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function round(value, decimals = 2) {
  const number = toNumber(value);

  return Number(number.toFixed(decimals));
}

function getPerformanceStatus(percentage) {
  const value = toNumber(percentage);

  if (value >= 80) {
    return "Excellent";
  }

  if (value >= 60) {
    return "Good";
  }

  if (value >= 50) {
    return "Pass";
  }

  return "Needs Improvement";
}

export async function getOverview(learnerId) {
  const learner = await learnerReportRepository.getLearnerById(learnerId);

  if (!learner) {
    const error = new Error("Learner profile could not be found.");
    error.statusCode = 404;
    throw error;
  }

  const [academic, attendance, outstanding] = await Promise.all([
    learnerReportRepository.getAcademicOverview(learnerId),
    learnerReportRepository.getAttendanceSummary(learnerId),
    learnerReportRepository.getOutstandingAssessments(learnerId),
  ]);

  const totalClasses = toNumber(attendance?.total_classes);
  const present = toNumber(attendance?.present);

  const attendancePercentage = totalClasses > 0 ? round((present / totalClasses) * 100) : 0;

  const completed = toNumber(academic?.assessments_completed);
  const passed = toNumber(academic?.passed_assessments);

  const passRate = completed > 0 ? round((passed / completed) * 100) : 0;
  const overallAverage = round(academic?.overall_average);

  return {
    learner: {
      id: learner.user_id,
      learnerNumber: learner.learner_number,
      firstName: learner.first_name,
      lastName: learner.last_name,
      email: learner.email,
      grade: learner.grade,
      highschool: learner.highschool,
      classId: learner.class_id,
      className: learner.class_name,
      centerId: learner.center_id,
      centerName: learner.center_name,
      province: learner.center_province,
    },
    overallAverage,
    termAverage: overallAverage,
    attendance: attendancePercentage,
    assessmentsCompleted: completed,
    assessmentsOutstanding: toNumber(outstanding?.outstanding),
    passRate,
    attendanceDetails: {
      totalClasses,
      present,
      absent: toNumber(attendance?.absent),
      late: toNumber(attendance?.late),
    },
  };
}

export async function getSubjectPerformance(learnerId) {
  const rows = await learnerReportRepository.getSubjectPerformance(learnerId);

  return rows.map((row) => ({
    subjectId: row.subject_id,
    subject: row.subject,
    average: round(row.average),
    highest: round(row.highest),
    lowest: round(row.lowest),
    passRate: round(row.pass_rate),
    trend: round(row.trend),
    assessmentCount: toNumber(row.assessment_count),
  }));
}

export async function getPerformanceTrend(learnerId, options = {}) {
  const { subjectName = null, period = "term" } = options;

  let startDate = null;
  const now = new Date();

  if (period === "month") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === "year") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 365);
  } else {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 120);
  }

  const rows = await learnerReportRepository.getPerformanceTrend(
    learnerId,
    subjectName,
    startDate
  );

  return rows.map((row) => ({
    submissionId: row.submission_id,
    assessmentId: row.assessment_id,
    assessment: row.assessment,
    subjectId: row.subject_id,
    subject: row.subject,
    date: row.submitted_at,
    percentage: round(row.percentage),
  }));
}

export async function getAssessmentResults(learnerId) {
  const rows = await learnerReportRepository.getAssessmentResults(learnerId);

  return rows.map((row) => {
    const percentage = round(row.percentage);
    const statusLabel = getPerformanceStatus(percentage);

    return {
      id: row.id,
      assessmentId: row.assessment_id,
      assessment: row.assessment,
      subject: row.subject,
      type: row.type,
      date: row.date,
      mark: toNumber(row.mark),
      total: toNumber(row.total),
      percentage,
      // status / status_label / result are all the same value — the
      // frontend only looks for status_label/result and falls back to
      // recomputing its own label if neither is present, so we send all
      // three to guarantee it uses this (backend) computed label.
      status: statusLabel,
      status_label: statusLabel,
      result: statusLabel,
      submissionStatus: row.status,
    };
  });
}

export async function getAttendance(learnerId) {
  const [summary, trendRows] = await Promise.all([
    learnerReportRepository.getAttendanceSummary(learnerId),
    learnerReportRepository.getAttendanceTrend(learnerId),
  ]);

  const total = toNumber(summary?.total_classes);
  const present = toNumber(summary?.present);

  const overall = total > 0 ? round((present / total) * 100) : 0;

  const trend = trendRows.map((row) => {
    const weekTotal = toNumber(row.total);
    const weekPresent = toNumber(row.present);

    return {
      // `date` is what the frontend's fallback chain (label ?? period ??
      // date) actually looks for — `week` alone was never picked up.
      date: row.week_start,
      week: row.week_start,
      attendance: weekTotal > 0 ? round((weekPresent / weekTotal) * 100) : 0,
      present: weekPresent,
      absent: toNumber(row.absent),
      late: toNumber(row.late),
      total: weekTotal,
    };
  });

  return {
    overall,
    present,
    absent: toNumber(summary?.absent),
    late: toNumber(summary?.late),
    totalClasses: total,
    trend,
  };
}

function formatAssessmentType(type) {
  if (!type) {
    return "Assessment";
  }

  const value = String(type).toLowerCase();

  if (value === "quiz") {
    return "Quiz";
  }

  if (value === "assignment") {
    return "Assignment";
  }

  if (value === "exam") {
    return "Exam";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function getUpcomingAssessments(learnerId) {
  const rows = await learnerReportRepository.getUpcomingAssessments(learnerId);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subject: row.subject,
    type: formatAssessmentType(row.type),
    date: row.available_from,
    status: "Upcoming",
    availableUntil: row.available_until,
  }));
}

export async function getCompleteReport(learnerId) {
  const [overview, subjectPerformance, assessmentResults, attendance, upcomingAssessments] =
    await Promise.all([
      getOverview(learnerId),
      getSubjectPerformance(learnerId),
      getAssessmentResults(learnerId),
      getAttendance(learnerId),
      getUpcomingAssessments(learnerId),
    ]);

  return {
    ...overview,
    subjectPerformance,
    assessmentResults,
    attendanceData: attendance,
    upcomingAssessments,
  };
}

const learnerReportService = {
  getOverview,
  getSubjectPerformance,
  getPerformanceTrend,
  getAssessmentResults,
  getAttendance,
  getUpcomingAssessments,
  getCompleteReport,
};

export default learnerReportService;