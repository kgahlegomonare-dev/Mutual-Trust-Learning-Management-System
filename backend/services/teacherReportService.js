import * as teacherReportRepository from "../repositories/teacherReportRepository.js";

const PASS_MARK = 50;
const AT_RISK_MARK = 60;
const AT_RISK_ATTENDANCE = 75;

const validateTeacherId = (teacherId) => {
  const parsedTeacherId = Number(teacherId);
  if (!Number.isInteger(parsedTeacherId) || parsedTeacherId <= 0) {
    const error = new Error("Invalid teacher ID.");
    error.statusCode = 400;
    throw error;
  }
  return parsedTeacherId;
};

const validateId = (value, fieldName) => {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    const error = new Error(`${fieldName} must be a valid positive integer.`);
    error.statusCode = 400;
    throw error;
  }
  return parsedValue;
};

export const getOverview = async (teacherId) => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const overview = await teacherReportRepository.getOverview(validatedTeacherId, {
    passMark: PASS_MARK,
    atRiskMark: AT_RISK_MARK,
    atRiskAttendance: AT_RISK_ATTENDANCE,
  });

  return {
    totalStudents: Number(overview?.totalStudents || 0),
    totalTeachers: Number(overview?.totalTeachers || 0),
    averageMark: Number(Number(overview?.averageMark || 0).toFixed(2)),
    attendance: Number(Number(overview?.attendance || 0).toFixed(2)),
    atRisk: Number(overview?.atRisk || 0),
    passRate: Number(Number(overview?.passRate || 0).toFixed(2)),
  };
};

export const getSubjects = async (teacherId) => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const subjects = await teacherReportRepository.getSubjects(validatedTeacherId);
  return subjects.map((subject) => ({
    subjectId: Number(subject.subjectId),
    subjectName: subject.subjectName,
  }));
};

export const getClasses = async (teacherId) => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const classes = await teacherReportRepository.getClasses(validatedTeacherId);
  return classes.map((item) => ({
    classId: Number(item.classId),
    className: item.className,
    grade: item.grade ? Number(item.grade) : null,
  }));
};

export const getPerformanceTrend = async (teacherId, subjectId, classId, period = "term") => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const validatedSubjectId = validateId(subjectId, "subjectId");
  const validatedClassId = validateId(classId, "classId");

  const allowedPeriods = ["30days", "term", "year", "academic-year"];
  if (!allowedPeriods.includes(period)) {
    const error = new Error("Invalid performance period.");
    error.statusCode = 400;
    throw error;
  }

  const assignment = await teacherReportRepository.verifyTeacherAssignment(
    validatedTeacherId,
    validatedSubjectId,
    validatedClassId
  );
  if (!assignment) {
    const error = new Error("You are not assigned to this subject and class.");
    error.statusCode = 403;
    throw error;
  }

  const trend = await teacherReportRepository.getPerformanceTrend(
    validatedTeacherId,
    validatedSubjectId,
    validatedClassId,
    period
  );

  return {
    subjectId: validatedSubjectId,
    classId: validatedClassId,
    period,
    data: trend.map((item) => ({
      label: item.label,
      average: Number(Number(item.average || 0).toFixed(2)),
    })),
  };
};

export const getSubjectPerformance = async (teacherId) => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const results = await teacherReportRepository.getSubjectPerformance(validatedTeacherId, {
    passMark: PASS_MARK,
  });

  return results.map((item) => ({
    subjectId: Number(item.subjectId),
    subject: item.subject,
    students: Number(item.students || 0),
    average: Number(Number(item.average || 0).toFixed(2)),
    passRate: Number(Number(item.passRate || 0).toFixed(2)),
    attendance: Number(Number(item.attendance || 0).toFixed(2)),
  }));
};

export const getClassPerformance = async (teacherId) => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const results = await teacherReportRepository.getClassPerformance(validatedTeacherId, {
    passMark: PASS_MARK,
  });

  return results.map((item) => ({
    classId: Number(item.classId),
    className: item.className,
    students: Number(item.students || 0),
    average: Number(Number(item.average || 0).toFixed(2)),
    passRate: Number(Number(item.passRate || 0).toFixed(2)),
    attendance: Number(Number(item.attendance || 0).toFixed(2)),
  }));
};

export const getAttendanceTrend = async (teacherId, classId) => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const validatedClassId = validateId(classId, "classId");

  const teacherHasClass = await teacherReportRepository.verifyTeacherClass(
    validatedTeacherId,
    validatedClassId
  );
  if (!teacherHasClass) {
    const error = new Error("You are not assigned to this class.");
    error.statusCode = 403;
    throw error;
  }

  const results = await teacherReportRepository.getAttendanceTrend(validatedTeacherId, validatedClassId);
  return {
    classId: validatedClassId,
    data: results.map((item) => ({
      label: item.label,
      attendance: Number(Number(item.attendance || 0).toFixed(2)),
    })),
  };
};

export const getStudentRanking = async (teacherId, subjectId, classId, sortBy = "average", order = "desc") => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const validatedSubjectId = validateId(subjectId, "subjectId");
  const validatedClassId = validateId(classId, "classId");

  const allowedSortFields = ["average", "attendance"];
  if (!allowedSortFields.includes(sortBy)) {
    const error = new Error("Invalid sorting field.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedOrder = String(order).toLowerCase();
  if (!["asc", "desc"].includes(normalizedOrder)) {
    const error = new Error("Invalid sorting order.");
    error.statusCode = 400;
    throw error;
  }

  const assignment = await teacherReportRepository.verifyTeacherAssignment(
    validatedTeacherId,
    validatedSubjectId,
    validatedClassId
  );
  if (!assignment) {
    const error = new Error("You are not assigned to this subject and class.");
    error.statusCode = 403;
    throw error;
  }

  const results = await teacherReportRepository.getStudentRanking(
    validatedTeacherId,
    validatedSubjectId,
    validatedClassId,
    sortBy,
    normalizedOrder
  );

  return results.map((student) => ({
    studentId: Number(student.studentId),
    name: student.name,
    className: student.className,
    average: Number(Number(student.average || 0).toFixed(2)),
    attendance: Number(Number(student.attendance || 0).toFixed(2)),
  }));
};

export const getInterventionStudents = async (teacherId) => {
  const validatedTeacherId = validateTeacherId(teacherId);
  const results = await teacherReportRepository.getInterventionStudents(validatedTeacherId, {
    atRiskMark: AT_RISK_MARK,
    atRiskAttendance: AT_RISK_ATTENDANCE,
  });

  return results.map((student) => {
    const average = Number(Number(student.average || 0).toFixed(2));
    const attendance = Number(Number(student.attendance || 0).toFixed(2));

    let reason = "None";
    if (average < AT_RISK_MARK && attendance < AT_RISK_ATTENDANCE) {
      reason = "Performance & Attendance";
    } else if (average < AT_RISK_MARK) {
      reason = "Low Performance";
    } else if (attendance < AT_RISK_ATTENDANCE) {
      reason = "Low Attendance";
    }

    return {
      studentId: Number(student.studentId),
      name: student.name,
      className: student.className,
      average,
      attendance,
      reason,
    };
  });
};

export const TEACHER_REPORT_CONFIG = {
  PASS_MARK,
  AT_RISK_MARK,
  AT_RISK_ATTENDANCE,
};