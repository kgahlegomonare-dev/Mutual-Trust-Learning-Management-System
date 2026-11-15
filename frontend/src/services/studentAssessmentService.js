// src/services/studentAssessmentService.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/assessments';

export const TYPE_FROM_DB = {
  multiple_choice: 'mcq',
  true_false: 'true_false',
  short_answer: 'short_answer',
  essay: 'short_answer',
};

// Helper to retrieve user token (adjust storage key if using localStorage/cookies/context)
function getAuthToken() {
  return localStorage.getItem('token') || '';
}

async function request(path, options = {}) {
  const token = getAuthToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || `Request failed: ${res.status}`);
  return data;
}

function normalizeQuestion(q) {
  return {
    ...q,
    type: TYPE_FROM_DB[q.question_type] || q.question_type,
    options: q.options || [],
  };
}

function normalizeAssessment(a) {
  return { ...a, questions: (a.questions || []).map(normalizeQuestion) };
}

// GET /api/assessments/student/subjects
export const getStudentSubjects = () => request('/student/subjects');

// GET /api/assessments/student/list?subjectId=
export const getStudentAssessments = (subjectId) =>
  request(`/student/list?subjectId=${subjectId}`);

// GET /api/assessments/:id
export const getAssessment = (id) => request(`/${id}`).then(normalizeAssessment);

// POST /api/assessments/:id/attempts
export const startAttempt = (assessmentId) =>
  request(`/${assessmentId}/attempts`, {
    method: 'POST',
  });

// PUT /api/assessments/submissions/:id/answers
export const saveAnswer = (submissionId, { question_id, answer_text, selected_option_id }) =>
  request(`/submissions/${submissionId}/answers`, {
    method: 'PUT',
    body: JSON.stringify({ question_id, answer_text, selected_option_id }),
  });

// POST /api/assessments/submissions/:id/submit
export const submitAttempt = (submissionId) =>
  request(`/submissions/${submissionId}/submit`, { method: 'POST' });

// GET /api/assessments/submissions/:id/result
export const getResult = (submissionId) =>
  request(`/submissions/${submissionId}/result`).then((data) => {
    if (data?.questions) {
      data.questions = data.questions.map(normalizeQuestion);
    }
    return data;
  });