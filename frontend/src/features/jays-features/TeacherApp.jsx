import React, { useState, useEffect, useCallback } from 'react';
import {ArrowLeft} from 'lucide-react';
import {
  Tabs,
  Tab,
  Box,
  Paper,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';


import {
  Plus,
  Trash2,
  ListChecks,
  ToggleLeft,
  AlignLeft,
  Check,
  X,
  ClipboardList,
  Users,
  PenLine,
  BarChart3,
  Loader2,
  CheckCircle2,
  Trophy,
  LogOut,
  User, BookOpen, Mail} from 'lucide-react';

// Service & Shared Components imports
import * as assessmentService from '../../services/assessmentService';
import { StatusBadge, rosterStatus } from './shared';
import { useNavigate } from 'react-router-dom';

// Common base styles for native HTML inputs
const baseInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8.5px 14px',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  color: '#333333',
  backgroundColor: '#ffffff',
  border: '1px solid #ccc',
  borderRadius: '12px',
  outline: 'none',
  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '0.80rem',
  fontWeight: 340,
  color: '#000000',
};



const QUESTION_TYPES = {
  mcq: { label: 'Multiple choice', icon: ListChecks },
  true_false: { label: 'True / False', icon: ToggleLeft },
  short_answer: { label: 'Short answer', icon: AlignLeft },
};

/* ==========================================================================
   1. BUILDER TAB COMPONENTS
   ========================================================================== */

