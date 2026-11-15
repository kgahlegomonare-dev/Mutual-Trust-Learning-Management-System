import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';



import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import LinearProgress from '@mui/material/LinearProgress';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';


export default function Attendance() {
  const { user: authUser } = useAuth();
  const role = authUser?.user_role?.toLowerCase() || '';

  if (role === 'teacher') return <TeacherAttendance />;
  if (role === 'learner') return <LearnerAttendance />;

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Attendance</Typography>
      <Typography variant="body2" color="text.secondary">
        Attendance is taken by teachers and submitted by learners.
      </Typography>
    </Box>
  );
}

/* ============================================================
   TEACHER VIEW  (replaces the existing TeacherAttendance function)
   - compact top: dropdown + generate button inline
   - generated code opens in a MODAL with live check-ins
   - past sessions are collapsed rows, expand to show the roster
   ============================================================ */
function TeacherAttendance() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [session, setSession] = useState(null);      // the session shown in the modal
  const [modalOpen, setModalOpen] = useState(false);
  const [sessions, setSessions] = useState([]);      // past sessions list
  const [expandedId, setExpandedId] = useState(null);// which past row is open
  const [rosterCache, setRosterCache] = useState({});// attendance_id -> roster data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- assignments (dropdown) ----
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/teacher/attendance/assignments');
        setAssignments(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your classes.');
      }
    })();
  }, []);

  // ---- past sessions ----
  const loadSessions = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/teacher/attendance/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Could not load sessions:', err);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleGenerate = async () => {
    if (!selectedAssignment) { setError('Please select a class first.'); return; }
    setLoading(true); setError('');
    try {
      const res = await axiosInstance.post('/teacher/attendance/sessions', {
        assignment_id: selectedAssignment,
      });
      setSession(res.data.data);
      setModalOpen(true);
      await loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open an attendance session.');
    } finally {
      setLoading(false);
    }
  };

const handleRowClick = async (s) => {
    // If the code is still live, reopen the modal instead of expanding
    if (s.is_live) {
      setSession({
        attendance_id: s.attendance_id,
        attendance_code: s.attendance_code,
        expires_at: s.expires_at,
      });
      setModalOpen(true);
      return;
    }

    // Otherwise expand/collapse the roster inline
    if (expandedId === s.attendance_id) { setExpandedId(null); return; }
    setExpandedId(s.attendance_id);
    if (!rosterCache[s.attendance_id]) {
      try {
        const res = await axiosInstance.get(`/teacher/attendance/sessions/${s.attendance_id}`);
        setRosterCache((prev) => ({ ...prev, [s.attendance_id]: res.data }));
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load that session.');
      }
    }
  };

  const formatWhen = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Take Attendance</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Pick a class and generate a code. Learners enter it to mark themselves present.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* --- compact inline generate row --- */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ flexGrow: 1, minWidth: 240 }}>
            <InputLabel id="assignment-label">Class &amp; Subject</InputLabel>
            <Select
              labelId="assignment-label"
              label="Class & Subject"
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
            >
              {assignments.length === 0 && (
                <MenuItem value="" disabled>No classes assigned to you</MenuItem>
              )}
              {assignments.map((a) => (
                <MenuItem key={a.assignment_id} value={a.assignment_id}>
                  {a.subject_name} ({a.subject_code}) — {a.class_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || !selectedAssignment}
            sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px', flexShrink: 0 }}
          >
            {loading ? <CircularProgress size={22} /> : 'Generate Code'}
          </Button>
        </Box>
      </Paper>

      {/* --- past sessions, collapsed rows --- */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Past Sessions</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>When</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Present</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  You haven't opened any attendance sessions yet.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s) => (
                <React.Fragment key={s.attendance_id}>
                  <TableRow
                    hover
                    sx={{ cursor: 'pointer', '& > *': { borderBottom: expandedId === s.attendance_id ? 'unset' : undefined } }}
                    onClick={() => handleRowClick(s)}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {s.subject_name}
                      {s.is_live && (
                        <Chip label="LIVE" size="small" color="success" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                      )}
                    </TableCell>
                    <TableCell>{s.class_name}</TableCell>
                    <TableCell>{formatWhen(s.created_at)}</TableCell>
                    <TableCell align="center">{s.present_count} / {s.roster_count}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        {expandedId === s.attendance_id
                          ? <KeyboardArrowUpIcon fontSize="small" />
                          : <KeyboardArrowDownIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0, borderBottom: expandedId === s.attendance_id ? undefined : 'none' }}>
                      <Collapse in={expandedId === s.attendance_id} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2 }}>
                          {rosterCache[s.attendance_id] ? (
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {rosterCache[s.attendance_id].stats.present_count} present,{' '}
                                {rosterCache[s.attendance_id].stats.absent_count} absent{' '}
                                (code {rosterCache[s.attendance_id].session.attendance_code})
                              </Typography>
                              <RosterTable
                                roster={rosterCache[s.attendance_id].roster}
                                emptyText="No learners enrolled in this class."
                              />
                            </>
                          ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={22} />
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- the code modal --- */}
      <CodeModal
        open={modalOpen}
        session={session}
        onClose={() => { setModalOpen(false); loadSessions(); }}
      />
    </Box>
  );
}

