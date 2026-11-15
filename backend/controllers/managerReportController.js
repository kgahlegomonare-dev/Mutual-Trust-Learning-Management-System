import * as managerReportService from '../services/managerReportService.js';

const getUserId = (req) => {
  return req.user?.user_id ?? req.user?.id ?? req.user?.userId;
};

const handleError = (res, error, message = 'Failed to load manager report') => {
  console.error(message);
  console.error(error);

  return res.status(500).json({
    success: false,
    message,
    error:
      process.env.NODE_ENV === 'development'
        ? error.message
        : undefined,
  });
};

const parseIntQueryParam = (value) => {
  if (value === undefined || value === '') {
    return { value: null, valid: true };
  }

  const parsed = Number(value);

  return {
    value: parsed,
    valid: Number.isInteger(parsed),
  };
};

export const getOverview = async (req, res) => {
  try {
    const managerId = getUserId(req);

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated manager ID could not be determined.',
      });
    }

    const overview =
      await managerReportService.getOverview(managerId);

    return res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'Failed to load manager overview'
    );
  }
};

export const getStudentPerformance = async (req, res) => {
  try {
    const managerId = getUserId(req);

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated manager ID could not be determined.',
      });
    }

    const {
      grade,
      subject_id,
      class_id,
    } = req.query;

    const parsedGrade = parseIntQueryParam(grade);
    const parsedSubjectId = parseIntQueryParam(subject_id);
    const parsedClassId = parseIntQueryParam(class_id);

    if (!parsedGrade.valid) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be a valid integer.',
      });
    }

    if (!parsedSubjectId.valid) {
      return res.status(400).json({
        success: false,
        message: 'subject_id must be a valid integer.',
      });
    }

    if (!parsedClassId.valid) {
      return res.status(400).json({
        success: false,
        message: 'class_id must be a valid integer.',
      });
    }

    const performance =
      await managerReportService.getStudentPerformance(
        managerId,
        {
          grade: parsedGrade.value,
          subjectId: parsedSubjectId.value,
          classId: parsedClassId.value,
        }
      );

    return res.status(200).json({
      success: true,
      filters: {
        grade: parsedGrade.value,
        subject_id: parsedSubjectId.value,
        class_id: parsedClassId.value,
      },
      data: performance,
    });

  } catch (error) {
    return handleError(
      res,
      error,
      'Failed to load student performance'
    );
  }
};

export const getOverallAttendance = async (req, res) => {
  try {
    const managerId = getUserId(req);

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated manager ID could not be determined.',
      });
    }

    const { grade, class_id } = req.query;

    const parsedGrade = parseIntQueryParam(grade);
    const parsedClassId = parseIntQueryParam(class_id);

    if (!parsedGrade.valid) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be a valid integer.',
      });
    }

    if (!parsedClassId.valid) {
      return res.status(400).json({
        success: false,
        message: 'class_id must be a valid integer.',
      });
    }

    const attendance =
      await managerReportService.getStudentAttendance(
        managerId,
        {
          grade: parsedGrade.value,
          classId: parsedClassId.value,
        }
      );

    return res.status(200).json({
      success: true,
      filters: {
        grade: parsedGrade.value,
        class_id: parsedClassId.value,
      },
      data: attendance,
    });

  } catch (error) {
    return handleError(
      res,
      error,
      'Failed to load student attendance'
    );
  }
};

export const getAttendanceByClass = async (req, res) => {
  try {
    const managerId = getUserId(req);

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated manager ID could not be determined.',
      });
    }

    const attendanceByClass =
      await managerReportService.getAttendanceByClass(
        managerId
      );

    return res.status(200).json({
      success: true,
      data: attendanceByClass,
    });

  } catch (error) {
    return handleError(
      res,
      error,
      'Failed to load attendance by class'
    );
  }
};

export const getStudentsBelowAttendanceThreshold = async (
  req,
  res
) => {
  try {
    const managerId = getUserId(req);

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated manager ID could not be determined.',
      });
    }

    const threshold =
      req.query.threshold !== undefined &&
      req.query.threshold !== ''
        ? Number(req.query.threshold)
        : 75;

    if (!Number.isFinite(threshold)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance threshold must be a valid number.',
      });
    }

    if (threshold < 0 || threshold > 100) {
      return res.status(400).json({
        success: false,
        message: 'Attendance threshold must be between 0 and 100.',
      });
    }

    const students =
      await managerReportService.getStudentsBelowAttendanceThreshold(
        managerId,
        threshold
      );

    return res.status(200).json({
      success: true,
      threshold,
      data: students,
    });

  } catch (error) {
    return handleError(
      res,
      error,
      'Failed to load students below attendance threshold'
    );
  }
};