export function SettingsPanel({ draft, disabled, onChange }) {
  const [focusedField, setFocusedField] = useState(null);

  if (!draft) return null;

  // Helper for applying focused and disabled states inline
  const getInputStyle = (fieldId, extraStyles = {}) => ({
    ...baseInputStyle,
    ...(focusedField === fieldId && !disabled && {
      borderColor: '#1976d2',
      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.2)',
      backgroundColor: '#ffffff',
    }),
    ...(disabled && {
      backgroundColor: '#f5f5f5',
      color: '#a6a6a6',
      cursor: 'not-allowed',
      borderColor: '#e0e0e0',
    }),
    ...extraStyles,
  });

  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: 'background.default' }}>
      <Grid container spacing={2}>
        
        {/* Title Field */}
        <Grid size={{ xs: 12 }}>
          <label htmlFor="title-input" style={labelStyle}>Title</label>
          <input
            id="title-input"
            type="text"
            aria-label="Title"
            disabled={disabled}
            value={draft.title ?? ''}
            onChange={(e) => onChange({ title: e.target.value })}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
            placeholder="Enter title"
            style={getInputStyle('title')}
          />
        </Grid>

        {/* Description Field (Textarea) */}
        <Grid size={{ xs: 12 }}>
          <label htmlFor="desc-input" style={labelStyle}>Description</label>
          <textarea
            id="desc-input"
            rows={2}
            disabled={disabled}
            value={draft.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
            onFocus={() => setFocusedField('desc')}
            onBlur={() => setFocusedField(null)}
            placeholder="Enter description"
            style={getInputStyle('desc', { resize: 'vertical' })}
          />
        </Grid>

        {/* Time Limit Field */}
        <Grid size={{ xs: 6 }}>
          <label htmlFor="time-limit-input" style={labelStyle}>Time Limit (minutes)</label>
          <input
            id="time-limit-input"
            type="number"
            aria-label="Time limit (minutes)"
            disabled={disabled}
            value={draft.time_limit_minutes ?? ''}
            onChange={(e) =>
              onChange({
                time_limit_minutes: e.target.value ? Number(e.target.value) : null,
              })
            }
            onFocus={() => setFocusedField('timeLimit')}
            onBlur={() => setFocusedField(null)}
            placeholder="No limit"
            style={getInputStyle('timeLimit')}
          />
        </Grid>

        {/* Max Attempts Field */}
        <Grid size={{ xs: 6 }}>
          <label htmlFor="max-attempts-input" style={labelStyle}>Max Attempts</label>
          <input
            id="max-attempts-input"
            type="number"
            aria-label="Max attempts"
            disabled={disabled}
            value={draft.max_attempts ?? 1}
            onChange={(e) =>
              onChange({ max_attempts: Number(e.target.value) || 1 })
            }
            onFocus={() => setFocusedField('maxAttempts')}
            onBlur={() => setFocusedField(null)}
            style={getInputStyle('maxAttempts')}
          />
        </Grid>

        {/* Checkbox */}
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Checkbox
                disabled={disabled}
                checked={!!draft.shuffle_questions}
                onChange={(e) =>
                  onChange({ shuffle_questions: e.target.checked })
                }
              />
            }
            label={
              <Typography variant="body2">
                Shuffle question order per student
              </Typography>
            }
          />
        </Grid>

      </Grid>
    </Paper>
  );
}
function QuestionCard({ question, index, onDelete, disabled }) {
  const meta = QUESTION_TYPES[question.type] || QUESTION_TYPES.short_answer;
  const Icon = meta.icon;

  return (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: 'monospace', mt: 0.5 }}
          >
            {String(index + 1).padStart(2, '0')}
          </Typography>
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
              }}
            >
              <Chip
                icon={<Icon size={14} />}
                label={`${meta.label} · ${question.points} pt${
                  Number(question.points) === 1 ? '' : 's'
                }`}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body1">{question.question_text}</Typography>
          </Box>
        </Box>
        {!disabled && (
          <IconButton size="small" color="error" onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        )}
      </Box>

      {question.options && question.options.length > 0 && (
        <Box sx={{ mt: 2, ml: 4 }}>
          {question.options.map((opt, optIdx) => (
            <Box
              key={opt.id || optIdx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
              }}
            >
              {opt.is_correct ? (
                <Check size={16} color="green" />
              ) : (
                <Box sx={{ width: 16 }} />
              )}
              <Typography
                variant="body2"
                color={opt.is_correct ? 'success.main' : 'text.secondary'}
              >
                {opt.option_text}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </CardContent>
  </Card>
);
}

export function AddQuestionForm({ onAdd, adding }) {
  const [type, setType] = useState('mcq');
  const [text, setText] = useState('');
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState([
    { id: 1, text: '', isCorrect: false },
    { id: 2, text: '', isCorrect: false },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState(true);
  const [error, setError] = useState('');

  // Track focused field for active highlighting
  const [focusedInput, setFocusedInput] = useState(null);

  // Helper for applying dynamic active highlight style
  const getInputStyle = (id, extraStyles = {}) => ({
    ...baseInputStyle,
    ...(focusedInput === id && {
      borderColor: '#1976d2',
      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.2)',
      backgroundColor: '#ffffff',
    }),
    ...extraStyles,
  });

  function reset() {
    setText('');
    setPoints(1);
    setOptions([
      { id: Date.now(), text: '', isCorrect: false },
      { id: Date.now() + 1, text: '', isCorrect: false },
    ]);
    setCorrectAnswer(true);
    setError('');
  }

  function updateOption(id, field, value) {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  }

  async function handleSubmit() {
    setError('');
    if (!text.trim()) return setError('Question text is required.');
    let payload;
    if (type === 'mcq') {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) return setError('Add at least 2 options.');
      if (!filled.some((o) => o.isCorrect))
        return setError('Mark at least one option as correct.');
      payload = {
        type,
        question_text: text,
        points,
        options: filled.map((o) => ({
          option_text: o.text,
          is_correct: o.isCorrect,
        })),
      };
    } else if (type === 'true_false') {
      payload = {
        type,
        question_text: text,
        points,
        options: [
          { option_text: 'True', is_correct: correctAnswer },
          { option_text: 'False', is_correct: !correctAnswer },
        ],
      };
    } else {
      payload = { type, question_text: text, points, options: [] };
    }
    await onAdd(payload);
    reset();
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3, // Increased overall card padding from 2.5 to 3
        bgcolor: 'action.hover',
        borderStyle: 'dashed',
        borderRadius: 3,
      }}
    >
      {/* 1. Question Type Switcher */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2,          // Moving gap inside sx guarantees MUI spacing (8px * 2 = 16px)
          mb: 3, 
          flexWrap: 'wrap' 
        }}
      >
        {Object.entries(QUESTION_TYPES).map(([val, t]) => (
          <Button
            key={val}
            size="small"
            variant={type === val ? 'contained' : 'outlined'}
            onClick={() => setType(val)}
            sx={{ borderRadius: '8px' }}
          >
            {t.label}
          </Button>
        ))}
      </Box>

      {/* 2. Question Text Input */}
      <Box mb={3}>
        <label htmlFor="question-text-input" style={labelStyle}>
          Question Text
        </label>
        <textarea
          id="question-text-input"
          rows={2}
          placeholder="Type the question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocusedInput('question-text')}
          onBlur={() => setFocusedInput(null)}
          style={getInputStyle('question-text', { resize: 'vertical' })}
        />
      </Box>

      {/* 3. MCQ Options */}
    {/* 3. MCQ Options */}
{type === 'mcq' && (
  <Box mb={3}>
    <label style={labelStyle}>Answer Options</label>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1.5 }}>
      {options.map((opt, i) => (
        <Box
          key={opt.id}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <IconButton
            size="small"
            aria-label={`Mark option ${i + 1} as ${opt.isCorrect ? 'incorrect' : 'correct'}`}
            onClick={() =>
              updateOption(opt.id, 'isCorrect', !opt.isCorrect)
            }
            sx={{
              border: '1px solid',
              borderColor: opt.isCorrect ? 'success.main' : 'divider',
              bgcolor: opt.isCorrect ? 'success.main' : 'background.paper',
              color: opt.isCorrect ? 'common.white' : 'action.active',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: opt.isCorrect ? 'success.dark' : 'action.hover',
                borderColor: opt.isCorrect ? 'success.dark' : 'text.secondary',
              },
            }}
          >
            <Check size={18} />
          </IconButton>
          <input
            type="text"
            aria-label={`Option ${i + 1}`}
            placeholder={`Option ${i + 1}`}
            value={opt.text}
            onChange={(e) => updateOption(opt.id, 'text', e.target.value)}
            onFocus={() => setFocusedInput(`option-${opt.id}`)}
            onBlur={() => setFocusedInput(null)}
            style={getInputStyle(`option-${opt.id}`)}
          />
          {options.length > 2 && (
            <IconButton
              size="small"
              color="error"
              onClick={() =>
                setOptions((prev) => prev.filter((o) => o.id !== opt.id))
              }
            >
              <X size={16} />
            </IconButton>
          )}
        </Box>
      ))}
    </Box>
    <Button
      size="small"
      startIcon={<Plus size={14} />}
      onClick={() =>
        setOptions([
          ...options,
          { id: Date.now(), text: '', isCorrect: false },
        ])
      }
    >
      Add option
    </Button>
  </Box>
)}

      {/* 4. True/False Buttons */}
      {type === 'true_false' && (
        <Box display="flex" gap={2} mb={3}>
          <Button
            fullWidth
            variant={correctAnswer ? 'contained' : 'outlined'}
            color={correctAnswer ? 'success' : 'inherit'}
            onClick={() => setCorrectAnswer(true)}
          >
            True {correctAnswer && '(correct)'}
          </Button>
          <Button
            fullWidth
            variant={!correctAnswer ? 'contained' : 'outlined'}
            color={!correctAnswer ? 'success' : 'inherit'}
            onClick={() => setCorrectAnswer(false)}
          >
            False {!correctAnswer && '(correct)'}
          </Button>
        </Box>
      )}

      {/* 5. Footer Controls (Points + Add Button) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mt: 3, // Increased top spacing to push the footer down
          pt: 1, // Subtle extra top padding
        }}
      >
        <Box>
          <label htmlFor="points-input" style={labelStyle}>
            Points
          </label>
          <input
            id="points-input"
            type="number"
            aria-label="Points"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            onFocus={() => setFocusedInput('points')}
            onBlur={() => setFocusedInput(null)}
            style={getInputStyle('points', { width: '100px' })}
          />
        </Box>

        <Button
          variant="contained"
          disabled={adding}
          onClick={handleSubmit}
          startIcon={
            adding ? <CircularProgress size={16} /> : <Plus size={16} />
          }
        >
          Add Question
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2.5 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}
export function BuilderTab({ teacherId, subjectId, classes = [] }) {
  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const classId = classes[0]?.class_id ?? classes[0]?.id;

  const refreshList = useCallback(async () => {
    const rows = await assessmentService.listTeacherAssessments({ subjectId });
    setList(rows || []);
    return rows || [];
  }, [subjectId]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    refreshList()
      .then((rows) => {
        if (isMounted) setSelectedId(rows[0]?.id ?? null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [refreshList]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedId) {
      setSelected(null);
      setDraft(null);
      return;
    }
    assessmentService.getAssessmentById(selectedId).then((a) => {
      if (isMounted && a) {
        setSelected(a);
        setDraft({ ...a });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  async function handleCreate() {
    console.log("class id: "+classId);
    if (!classId) return;
    
    const created = await assessmentService.createAssessment({
      subject_id: subjectId,
      class_id: classId || null,
      title: 'Untitled assessment',
      type: 'quiz',
    });
    await refreshList();
    setSelectedId(created.id);
  }

  async function saveSettings() {
    setSaving(true);
    await assessmentService.updateAssessment(selectedId, draft);
    const refreshed = await assessmentService.getAssessmentById(selectedId);
    setSelected(refreshed);
    setDraft({ ...refreshed });
    await refreshList();
    setSaving(false);
  }

  async function handlePublish() {
    if (!selectedId) return;
    setPublishing(true);
    await assessmentService.publishAssessment(selectedId); 

    const refreshed = await assessmentService.getAssessmentById(selectedId);
    setSelected(refreshed);
    setDraft({ ...refreshed });
    await refreshList();
    setPublishing(false);
  }

  async function handleAddQuestion(payload) {
    setAdding(true);
    await assessmentService.addQuestion(selectedId, payload);
    const refreshed = await assessmentService.getAssessmentById(selectedId);
    setSelected(refreshed);
    setDraft({ ...refreshed });
    await refreshList();
    setAdding(false);
  }

  async function handleDeleteQuestion(qid) {
    await assessmentService.deleteQuestion(qid);
    const refreshed = await assessmentService.getAssessmentById(selectedId);
    setSelected(refreshed);
    setDraft({ ...refreshed });
    await refreshList();
  }

  const isDraft = selected?.status === 'draft';

  // Reusable modern scrollbar styles object
  const modernScrollbarStyles = {
    overflowY: "auto",
    scrollbarWidth: "thin", // For Firefox
    scrollbarColor: "rgba(0,0,0,0.2) transparent", // For Firefox
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRadius: "4px",
      transition: "background-color 0.2s ease",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "540px" }}>
      {/* Sidebar List Panel */}
      <Paper
        square
        variant="outlined"
        sx={{
          width: 260,
          flexShrink: 0,
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: "540px",
        }}
      >
        <Typography variant="h6">Assessments</Typography>
        <Typography variant="caption" color="text.secondary">
          {list.length} in this subject
        </Typography>

        {/* Scrollable Assessment List Container */}
        <Box
          sx={{
            mt: 2,
            mb: 2,
            flexGrow: 1,
            pr: 0.5,
            ...modernScrollbarStyles,
          }}
        >
          {list.map((a) => {
            const isSelected = selectedId === a.id;
            return (
              <Paper
                key={a.id}
                variant="outlined"
                elevation={isSelected ? 2 : 0}
                onClick={() => setSelectedId(a.id)}
                sx={{
                  p: 1.5,
                  mb: 1,
                  cursor: "pointer",
                  bgcolor: isSelected ? "primary.50" : "background.paper",
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderWidth: 1,
                  borderStyle: "solid",
                  transition: "all 0.15s ease-in-out",
                  "&:hover": {
                    bgcolor: isSelected ? "primary.100" : "action.hover",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "primary.main" : "text.primary",
                  }}
                >
                  {a.title || "Untitled assessment"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: isSelected ? "primary.dark" : "text.secondary" }}
                >
                  {a.status} · {a.question_count || 0} q
                </Typography>
              </Paper>
            );
          })}
        </Box>

        <Button
          fullWidth
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={handleCreate}
        >
          New Assessment
        </Button>
      </Paper>

      {/* Main Content Viewport */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          maxHeight: "540px",
          ...modernScrollbarStyles,
        }}
      >
        {!selected || !draft ? (
          <Typography color="text.secondary">
            Select or create an assessment.
          </Typography>
        ) : (
          <Box sx={{ maxWidth: "800px", mx: "auto" }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Box>
                <Typography variant="h5">
                  {selected.title || "Untitled assessment"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selected.questions?.length || 0} questions
                </Typography>
              </Box>
              <Chip
                label={selected.status}
                color={isDraft ? "warning" : "success"}
              />
            </Box>

            <SettingsPanel
              draft={draft}
              disabled={!isDraft}
              onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
            />
            {isDraft && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={saveSettings}
                  disabled={saving}
                >
                  Save Settings
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={handlePublish}
                  disabled={
                    saving || publishing || !selected?.questions?.length
                  }
                  startIcon={
                    publishing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : null
                  }
                >
                  Publish Assessment
                </Button>
              </Box>
            )}

            {selected.questions?.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                disabled={!isDraft}
                onDelete={() => handleDeleteQuestion(q.id)}
              />
            ))}

            {isDraft && (
              <AddQuestionForm onAdd={handleAddQuestion} adding={adding} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ==========================================================================
   2. COMPLETION TAB COMPONENT
   ========================================================================== */

export function CompletionTab({ teacherId, subjectId }) {
  const [published, setPublished] = useState([]);
  const [assessmentId, setAssessmentId] = useState('');
  const [roster, setRoster] = useState([]);
  const [memo, setMemo] = useState(null);
  const [memoText, setMemoText] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    assessmentService.listTeacherAssessments({ subjectId }).then((rows) => {
      if (!isMounted) return;
      const nonDraft = (rows || []).filter((a) => a.status !== 'draft');
      setPublished(nonDraft);
      setAssessmentId(nonDraft[0]?.id ?? '');
    });
    return () => {
      isMounted = false;
    };
  }, [subjectId]);

  useEffect(() => {
    let isMounted = true;
    if (!assessmentId) return;
    Promise.all([
      assessmentService.getRoster(assessmentId),
      assessmentService.getMemorandum(assessmentId),
    ]).then(([rosterRows, memoRow]) => {
      if (!isMounted) return;
      setRoster(rosterRows || []);
      setMemo(memoRow);
      setMemoText(memoRow?.content || '');
    });
    return () => {
      isMounted = false;
    };
  }, [assessmentId]);

  const rows = roster.map((r) => ({ ...r, displayStatus: rosterStatus(r) }));
  const filtered =
    filter === 'all'
      ? rows
      : rows.filter((r) => r.displayStatus === filter);

  // Reusable modern scrollbar styles object
  const modernScrollbarStyles = {
    scrollbarWidth: 'thin', // For Firefox
    scrollbarColor: 'rgba(0,0,0,0.2) transparent', // For Firefox
    '&::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '4px',
      transition: 'background-color 0.2s ease',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
  };

  return (
    <Box 
      sx={{ 
        p: 3, 
        maxWidth: '900px', 
        mx: 'auto', 
        width: '100%', 
        boxSizing: 'border-box',
        overflowY: 'auto',
        maxHeight: '100%',
        ...modernScrollbarStyles 
      }}
    >
      {/* Assessment Selector Dropdown */}
      <Box sx={{ mb: 3, maxWidth: '400px' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.8 }}>
          Select Quiz / Assessment
        </Typography>

        <FormControl fullWidth size="small">
          <Select
            displayEmpty
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            renderValue={(selected) => {
              if (!selected) {
                return <span style={{ color: '#aaa' }}>Select an assessment...</span>;
              }
              return published.find((a) => a.id === selected)?.title;
            }}
            sx={{
              borderRadius: '8px',
              bgcolor: 'background.paper',
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  mt: 0.5,
                  maxHeight: '260px', // Restricts dropdown height to trigger scrolling if many items exist
                  ...modernScrollbarStyles, // Applies the modern scrollbar to dropdown list
                  '& .MuiMenuItem-root': {
                    fontSize: '0.92rem',
                    py: 1,
                    px: 2,
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-selected': {
                      backgroundColor: '#f0f7ff',
                      color: '#1976d2',
                      fontWeight: 600,
                      '&:hover': { backgroundColor: '#e3f2fd' },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="" disabled>
              Select an assessment...
            </MenuItem>
            {published.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Roster Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.student_id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>
                  <StatusBadge status={r.displayStatus} />
                </TableCell>
                <TableCell align="right">
                  {r.score != null ? `${r.score}/${r.max_score}` : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Memorandum Input Form */}
      <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default', borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 1.5 }}>
          Memorandum
        </Typography>

        <textarea
          rows={4}
          placeholder="Write class feedback or memo solutions..."
          value={memoText}
          onChange={(e) => setMemoText(e.target.value)}
          style={{
            ...baseInputStyle,
            marginBottom: '16px',
            resize: 'vertical',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1976d2';
            e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ccc';
            e.target.style.boxShadow = 'none';
          }}
        />

        <Button
          variant="contained"
          onClick={() =>
            assessmentService.releaseMemorandum(assessmentId, {
              teacher_id: teacherId,
              content: memoText,
            })
          }
        >
          {memo ? 'Update Memorandum' : 'Release Memorandum'}
        </Button>
      </Paper>
    </Box>
  );
}

function SubjectPills({ subjects = [], selected, onSelect }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {subjects.map((sub, index) => {
        // 1. Resolve ID (checking common DB primary key names)
        const id = sub.id ?? sub.subject_id ?? sub._id ?? index;

        // 2. Resolve Label (checking common database field names)
        const label = sub.name || sub.title || sub.subject_name || sub.code || sub.subject_code || 'Unnamed Subject';

        const isSelected = selected === id;

        return (
          <Chip
            key={id}
            label={label}
            clickable
            color={isSelected ? 'primary' : 'default'}
            variant={isSelected ? 'filled' : 'outlined'}
            onClick={() => onSelect(id)}
          />
        );
      })}
    </Box>
  );
}
/* ==========================================================================
   3. MARKING TAB COMPONENT
   ========================================================================== */

export function MarkingTab({ teacherId, subjectId }) {
  const [published, setPublished] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [roster, setRoster] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [draftByQuestion, setDraftByQuestion] = useState({});
  const [savingQ, setSavingQ] = useState(null);

  useEffect(() => {
    assessmentService.listTeacherAssessments({ subjectId }).then((rows) => {
      const nonDraft = rows.filter((a) => a.status !== 'draft');
      setPublished(nonDraft);
      setAssessmentId(nonDraft[0]?.id ?? null);
    });
  }, [subjectId]);

  useEffect(() => {
    if (!assessmentId) return;
    assessmentService.getAssessmentById(assessmentId).then(setAssessment);
    assessmentService.getRoster(assessmentId).then((rows) =>
      setRoster(rows.filter((r) => r.status === 'submitted' || r.status === 'graded'))
    );
  }, [assessmentId]);

  async function openStudent(sid, subId) {
    setStudentId(sid);
    const sub = await assessmentService.getSubmission(subId);
    setSubmission(sub);
    const draft = {};
    sub.answers.forEach((a) => {
      draft[a.question_id] = { points_awarded: a.points_awarded, feedback: a.feedback || '' };
    });
    setDraftByQuestion(draft);
  }

  function setPointsFor(qid, val, maxPts) {
    const num = Math.min(Math.max(0, Number(val)), maxPts);
    setDraftByQuestion((prev) => ({
      ...prev,
      [qid]: { ...prev[qid], points_awarded: num },
    }));
  }

  function setFeedbackFor(qid, text) {
    setDraftByQuestion((prev) => ({
      ...prev,
      [qid]: { ...prev[qid], feedback: text },
    }));
  }

  async function saveQuestion(question, answer) {
    setSavingQ(question.id);
    const d = draftByQuestion[question.id] || {};
    await assessmentService.gradeAnswer(answer.id, {
      points_awarded: d.points_awarded ?? 0,
      feedback: d.feedback,
      grader_id: teacherId,
    });
    const sub = await assessmentService.getSubmission(submission.id);
    setSubmission(sub);
    setSavingQ(null);
  }

  async function handleFinalize() {
    await assessmentService.finalizeSubmission(submission.id, teacherId);
    const sub = await assessmentService.getSubmission(submission.id);
    setSubmission(sub);
  }

  // Loose comparison (==) handles string vs number mismatch.
  // Fallbacks check standard DB key variations (student_id / user_id / id, name / student_name / full_name).
  const activeRosterEntry = roster.find(
    (r) => (r.student_id ?? r.user_id ?? r.id) == studentId
  );

  const studentName =
    activeRosterEntry?.name ||
    activeRosterEntry?.student_name ||
    activeRosterEntry?.full_name ||
    submission?.student_name ||
    submission?.user_name ||
    'Unknown Student';

  const studentEmail =
    activeRosterEntry?.email ||
    activeRosterEntry?.student_email ||
    submission?.student_email ||
    null;

  const resolvedStudentId = activeRosterEntry?.learner_number;

  return (
    <Box sx={{ display: 'flex', minHeight: '540px' }}>
      {/* Left Roster Panel */}
      <Paper square variant="outlined" sx={{ width: 280, flexShrink: 0, p: 2 }}>
        {/* Outer Label for clean layout */}
        <label style={labelStyle}>Select Assessment</label>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            displayEmpty
            value={assessmentId ?? ''}
            onChange={(e) => setAssessmentId(e.target.value)}
            renderValue={(selected) => {
              if (!selected) {
                return <span style={{ color: '#aaa' }}>Select an assessment...</span>;
              }
              return published.find((a) => a.id === selected)?.title;
            }}
            sx={{
              borderRadius: '8px',
              bgcolor: 'background.paper',
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  mt: 0.5,
                  '& .MuiMenuItem-root': {
                    fontSize: '0.92rem',
                    py: 1,
                    px: 2,
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-selected': {
                      backgroundColor: '#f0f7ff',
                      color: '#1976d2',
                      fontWeight: 600,
                      '&:hover': { backgroundColor: '#e3f2fd' },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="" disabled>
              Select an assessment...
            </MenuItem>
            {published.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
          STUDENT SUBMISSIONS ({roster.length})
        </Typography>

        <Box>
          {roster.map((r) => {
            const currentRosterId = r.student_id ?? r.user_id ?? r.id;
            const isSelected = currentRosterId == studentId;
            const displayName = r.name || r.student_name || r.full_name || 'Student';

            return (
              <Paper
                key={currentRosterId}
                variant={isSelected ? 'elevation' : 'outlined'}
                elevation={isSelected ? 2 : 0}
                onClick={() => openStudent(currentRosterId, r.submission_id)}
                sx={{
                  p: 1.5,
                  mb: 1,
                  cursor: 'pointer',
                  borderRadius: 1.5,
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  borderLeft: isSelected ? '4px solid' : '1px solid',
                  borderLeftColor: isSelected ? 'primary.main' : 'divider',
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                <Typography variant="subtitle2" fontWeight={isSelected ? 'bold' : 'normal'}>
                  {displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {r.status === 'graded' ? `Graded · ${r.score}/${r.max_score}` : 'Needs grading'}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Paper>

      {/* Main Grading Workspace Panel */}
      <Box sx={{ flex: 1, p: 3, overflowY: 'auto', maxHeight: '540px' }}>
        {!submission || !assessment ? (
          <Typography color="text.secondary" align="center" sx={{ mt: 10 }}>
            Select a student's submission from the left panel to begin marking.
          </Typography>
        ) : (
          <Box sx={{ maxWidth: '800px', mx: 'auto' }}>

            {/* Prominent Student Details Header Box */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 3,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {studentName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                      {studentName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BookOpen size={13} /> {assessment.title}
                      </Typography>
                      {resolvedStudentId && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {resolvedStudentId}
                        </Typography>
                      )}
                      {studentEmail && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Mail size={13} /> {studentEmail}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={submission.status === 'graded' ? 'Graded' : 'Awaiting Grading'}
                    color={submission.status === 'graded' ? 'success' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 'bold', mb: 0.5 }}
                  />
                  <Typography variant="body2" fontWeight="bold" color="text.primary">
                    Score: {submission.score ?? 0} / {submission.max_score ?? 0}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Questions List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {assessment.questions.map((q) => {
                const ans = submission.answers.find((a) => a.question_id === q.id);
                if (!ans) return null;
                const chosenOption = q.options?.find((o) => String(o.id) === String(ans.selected_option_id));
                const isManual = q.type === 'short_answer';
                const d = draftByQuestion[q.id] || {};

                return (
                  <Card key={q.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {q.question_text}
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="body2" color="text.secondary">
                          {isManual
                            ? ans.answer_text || <em>No answer given</em>
                            : chosenOption?.option_text ?? <em>No answer given</em>}
                        </Typography>
                      </Paper>

                      <Box sx={{ mb: 2 }}>
                        <label style={labelStyle}>Points Awarded</label>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <input
                            type="number"
                            aria-label="Points"
                            disabled={!isManual}
                            min="0"
                            max={q.points}
                            step="0.5"
                            value={d.points_awarded ?? ''}
                            onChange={(e) => setPointsFor(q.id, e.target.value, q.points)}
                            style={{
                              ...baseInputStyle,
                              width: '120px',
                              backgroundColor: !isManual ? '#f5f5f5' : baseInputStyle.backgroundColor,
                              cursor: !isManual ? 'not-allowed' : 'text',
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            / {q.points}
                          </Typography>
                          {!isManual && <Chip label="Auto-graded" size="small" variant="outlined" />}
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <label style={labelStyle}>Feedback</label>
                        <textarea
                          rows={2}
                          placeholder="Feedback for this question..."
                          value={d.feedback ?? ''}
                          onChange={(e) => setFeedbackFor(q.id, e.target.value)}
                          style={{
                            ...baseInputStyle,
                            resize: 'vertical',
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={savingQ === q.id}
                          onClick={() => saveQuestion(q, ans)}
                          startIcon={
                            savingQ === q.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <CheckCircle2 size={14} />
                            )
                          }
                        >
                          Save
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            {/* Final Action Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" color="success" onClick={handleFinalize}>
                Finalize & Release Grade
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}


/* ==========================================================================
   4. GRADEBOOK TAB COMPONENT
   ========================================================================== */
 function GradebookTab({ teacherId, subjectId }) {
  const [published, setPublished] = useState([]);
  const [assessmentId, setAssessmentId] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    assessmentService.listTeacherAssessments({ subjectId }).then((all) => {
      const nonDraft = (all || []).filter((a) => a.status !== 'draft');
      setPublished(nonDraft);
      setAssessmentId(nonDraft[0]?.id ?? '');
    });
  }, [subjectId]);

  useEffect(() => {
    if (!assessmentId) {
      setRows([]);
      return;
    }
    assessmentService.getGradebook(assessmentId).then(setRows);
  }, [assessmentId]);

  if (published.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Publish an assessment first to see marks.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%', boxSizing: 'border-box' }}>
      <Box sx={{ mb: 3, maxWidth: 300 }}>
        {/* Static, Non-Floating Label */}
        <Typography
          component="label"
          htmlFor="assessment-select"
          variant="body2"
          sx={{ fontWeight: 600, mb: 0.75, display: 'block', color: 'text.secondary' }}
        >
          Select Assessment
        </Typography>

        <FormControl fullWidth size="small">
          <Select
            id="assessment-select"
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              <em>Select an assessment</em>
            </MenuItem>
            {published.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ width: '100%' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Rank</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.student_id}>
                {/* Combined First and Last Name */}
                <TableCell>
                  {`${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown'}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {r.status === 'graded'
                    ? `${r.score}/${r.max_score}`
                    : r.status === 'submitted'
                    ? 'Pending'
                    : '—'}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {r.rank ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Trophy size={14} color="#d97706" /> {r.rank}/{r.total}
                    </Box>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
/* ==========================================================================
   5. ROOT TEACHER APP COMPONENT
   ========================================================================== */



export default function TeacherApp({ teacher, onLogout }) {
  const navigate = useNavigate(); // <-- 1. Initialize the useNavigate hook
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjectId, setSubjectId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    Promise.all([
      assessmentService.getTeacherSubjects(),
      assessmentService.getTeacherClasses(),
    ]).then(([subs, cls]) => {
      console.log("🔍 Teacher Subjects:", subs);
      console.log("🔍 Teacher Classes:", cls);
      setSubjects(subs);
      setClasses(cls);
      setSubjectId(subs[0]?.subject_id ?? subs[0]?.id ?? null);
    });
  }, []);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        height: '100vh',        // Keep viewport height constraint
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: 'grey.100', 
        p: 0                    // Remove padding to fill edge-to-edge
      }}
    >
      {/* Header Bar with Back Button and Logout */}
      <Box 
        sx={{ 
          px: 3, 
          py: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0            // Prevent header from squishing
        }}
      >
        {/* Left Section: Back to Overview Button */}
        <Button 
          size="small" 
          color="inherit" 
          onClick={() => navigate('/dashboard/overview')} // <-- 2. Redirects to overview
          startIcon={<ArrowLeft size={16} />}
        >
          Back to Dashboard
        </Button>

        {/* Right Section: Sign Out / Logout */}
        {onLogout && (
          <Button size="small" color="inherit" onClick={onLogout} startIcon={<LogOut size={16} />}>
            Sign out
          </Button>
        )}
      </Box>

      {/* Main Full-Screen Card Viewport */}
      <Paper 
        variant="outlined" 
        sx={{ 
          flexGrow: 1,           // Stretch to fill remaining height
          borderRadius: 0,       // Remove border radius for true full-screen layout
          border: 'none',        // Remove outline border
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: 'auto',     // Allows the entire card to scroll
          overflowX: 'hidden',
          m: 0,                  // Remove margins
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        }}
      >
        {/* Subject Selection Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Select a subject
          </Typography>
          <SubjectPills subjects={subjects} selected={subjectId} onSelect={setSubjectId} />
        </Box>

        {!subjectId ? (
          <Box sx={{ p: 8, textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Select a subject above to view, create, or mark assessments.</Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Tab Navigation Header */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Builder" icon={<ClipboardList size={16} />} iconPosition="start" />
                <Tab label="Completion" icon={<Users size={16} />} iconPosition="start" />
                <Tab label="Marking" icon={<PenLine size={16} />} iconPosition="start" />
                <Tab label="Gradebook" icon={<BarChart3 size={16} />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* Active Tab Panel Container */}
            <Box 
              sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                bgcolor: '#ffffff',
              }}
            >
              {activeTab === 0 && <BuilderTab teacherId={teacher?.id} subjectId={subjectId} classes={classes} />}
              {activeTab === 1 && <CompletionTab teacherId={teacher?.id} subjectId={subjectId} />}
              {activeTab === 2 && <MarkingTab teacherId={teacher?.id} subjectId={subjectId} />}
              {activeTab === 3 && <GradebookTab teacherId={teacher?.id} subjectId={subjectId} />}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
