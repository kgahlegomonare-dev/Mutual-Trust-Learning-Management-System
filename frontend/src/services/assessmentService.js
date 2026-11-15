import axiosInstance from '../api/axiosInstance';

// DB mapping helpers
export const TYPE_TO_DB = {
  mcq: 'multiple_choice',
  true_false: 'true_false',
  short_answer: 'short_answer',
};

export const TYPE_FROM_DB = {
  multiple_choice: 'mcq',
  true_false: 'true_false',
  short_answer: 'short_answer',
  essay: 'short_answer',
};

export const normalizeQuestion = (q) => ({
  ...q,
  type: TYPE_FROM_DB[q.question_type] || q.question_type,
  options: q.options || [],
});

export const normalizeAssessment = (a) => ({
  ...a,
  questions: (a.questions || []).map(normalizeQuestion),
});

// ============================================================================
// Teacher Context & Assessment Setup
// ============================================================================

// GET /api/assessments/teacher/subjects
export const getTeacherSubjects = async () => {
  const response = await axiosInstance.get('/teacher/subjects');
  // Map subject_id to id
  return (response.data || []).map((s) => ({
    ...s,
    id: s.id ?? s.subject_id,
  }));
};

// GET /api/assessments/teacher/classes
export const getTeacherClasses = async () => {
  const response = await axiosInstance.get('/teacher/classes');
  // Map class_id to id so components can use item.id
  return (response.data || []).map((c) => ({
    ...c,
    id: c.id ?? c.class_id,
  }));
};

// GET /api/assessments/teacher/list
export const listTeacherAssessments = async (params = {}) => {
  const response = await axiosInstance.get('/teacher/list', { params });
  const data = response.data;
  if (Array.isArray(data)) {
    return data.map(normalizeAssessment);
  }
  return data;
};

// POST /api/assessments/teacher
export const createAssessment = async (payload) => {
  const response = await axiosInstance.post('/teacher', payload);
  return normalizeAssessment(response.data);
};

// GET /api/assessments/:id
export const getAssessmentById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return normalizeAssessment(response.data);
};

// PATCH /api/assessments/:id
export const updateAssessment = async (id, patch) => {
  const response = await axiosInstance.patch(`/${id}`, patch);
  return response.data;
};

// POST /api/assessments/:id/publish
export const publishAssessment = async (id) => {
  const response = await axiosInstance.post(`/${id}/publish`);
  return response.data;
};

// POST /api/assessments/:id/close
export const closeAssessment = async (id) => {
  const response = await axiosInstance.post(`/${id}/close`);
  return response.data;
};

// DELETE /api/assessments/:id
export const deleteAssessment = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data;
};

// ============================================================================
// Question Management
// ============================================================================

// POST /api/assessments/:id/questions
export const addQuestion = async (assessmentId, { type, question_text, points, options }) => {
  const response = await axiosInstance.post(`/${assessmentId}/questions`, {
    question_text,
    question_type: TYPE_TO_DB[type] || type,
    points,
    options,
  });
  return normalizeQuestion(response.data);
};

// DELETE /api/assessments/questions/:id
export const deleteQuestion = async (questionId) => {
  const response = await axiosInstance.delete(`/questions/${questionId}`);
  return response.data;
};

// ============================================================================
// Roster, Gradebook & Manual Grading
// ============================================================================

// GET /api/assessments/:id/roster?status=
export const getRoster = async (assessmentId, status) => {
  const response = await axiosInstance.get(`/${assessmentId}/roster`, { params: { status } });
  return response.data;
};

// GET /api/assessments/:id/gradebook
export const getGradebook = async (assessmentId) => {
  const response = await axiosInstance.get(`/${assessmentId}/gradebook`);
  return response.data;
};

// GET /api/assessments/submissions/:id
export const getSubmission = async (submissionId) => {
  const response = await axiosInstance.get(`/submissions/${submissionId}`);
  const data = response.data;
  if (data?.answers) {
    data.answers = data.answers.map(normalizeQuestion);
  }
  return data;
};

// POST /api/assessments/answers/:id/grade
export const gradeAnswer = async (answerId, { points_awarded, feedback }) => {
  const response = await axiosInstance.put(`/answers/${answerId}/grade`, {
    points_awarded,
    feedback,
  });
  return response.data;
};

// POST /api/assessments/submissions/:id/finalize
export const finalizeSubmission = async (submissionId) => {
  const response = await axiosInstance.post(`/submissions/${submissionId}/finalize`);
  return response.data;
};

// ============================================================================
// Memorandum Management
// ============================================================================

// GET /api/assessments/:id/memorandum
export const getMemorandum = async (assessmentId) => {
  const response = await axiosInstance.get(`/${assessmentId}/memorandum`);
  return response.data;
};

// POST /api/assessments/:id/memorandum
export const releaseMemorandum = async (assessmentId, payload = {}) => {
  const response = await axiosInstance.post(`/${assessmentId}/memorandum`, payload);
  return response.data;
};