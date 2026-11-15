import learnerReportService from "../services/learnerReportService.js";

function getLearnerId(req) {
  return req.user?.user_id || req.user?.id;
}

function requireLearnerId(req, res) {
  const learnerId = getLearnerId(req);

  if (!learnerId) {
    res.status(401).json({
      success: false,
      message: "Authenticated learner ID was not found.",
    });

    return null;
  }

  return learnerId;
}

export async function getOverview(req, res, next) {
  try {
    const learnerId = requireLearnerId(req, res);
    if (!learnerId) return;

    const data = await learnerReportService.getOverview(learnerId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectPerformance(req, res, next) {
  try {
    const learnerId = requireLearnerId(req, res);
    if (!learnerId) return;

    const data = await learnerReportService.getSubjectPerformance(learnerId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getPerformanceTrend(req, res, next) {
  try {
    const learnerId = requireLearnerId(req, res);
    if (!learnerId) return;

    // The frontend selects a subject by name (not id), so we filter by
    // subject name straight through the service/repository layers.
    const subjectName = req.query.subject || null;
    const period = req.query.period || "term";

    const data = await learnerReportService.getPerformanceTrend(learnerId, {
      subjectName,
      period,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getAssessmentResults(req, res, next) {
  try {
    const learnerId = requireLearnerId(req, res);
    if (!learnerId) return;

    const data = await learnerReportService.getAssessmentResults(learnerId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getAttendance(req, res, next) {
  try {
    const learnerId = requireLearnerId(req, res);
    if (!learnerId) return;

    const data = await learnerReportService.getAttendance(learnerId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingAssessments(req, res, next) {
  try {
    const learnerId = requireLearnerId(req, res);
    if (!learnerId) return;

    const data = await learnerReportService.getUpcomingAssessments(learnerId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}