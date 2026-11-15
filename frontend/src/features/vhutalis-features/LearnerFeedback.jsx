import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Rating from '@mui/material/Rating';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import LockIcon from '@mui/icons-material/Lock';

import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';

export default function LearnerFeedback() {
  const { user } = useAuth();
  const role = (user?.user_role || '').toLowerCase();
  const isManager = role.includes('admin') || role.includes('manager');
  const isLearner = role.includes('learner');

  if (isManager) return <ManagerFeedback />;
  if (isLearner) return <LearnerFeedbackView />;

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Feedback</Typography>
      <Typography variant="body2" color="text.secondary">
        Feedback forms are created by centre managers and completed by learners.
      </Typography>
    </Box>
  );
}

/* ============================================================
   MANAGER — list forms, build a form, read results
   ============================================================ */
function ManagerFeedback() {
  const [view, setView] = useState('list');     // 'list' | 'build' | 'results'
  const [activeForm, setActiveForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadForms = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/feedback/forms');
      setForms(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load feedback forms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadForms(); }, [loadForms]);

  const handleToggleOpen = async (form) => {
    try {
      await axiosInstance.patch(`/feedback/forms/${form.form_id}/state`, {
        is_open: !form.is_open,
      });
      setSuccess(form.is_open ? 'Form closed.' : 'Form reopened.');
      await loadForms();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the form.');
    }
  };

  if (view === 'build') {
    return (
      <FormBuilder
        onCancel={() => setView('list')}
        onCreated={async () => {
          setView('list');
          setSuccess('Feedback form created.');
          await loadForms();
        }}
      />
    );
  }

  if (view === 'results') {
    return (
      <FormResults
        formId={activeForm.form_id}
        onBack={() => { setActiveForm(null); setView('list'); }}
      />
    );
  }

  if (loading) {
    return <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const formatWhen = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  const targetLabel = { teacher: 'Teachers', subject: 'Subjects', centre: 'The centre' };

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Feedback Forms</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Build forms for learners to complete. All responses are anonymous.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setView('build')}
          sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
        >
          + New Form
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Form</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>About</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Questions</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Responses</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No feedback forms yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              forms.map((f) => (
                <TableRow key={f.form_id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {f.title}
                    {!f.is_open && (
                      <Chip label="Closed" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                    )}
                  </TableCell>
                  <TableCell>{targetLabel[f.target_type] || f.target_type}</TableCell>
                  <TableCell>{formatWhen(f.created_at)}</TableCell>
                  <TableCell align="center">{f.question_count}</TableCell>
                  <TableCell align="center">{f.response_count}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => { setActiveForm(f); setView('results'); }}
                      >
                        Results
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={f.is_open ? 'error' : 'success'}
                        onClick={() => handleToggleOpen(f)}
                      >
                        {f.is_open ? 'Close' : 'Reopen'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/* ============================================================
   MANAGER — the form builder
   ============================================================ */
function FormBuilder({ onCancel, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState('teacher');
  const [questions, setQuestions] = useState([
    { question_text: '', question_type: 'rating', is_required: true },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateQuestion = (index, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { question_text: '', question_type: 'rating', is_required: true },
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Give the form a title.'); return; }
    if (questions.length === 0) { setError('Add at least one question.'); return; }
    if (questions.some((q) => !q.question_text.trim())) {
      setError('Every question needs text.');
      return;
    }

    setSaving(true); setError('');
    try {
      await axiosInstance.post('/feedback/forms', {
        title: title.trim(),
        description: description.trim() || null,
        target_type: targetType,
        questions: questions.map((q) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          is_required: q.is_required,
        })),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the form.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={onCancel}><ArrowBackIcon fontSize="small" /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>New Feedback Form</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Learners answer anonymously. You'll see aggregated results only.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
        <TextField
          label="Form title"
          fullWidth size="small" sx={{ mb: 2 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Term 2 Teacher Feedback"
        />
        <TextField
          label="Description (optional)"
          fullWidth size="small" multiline rows={2} sx={{ mb: 2 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Shown to learners above the questions."
        />
        <FormControl fullWidth size="small">
          <InputLabel id="target-label">What is this feedback about?</InputLabel>
          <Select
            labelId="target-label"
            label="What is this feedback about?"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
          >
            <MenuItem value="teacher">A teacher — learners pick which of their teachers</MenuItem>
            <MenuItem value="subject">A subject — learners pick which of their subjects</MenuItem>
            <MenuItem value="centre">The centre — general feedback</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Questions</Typography>

      {questions.map((q, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, minWidth: 20 }}>
              {i + 1}.
            </Typography>
            <TextField
              label="Question"
              fullWidth size="small"
              value={q.question_text}
              onChange={(e) => updateQuestion(i, { question_text: e.target.value })}
              placeholder="e.g. How clearly does this teacher explain new concepts?"
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id={`qtype-${i}`}>Answer type</InputLabel>
              <Select
                labelId={`qtype-${i}`}
                label="Answer type"
                value={q.question_type}
                onChange={(e) => updateQuestion(i, { question_type: e.target.value })}
              >
                <MenuItem value="rating">Rating 1-5</MenuItem>
                <MenuItem value="text">Written answer</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={() => removeQuestion(i)}
              disabled={questions.length === 1}
              sx={{ mt: 0.5 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ pl: 4.5, mt: 1 }}>
            <Button
              size="small"
              onClick={() => updateQuestion(i, { is_required: !q.is_required })}
              sx={{ textTransform: 'none' }}
            >
              {q.is_required ? 'Required' : 'Optional'} — click to change
            </Button>
          </Box>
        </Paper>
      ))}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button variant="outlined" onClick={addQuestion} sx={{ textTransform: 'none' }}>
          + Add question
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onCancel} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
        >
          {saving ? <CircularProgress size={22} /> : 'Create Form'}
        </Button>
      </Box>
    </Box>
  );
}

/* ============================================================
   MANAGER — results
   ============================================================ */
function FormResults({ formId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/feedback/forms/${formId}/results`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load results.');
      } finally {
        setLoading(false);
      }
    })();
  }, [formId]);

  if (loading) {
    return <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={onBack}><ArrowBackIcon fontSize="small" /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{data?.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Anonymous results. Nothing here can be traced back to a learner.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {(data?.targets || []).length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No responses have been submitted yet.
          </Typography>
        </Paper>
      )}

      {(data?.targets || []).map((t) => (
        <Paper key={t.target_id} variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t.target_name}</Typography>
            <Chip
              label={`${t.response_count} response${t.response_count === 1 ? '' : 's'}`}
              size="small"
            />
          </Box>

          {t.suppressed ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
              <LockIcon fontSize="small" color="disabled" />
              <Typography variant="body2" color="text.secondary">
                Results are hidden until at least {t.min_required} learners have responded.
                This protects the anonymity of the people who did.
              </Typography>
            </Box>
          ) : (
            <>
              <Divider sx={{ mb: 2 }} />
              {t.results.map((r) => (
                <Box key={r.question_id} sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    {r.question_text}
                  </Typography>

                  {r.question_type === 'rating' ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Rating value={r.average || 0} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {r.average ?? '—'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({r.answer_count} answered)
                        </Typography>
                      </Box>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = r.distribution?.[star] ?? 0;
                        const pct = r.answer_count ? (100 * count) / r.answer_count : 0;
                        return (
                          <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Typography variant="caption" sx={{ minWidth: 12 }}>{star}</Typography>
                            <LinearProgress
                              variant="determinate" value={pct}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" sx={{ minWidth: 20, textAlign: 'right' }}>
                              {count}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box>
                      {(r.comments || []).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No written answers.
                        </Typography>
                      ) : (
                        r.comments.map((c, i) => (
                          <Paper
                            key={i}
                            variant="outlined"
                            sx={{ p: 1.5, mb: 1, borderRadius: '8px', backgroundColor: 'action.hover' }}
                          >
                            <Typography variant="body2">{c}</Typography>
                          </Paper>
                        ))
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </>
          )}
        </Paper>
      ))}
    </Box>
  );
}

/* ============================================================
   LEARNER — pick a form, pick a target, fill it in
   REPLACE the placeholder LearnerFeedbackView function at the
   bottom of LearnerFeedback.jsx with everything below.
   ============================================================ */
function LearnerFeedbackView() {
  const [forms, setForms] = useState([]);
  const [activeForm, setActiveForm] = useState(null);   // form_id we've opened
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadForms = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/learner/feedback/forms');
      setForms(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your feedback forms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadForms(); }, [loadForms]);

  if (activeForm) {
    return (
      <FormFiller
        formId={activeForm}
        onBack={() => { setActiveForm(null); loadForms(); }}
      />
    );
  }

  if (loading) {
    return <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const targetLabel = {
    teacher: 'About your teachers',
    subject: 'About your subjects',
    centre: 'About the centre',
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Feedback</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Your answers are anonymous. Nobody, including your teachers, can see who said what.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {forms.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            There are no feedback forms open right now.
          </Typography>
        </Paper>
      ) : (
        forms.map((f) => (
          <Paper key={f.form_id} variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{f.title}</Typography>
                {f.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {f.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {targetLabel[f.target_type]} · {f.question_count} question
                  {f.question_count === 1 ? '' : 's'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => setActiveForm(f.form_id)}
                sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px', flexShrink: 0 }}
              >
                Open
              </Button>
            </Box>
          </Paper>
        ))
      )}
    </Box>
  );
}

/* ---------- one form: target list, then the questions ---------- */
function FormFiller({ formId, onBack }) {
  const [data, setData] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);
  const [answers, setAnswers] = useState({});   // question_id -> value
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/learner/feedback/forms/${formId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open that form.');
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => { load(); }, [load]);

  const startTarget = (t) => {
    setActiveTarget(t);
    setAnswers({});
    setError('');
    setSuccess('');
  };

  const setAnswer = (question_id, value) => {
    setAnswers((prev) => ({ ...prev, [question_id]: value }));
  };

  const handleSubmit = async () => {
    // Build the payload the API expects
    const payload = [];
    for (const q of data.questions) {
      const v = answers[q.question_id];
      if (q.question_type === 'rating') {
        if (!v) {
          if (q.is_required) { setError(`Please rate: "${q.question_text}"`); return; }
          continue;
        }
        payload.push({ question_id: q.question_id, rating_value: Number(v) });
      } else {
        const text = (v || '').trim();
        if (!text) {
          if (q.is_required) { setError(`Please answer: "${q.question_text}"`); return; }
          continue;
        }
        payload.push({ question_id: q.question_id, text_value: text });
      }
    }

    setSaving(true); setError('');
    try {
      const res = await axiosInstance.post(
        `/learner/feedback/forms/${formId}/submit`,
        { target_key: activeTarget.target_id, answers: payload }
      );
      setSuccess(res.data.message || 'Thanks — your feedback was submitted.');
      setActiveTarget(null);
      await load();   // refresh so the target now shows as done
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your feedback.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const targetNoun = {
    teacher: 'teacher', subject: 'subject', centre: 'centre',
  }[data?.target_type] || 'item';

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton
          size="small"
          onClick={() => (activeTarget ? setActiveTarget(null) : onBack())}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{data?.title}</Typography>
          {data?.description && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {data.description}
            </Typography>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ---- pick a target ---- */}
      {!activeTarget && (
        <>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Choose a {targetNoun}
          </Typography>

          {(data?.targets || []).length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                There's nothing for you to give feedback about on this form.
              </Typography>
            </Paper>
          ) : (
            data.targets.map((t) => (
              <Paper
                key={t.target_id}
                variant="outlined"
                sx={{ p: 2.5, borderRadius: '12px', mb: 1.5 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {t.target_name}
                    </Typography>
                    {t.target_detail && (
                      <Typography variant="body2" color="text.secondary">
                        {t.target_detail}
                      </Typography>
                    )}
                  </Box>
                  {t.already_submitted ? (
                    <Chip label="Done" size="small" color="success" variant="outlined" />
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => startTarget(t)}
                      sx={{ textTransform: 'none', flexShrink: 0 }}
                    >
                      Give feedback
                    </Button>
                  )}
                </Box>
              </Paper>
            ))
          )}
        </>
      )}

      {/* ---- answer the questions ---- */}
      {activeTarget && (
        <>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              You're giving feedback about
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {activeTarget.target_name}
            </Typography>
          </Paper>

          {data.questions.map((q, i) => (
            <Paper key={q.question_id} variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1.5 }}>
                {i + 1}. {q.question_text}
                {!q.is_required && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (optional)
                  </Typography>
                )}
              </Typography>

              {q.question_type === 'rating' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rating
                    value={Number(answers[q.question_id]) || 0}
                    onChange={(e, v) => setAnswer(q.question_id, v)}
                    size="large"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {answers[q.question_id] ? `${answers[q.question_id]} / 5` : 'Not rated yet'}
                  </Typography>
                </Box>
              ) : (
                <TextField
                  fullWidth multiline rows={3} size="small"
                  placeholder="Type your answer…"
                  value={answers[q.question_id] || ''}
                  onChange={(e) => setAnswer(q.question_id, e.target.value)}
                />
              )}
            </Paper>
          ))}

          <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
              Once submitted this can't be changed, and it can't be traced back to you.
            </Typography>
            <Button onClick={() => setActiveTarget(null)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
              sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
            >
              {saving ? <CircularProgress size={22} /> : 'Submit Anonymously'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}