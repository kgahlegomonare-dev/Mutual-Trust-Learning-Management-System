import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Stack,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
  FileStack,
  Award,
  Trophy,
  Megaphone,
  LogOut,
  ListChecks,
  ToggleLeft,
  AlignLeft,
  ArrowLeft
} from 'lucide-react';

import {useNavigate} from 'react-router-dom';

import * as api from '../../services/studentAssessmentService';
import { StatusBadge, SubjectPills, assessmentStatusFor } from './shared';

const TYPE_ICON = { mcq: ListChecks, true_false: ToggleLeft, short_answer: AlignLeft };
const TYPE_LABEL = { mcq: 'Multiple choice', true_false: 'True / False', short_answer: 'Short answer' };


function QuestionView({ question, index, total, answer, onAnswer, TYPE_ICON = {}, TYPE_LABEL = {} }) {
  const Icon = TYPE_ICON[question.type] || AlignLeft;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexShrink: 0 }}>
        <Icon size={16} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'monospace' }}
        >
          {TYPE_LABEL[question.type] || question.type} · Question {index + 1} of {total} · {question.points} pt{Number(question.points) === 1 ? '' : 's'}
        </Typography>
      </Box>

      {/* Question Text */}
      <Typography variant="h6" sx={{ fontFamily: 'serif', mb: 3, flexShrink: 0 }}>
        {question.question_text}
      </Typography>

      {/* MCQ / True or False Options */}
      {(question.type === 'mcq' || question.type === 'true_false') && (
        <FormControl component="fieldset" fullWidth sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <RadioGroup
            value={answer || ''}
            onChange={(e) => onAnswer(e.target.value)}
            sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Stack spacing={1} sx={{ flexGrow: 1, width: '100%' }}>
              {question.options?.map((opt) => {
                const isSelected = String(answer) === String(opt.id);
                return (
                  <Paper
                    key={opt.id}
                    variant="outlined"
                    sx={{
                      px: 2.5,
                      py: 2,
                      width: '100%',
                      boxSizing: 'border-box',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'action.selected' : 'background.paper',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                    onClick={() => onAnswer(opt.id)}
                  >
                    <FormControlLabel
                      value={opt.id}
                      control={<Radio size="small" />}
                      label={<Typography variant="body1">{opt.option_text}</Typography>}
                      sx={{ width: '100%', m: 0 }}
                    />
                  </Paper>
                );
              })}
            </Stack>
          </RadioGroup>
        </FormControl>
      )}

      {/* Short Answer / Essay Field */}
      {question.type === 'short_answer' && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <TextField
            fullWidth
            multiline
            placeholder="Type your answer..."
            value={answer || ''}
            onChange={(e) => onAnswer(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              '& .MuiInputBase-root': {
                flexGrow: 1,
                alignItems: 'flex-start',
                height: '100%',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

function Player({ assessment, initialAnswers, submissionId, onSubmitted, onExit }) {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = assessment.questions[qIndex];
  const progress = Math.round(((qIndex + 1) / assessment.questions.length) * 100);

  function handleAnswer(value) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    const isChoice = currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false';
    api.saveAnswer(submissionId, {
      question_id: currentQuestion.id,
      answer_text: isChoice ? null : value,
      selected_option_id: isChoice ? value : null,
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    await api.submitAttempt(submissionId);
    setSubmitting(false);
    onSubmitted();
  }

  return (
    /* Changed maxWidth from '600px' to '100%' and enabled full flex height */
    <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', px: 4, py: 4, boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontFamily: 'serif' }}>
          {assessment.title}
        </Typography>
        <Button size="small" startIcon={<ChevronLeft size={16} />} onClick={onExit} color="inherit">
          Exit
        </Button>
      </Box>

      <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, mb: 4, flexShrink: 0 }} />

      {/* Wrapper box forcing QuestionView to stretch across the full width */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', mb: 3 }}>
        <QuestionView
          question={currentQuestion}
          index={qIndex}
          total={assessment.questions.length}
          answer={answers[currentQuestion.id]}
          onAnswer={handleAnswer}
        />
      </Box>

      <Divider sx={{ my: 2, flexShrink: 0 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Button
          startIcon={<ChevronLeft size={16} />}
          disabled={qIndex === 0}
          onClick={() => setQIndex((i) => Math.max(0, i - 1))}
          color="inherit"
        >
          Previous
        </Button>

        {qIndex < assessment.questions.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ChevronRight size={16} />}
            onClick={() => setQIndex((i) => i + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            disabled={submitting}
            onClick={handleSubmit}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
          >
            Submit
          </Button>
        )}
      </Box>
    </Box>
  );
}

function ResultView({ result, onBack }) {
  const { submission, assessment, questions, rank, memorandum } = result;
  const graded = submission.status === 'graded';

  return (
    /* Expanded width to screen-wide */
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', px: 4, py: 4, boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontFamily: 'serif' }}>
          {assessment.title}
        </Typography>
        <Button size="small" startIcon={<ChevronLeft size={16} />} onClick={onBack} color="inherit">
          Back
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
        {graded ? (
          <>
            <Award size={32} color="#d97706" style={{ margin: '0 auto 8px' }} />
            <Typography variant="h4" sx={{ fontFamily: 'serif' }}>
              {submission.score} / {submission.max_score}
            </Typography>
            {rank && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                <Trophy size={16} color="#d97706" />
                <Typography variant="body2" color="text.secondary">
                  Ranked {rank.rank} of {rank.total}
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <>
            <Clock size={32} color="#9ca3af" style={{ margin: '0 auto 8px' }} />
            <Typography variant="body2" color="text.secondary">
              Submitted — awaiting grading for short-answer questions.
            </Typography>
          </>
        )}
      </Paper>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {questions.map((q) => {
          const ans = submission.answers?.find((a) => a.question_id === q.id);
          return (
            <Card key={q.id} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  {q.question_text}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', fontFamily: 'monospace', mb: 1 }}
                >
                  {ans?.points_awarded != null ? `${ans.points_awarded} / ${q.points} pts` : 'Not yet graded'}
                </Typography>
                {ans?.feedback && (
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary">
                      {ans.feedback}
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {memorandum && (
        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#fffbe3' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Megaphone size={16} color="#451a03" />
            <Typography variant="subtitle2" sx={{ fontFamily: 'serif' }}>
              Memorandum from your teacher
            </Typography>
          </Box>
          <Typography variant="body2" color="text.primary">
            {memorandum.content}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default function StudentApp({ student, onLogout }) {
  const navigate = useNavigate(); // 1. Initialize the navigate hook
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [openAssessmentId, setOpenAssessmentId] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingList, setLoadingList] = useState(false);

  const studentId = student?.id;

  useEffect(() => {
    api.getStudentSubjects()
      .then((data) => {
        console.log('Fetched subjects successfully:', data);
        setSubjects(data);
      })
      .catch((error) => {
        console.error('Error fetching student subjects:', error);
      });
  }, []);

  const refreshList = useCallback(() => {
    console.log("subject id: " + subjectId);
    if (!subjectId) {
      setAssessments([]);
      return;
    }
    setLoadingList(true);
    api
      .getStudentAssessments(subjectId)
      .then(setAssessments)
      .finally(() => setLoadingList(false));
  }, [studentId, subjectId]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  async function start(a) {
    const submission = await api.startAttempt(a.id, studentId);
    if (submission.status === 'not_submitted') {
      const full = await api.getAssessment(a.id);
      const initialAnswers = {};
      submission.answers?.forEach((ans) => {
        initialAnswers[ans.question_id] = ans.selected_option_id ?? ans.answer_text;
      });
      setPlayerData({ assessment: full, submissionId: submission.id, initialAnswers });
      setResult(null);
      setOpenAssessmentId(a.id);
    } else {
      await viewResult(submission.id, a.id);
    }
  }

  async function viewResult(submissionId, assessmentId) {
    const res = await api.getResult(submissionId);
    setResult(res);
    setPlayerData(null);
    setOpenAssessmentId(assessmentId);
  }

  async function handleSubmitted() {
    const res = await api.getResult(playerData.submissionId);
    setResult(res);
    setPlayerData(null);
    refreshList();
  }

  function backToList() {
    setOpenAssessmentId(null);
    setPlayerData(null);
    setResult(null);
    refreshList();
  }

  return (
    <Box 
      sx={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: 'grey.100', 
        overflow: 'hidden' 
      }}
    >
      {/* Main Container Card spanning full screen */}
      <Paper
        variant="outlined"
        sx={{
          flexGrow: 1,
          width: '100%',
          height: '100%',
          borderRadius: 0,
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.default'
        }}
      >
        {/* Top Subject Selection Bar */}
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          {/* Back to Dashboard Button Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button
              variant="text"
              color="inherit"
              size="small"
              startIcon={<ArrowLeft size={16} />}
              onClick={() => navigate('/dashboard/overview')} // Redirects back to overview
              sx={{ textTransform: 'none', fontWeight: 500, p: 0, minWidth: 'auto' }}
            >
              Back to Dashboard
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontFamily: 'monospace',
              mb: 1,
            }}
          >
            Choose a subject
          </Typography>
          <SubjectPills
            subjects={subjects}
            selected={subjectId}
            onSelect={(id) => {
              setSubjectId(id);
              backToList();
            }}
          />
        </Box>

        {/* View Router Section */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', bgcolor: '#ffffff' }}>
          {!subjectId && (
            <Box
              sx={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                py: 10,
              }}
            >
              <Typography color="text.secondary" variant="body2">
                Select a subject above to see your assessments.
              </Typography>
            </Box>
          )}

          {subjectId && !openAssessmentId && (
            <Box sx={{ width: '100%', maxWidth: '900px', mx: 'auto', px: 4, py: 5, flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontFamily: 'serif' }} gutterBottom>
                Available assessments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Pick one below.
              </Typography>

              {loadingList ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress size={24} color="inherit" />
                </Box>
              ) : assessments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <FileStack size={32} style={{ margin: '0 auto 8px' }} />
                  <Typography variant="body2">
                    Nothing published yet. Check back later.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {assessments.map((a) => {
                    const st = assessmentStatusFor(a);
                    return (
                      <Paper
                        key={a.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontFamily: 'serif', fontWeight: 600 }}
                            >
                              {a.title}
                            </Typography>
                            <StatusBadge status={st} />
                          </Box>
                          {a.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              {a.description}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              mt: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {a.question_count} questions · {a.total_points} pts
                            </Typography>
                            {a.time_limit_minutes && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <Clock size={12} color="#6b7280" />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {a.time_limit_minutes} min
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>

                        {st === 'submitted' || st === 'graded' ? (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => viewResult(a.submission_id, a.id)}
                            sx={{ ml: 2, flexShrink: 0 }}
                          >
                            View result
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => start(a)}
                            sx={{ ml: 2, flexShrink: 0 }}
                          >
                            {st === 'in_progress' ? 'Continue' : 'Start'}
                          </Button>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}

          {playerData && (
            <Player
              assessment={playerData.assessment}
              initialAnswers={playerData.initialAnswers}
              submissionId={playerData.submissionId}
              onSubmitted={handleSubmitted}
              onExit={backToList}
            />
          )}

          {result && <ResultView result={result} onBack={backToList} />}
        </Box>
      </Paper>
    </Box>
  );
}