/* ---------- the generated-code modal, with a live counter ---------- */
function CodeModal({ open, session, onClose }) {
  const [stats, setStats] = useState(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!open || !session?.expires_at) return;

    const fetchCount = async () => {
      try {
        const res = await axiosInstance.get(`/teacher/attendance/sessions/${session.attendance_id}`);
        setStats(res.data.stats);
      } catch (err) {
        console.error('Could not refresh count:', err);
      }
    };

    const tick = () => {
      const msLeft = new Date(session.expires_at).getTime() - Date.now();
      if (msLeft <= 0) { setCountdown('Expired'); return; }
      const total = Math.floor(msLeft / 1000);
      const mm = String(Math.floor(total / 60)).padStart(2, '0');
      const ss = String(total % 60).padStart(2, '0');
      setCountdown(`${mm}:${ss}`);
    };

    tick();
    fetchCount();
    const clockId = setInterval(tick, 1000);
    const pollId = setInterval(() => {
      if (new Date(session.expires_at).getTime() - Date.now() > 0) fetchCount();
      else clearInterval(pollId);
    }, 5000);

    return () => { clearInterval(clockId); clearInterval(pollId); };
  }, [open, session]);

  if (!session) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Attendance Code</span>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Read this out to your class:
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: '0.15em', color: 'primary.main' }}>
            {session.attendance_code}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {countdown === 'Expired' ? 'This code has expired.' : `Expires in ${countdown}`}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {stats ? `${stats.present_count} of ${stats.roster_count}` : '—'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            checked in
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* Shared roster table used by both the live view and the drill-in */
function RosterTable({ roster, emptyText }) {
  const rows = roster || [];
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', boxShadow: 'none' }}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Learner</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Number</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.learner_id} hover>
                <TableCell sx={{ fontWeight: 500 }}>
                  {r.first_name} {r.last_name}
                </TableCell>
                <TableCell>{r.learner_number}</TableCell>
                <TableCell>
                  {r.submitted_at
                    ? new Date(r.submitted_at).toLocaleTimeString(undefined, {
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={r.status}
                    size="small"
                    color={r.status === 'absent' ? 'default' : 'success'}
                    variant={r.status === 'absent' ? 'outlined' : 'filled'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}


/* ============================================================
   LEARNER VIEW — enter a code, see your history
   ============================================================

   1) Make sure these are imported at the top of Attendance.jsx
      (most already are — add any that are missing):

        import LinearProgress from '@mui/material/LinearProgress';
        import WarningAmberIcon from '@mui/icons-material/WarningAmber';

   2) Inside the LearnerAttendance component, add stats state and a
      loader, and render <AttendanceStats /> at the top of the return.
   ============================================================ */

// --- colour a rate: red <75, green >=75 ---
const attendanceRateColor = (rate) => {
  if (rate === null || rate === undefined) return 'inherit';
  return rate < 75 ? 'error.main' : 'success.main';
};

/* Drop this component into Attendance.jsx (e.g. just above LearnerAttendance) */
function AttendanceStats() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/learner/attendance/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Could not load attendance stats:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) return null;

  const overall = stats.overall_rate;
  const belowThreshold = overall !== null && overall < 75;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Warning banner if overall is below 75% */}
      {belowThreshold && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 2, borderRadius: '12px' }}
        >
          Your overall attendance is {overall}%, below the 75% expected.
          Try to attend more sessions to bring it up.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px' }}>
        {/* Overall headline */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: attendanceRateColor(overall) }}>
            {overall === null ? '—' : `${overall}%`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            overall attendance
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {stats.total_attended} of {stats.total_sessions} sessions attended
        </Typography>

        {/* Per-subject breakdown */}
        {stats.subjects.map((s) => (
          <Box key={s.subject_id} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {s.subject_name}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: attendanceRateColor(s.attendance_rate) }}>
                {s.attendance_rate === null ? 'No sessions yet' : `${s.attendance_rate}%`}
                {s.attendance_rate !== null && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({s.attended}/{s.sessions_run})
                  </Typography>
                )}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={s.attendance_rate ?? 0}
              color={s.attendance_rate !== null && s.attendance_rate < 75 ? 'error' : 'success'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

/* ============================================================
   LEARNER VIEW — enter a code, see your history
   ============================================================ */
function LearnerAttendance() {
  const [code, setCode] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/learner/attendance/history');
      setHistory(res.data || []);
    } catch (err) {
      console.error('Could not load attendance history:', err);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed) { setError('Please enter the code your teacher gave you.'); return; }

    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await axiosInstance.post('/learner/attendance/submit', { code: trimmed });
      setSuccess(res.data.message || "You're marked present.");
      setCode('');
      await loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit that code.');
    } finally {
      setLoading(false);
    }
  };

  const formatWhen = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Attendance</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Enter the code your teacher gives you in class to mark yourself present.
        </Typography>
      </Box>

       <AttendanceStats />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 4 }}>
        <TextField
          label="Attendance Code"
          placeholder="e.g. A35XY7"
          size="small"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          inputProps={{ maxLength: 6, style: { letterSpacing: '0.2em', fontWeight: 600 } }}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
        >
          {loading ? <CircularProgress size={22} /> : 'Mark Me Present'}
        </Button>
      </Paper>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Recent Attendance
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>When</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No attendance recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              history.map((r) => (
                <TableRow key={r.record_id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{r.subject_name}</TableCell>
                  <TableCell>{r.class_name}</TableCell>
                  <TableCell>{formatWhen(r.submitted_at)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={r.status}
                      size="small"
                      color={r.status === 'present' ? 'success' : 'warning'}
                      sx={{ textTransform: 'capitalize' }}
                    />
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