import * as teacherReportService from "../services/teacherReportService.js";

const getTeacherId = (req) => {
  const teacherId = req.user?.user_id ?? req.user?.id;

  if (!teacherId) {
    const error = new Error("Authenticated teacher ID was not found.");
    error.statusCode = 401;
    throw error;
  }

  return Number(teacherId);
};

export const getOverview = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const overview = await teacherReportService.getOverview(teacherId);
    return res.status(200).json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
};

export const getSubjects = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const subjects = await teacherReportService.getSubjects(teacherId);
    return res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const classes = await teacherReportService.getClasses(teacherId);
    return res.status(200).json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

export const getPerformanceTrend = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const { subjectId, classId, period = "term" } = req.query;

    if (!subjectId) return res.status(400).json({ success: false, message: "subjectId is required." });
    if (!classId) return res.status(400).json({ success: false, message: "classId is required." });

    const parsedSubjectId = Number(subjectId);
    const parsedClassId = Number(classId);

    if (!Number.isInteger(parsedSubjectId)) return res.status(400).json({ success: false, message: "subjectId must be a valid integer." });
    if (!Number.isInteger(parsedClassId)) return res.status(400).json({ success: false, message: "classId must be a valid integer." });

    const allowedPeriods = ["30days", "term", "year", "academic-year"];
    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({ success: false, message: "Invalid period. Use 30days, term, year, or academic-year." });
    }

    const trend = await teacherReportService.getPerformanceTrend(teacherId, parsedSubjectId, parsedClassId, period);
    return res.status(200).json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
};

export const getSubjectPerformance = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const subjectPerformance = await teacherReportService.getSubjectPerformance(teacherId);
    return res.status(200).json({ success: true, data: subjectPerformance });
  } catch (error) {
    next(error);
  }
};

export const getClassPerformance = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const classPerformance = await teacherReportService.getClassPerformance(teacherId);
    return res.status(200).json({ success: true, data: classPerformance });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceTrend = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const { classId } = req.query;

    if (!classId) return res.status(400).json({ success: false, message: "classId is required." });

    const parsedClassId = Number(classId);
    if (!Number.isInteger(parsedClassId)) return res.status(400).json({ success: false, message: "classId must be a valid integer." });

    const attendanceTrend = await teacherReportService.getAttendanceTrend(teacherId, parsedClassId);
    return res.status(200).json({ success: true, data: attendanceTrend });
  } catch (error) {
    next(error);
  }
};

export const getStudentRanking = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const { subjectId, classId, sortBy = "average", order = "desc" } = req.query;

    if (!subjectId) return res.status(400).json({ success: false, message: "subjectId is required." });
    const parsedSubjectId = Number(subjectId);
    if (!Number.isInteger(parsedSubjectId)) return res.status(400).json({ success: false, message: "subjectId must be a valid integer." });

    if (!classId) return res.status(400).json({ success: false, message: "classId is required." });
    const parsedClassId = Number(classId);
    if (!Number.isInteger(parsedClassId)) return res.status(400).json({ success: false, message: "classId must be a valid integer." });

    const allowedSortFields = ["average", "attendance"];
    if (!allowedSortFields.includes(sortBy)) return res.status(400).json({ success: false, message: "Invalid sortBy. Use average or attendance." });

    const normalizedOrder = order.toLowerCase();
    if (!["asc", "desc"].includes(normalizedOrder)) return res.status(400).json({ success: false, message: "Invalid order. Use asc or desc." });

    const students = await teacherReportService.getStudentRanking(teacherId, parsedSubjectId, parsedClassId, sortBy, normalizedOrder);
    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

export const getInterventionStudents = async (req, res, next) => {
  try {
    const teacherId = getTeacherId(req);
    const interventionStudents = await teacherReportService.getInterventionStudents(teacherId);
    return res.status(200).json({ success: true, data: interventionStudents });
  } catch (error) {
    next(error);
  }
};