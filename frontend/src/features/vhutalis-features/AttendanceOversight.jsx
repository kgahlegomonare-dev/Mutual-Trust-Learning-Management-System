import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';

/* Colour a rate: red below 60, amber 60-79, green 80+ */
const rateColor = (rate) => {
  if (rate === null || rate === undefined) return 'default';
  if (rate < 60) return 'error';
  if (rate < 80) return 'warning';
  return 'success';
};

export default function AttendanceOversight() {
  const { user } = useAuth();
  const role = (user?.user_role || '').toLowerCase();
  const allowed = role.includes('admin') || role.includes('manager');

  // null = viewing the overview; otherwise the class we've drilled into
  const [selectedClass, setSelectedClass] = useState(null);

  if (!allowed) {
    return (
      <Box sx={{ p: 3, maxWidth: '1100px', margin: '0 auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Attendance Oversight</Typography>
        <Typography variant="body2" color="text.secondary">
          This page is for centre managers and administrators.
        </Typography>
      </Box>
    );
  }

  return selectedClass ? (
    <ClassDetail
      classInfo={selectedClass}
      onBack={() => setSelectedClass(null)}
    />
  ) : (
    <CentreOverview onSelectClass={setSelectedClass} />
  );
}

/* ============================================================
   LEVEL 1 — centre overview: headline stats + classes
   ============================================================ */
function CentreOverview({ onSelectClass }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/oversight/attendance/overview');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load the attendance overview.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1100px', margin: '0 auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Attendance Oversight</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          How attendance is tracking across your centre. Classes with the lowest rates appear first.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Headline stats */}
      {data?.summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <StatCard
            label="Overall attendance"
            value={`${data.summary.overall_rate}%`}
            accent={rateColor(data.summary.overall_rate)}
          />
          <StatCard label="Sessions run" value={data.summary.sessions_run} />
          <StatCard label="Classes tracked" value={data.summary.classes_tracked} />
          <StatCard
            label="Attendances recorded"
            value={`${data.summary.total_attended} / ${data.summary.total_expected}`}
          />
        </Box>
      )}

      {/* Per-class breakdown */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Classes
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Sessions</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Attended</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '25%' }}>Attendance rate</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.classes || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No attendance sessions have been run in this centre yet.
                </TableCell>
              </TableRow>
            ) : (
              data.classes.map((c) => (
                <TableRow key={c.class_id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{c.class_name}</TableCell>
                  <TableCell align="center">{c.sessions_run}</TableCell>
                  <TableCell align="center">
                    {c.total_attended} / {c.total_expected}
                  </TableCell>
                  <TableCell>
                    <RateBar rate={c.attendance_rate} />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSelectClass({ class_id: c.class_id, class_name: c.class_name })}
                    >
                      View
                    </Button>
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
   LEVEL 2 — one class: its sessions + its learners' rates
   ============================================================ */
function ClassDetail({ classInfo, onBack }) {
  const [data, setData] = useState(null);
  const [openRoster, setOpenRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(
        `/oversight/attendance/classes/${classInfo.class_id}`
      );
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load that class.');
    } finally {
      setLoading(false);
    }
  }, [classInfo.class_id]);

  useEffect(() => { load(); }, [load]);

  const formatWhen = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1100px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={onBack}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{classInfo.class_name}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Sessions run and how each learner is tracking.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Learners and their rates */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Learners
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', mb: 4 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Learner</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Number</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Attended</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '30%' }}>Attendance rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.learners || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No learners in this class.
                </TableCell>
              </TableRow>
            ) : (
              data.learners.map((l) => (
                <TableRow key={l.learner_id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {l.first_name} {l.last_name}
                  </TableCell>
                  <TableCell>{l.learner_number}</TableCell>
                  <TableCell align="center">
                    {l.attended} / {l.expected}
                  </TableCell>
                  <TableCell>
                    {l.attendance_rate === null ? (
                      <Typography variant="body2" color="text.secondary">
                        No sessions yet
                      </Typography>
                    ) : (
                      <RateBar rate={l.attendance_rate} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Sessions run for this class */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Sessions
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Teacher</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>When</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Present</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.sessions || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No sessions have been run for this class.
                </TableCell>
              </TableRow>
            ) : (
              data.sessions.map((s) => (
                <TableRow key={s.attendance_id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {s.subject_name}
                    {s.is_live && (
                      <Chip label="LIVE" size="small" color="success"
                        sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    {s.teacher_first_name} {s.teacher_last_name}
                  </TableCell>
                  <TableCell>{formatWhen(s.created_at)}</TableCell>
                  <TableCell align="center">
                    {s.present_count} / {s.roster_count}
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

/* ---------- small shared bits ---------- */

function StatCard({ label, value, accent }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: '12px', minWidth: 170, flex: '1 1 170px' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: accent && accent !== 'default' ? `${accent}.main` : 'text.primary',
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function RateBar({ rate }) {
  const color = rateColor(rate);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(rate ?? 0, 100)}
        color={color === 'default' ? 'primary' : color}
        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
      />
      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 38, textAlign: 'right' }}>
        {rate}%
      </Typography>
    </Box>
  );
}