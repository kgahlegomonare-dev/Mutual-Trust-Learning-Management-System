import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';

const bandColor = (band) =>
  band === 'high' ? 'error' : band === 'medium' ? 'warning' : 'success';

const bandLabel = (band) =>
  band === 'high' ? 'High risk' : band === 'medium' ? 'Medium risk' : 'Low risk';

/* One expandable row: summary line + a hidden breakdown */
function LearnerRow({ learner }) {
  const [open, setOpen] = useState(false);
  const b = learner.breakdown;

  const components = [
    { key: 'attendance', label: 'Attendance' },
    { key: 'participation', label: 'Assessment participation' },
    { key: 'performance', label: 'Assessment performance' },
    { key: 'engagement', label: 'Material engagement' },
  ];

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <TableCell>
          <IconButton size="small">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 500 }}>{learner.name}</TableCell>
        <TableCell>{learner.class_name}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700 }}>{learner.total}<Typography component="span" variant="caption" color="text.secondary"> / 70</Typography></TableCell>
        <TableCell align="center">
          <Chip label={bandLabel(learner.band)} color={bandColor(learner.band)} size="small" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0, border: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Why {learner.name.split(' ')[0]} is flagged
              </Typography>
              {components.map(({ key, label }) => {
                const c = b[key];
                const pct = Math.round((c.points / c.max) * 100);
                // more points = worse, so colour the bar red when high
                const barColor = pct >= 60 ? 'error' : pct >= 30 ? 'warning' : 'success';
                return (
                  <Box key={key} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.note} — {c.points}/{c.max}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      color={barColor}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function FlaggingTable({ learners }) {
  const [filter, setFilter] = useState('mh'); // 'mh' = medium+high, 'high', 'all'

  const filtered = learners.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'high') return l.band === 'high';
    return l.band === 'high' || l.band === 'medium'; // 'mh'
  });

  const counts = {
    high: learners.filter((l) => l.band === 'high').length,
    medium: learners.filter((l) => l.band === 'medium').length,
    low: learners.filter((l) => l.band === 'low').length,
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          size="small"
          onChange={(e, v) => v && setFilter(v)}
        >
          <ToggleButton value="mh" sx={{ textTransform: 'none' }}>Medium + High</ToggleButton>
          <ToggleButton value="high" sx={{ textTransform: 'none' }}>High only</ToggleButton>
          <ToggleButton value="all" sx={{ textTransform: 'none' }}>All</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${counts.high} high`} color="error" size="small" variant="outlined" />
          <Chip label={`${counts.medium} medium`} color="warning" size="small" variant="outlined" />
          <Chip label={`${counts.low} low`} color="success" size="small" variant="outlined" />
        </Box>
      </Box>

      {filtered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No learners in this band.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: 'action.hover' }}>
              <TableRow>
                <TableCell />
                <TableCell sx={{ fontWeight: 600 }}>Learner</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Risk score</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Band</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((l) => <LearnerRow key={l.learner_id} learner={l} />)}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}

export default function Flagging() {
  const { user } = useAuth();
  const role = (user?.user_role || '').toLowerCase();

  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const endpoint =
    role === 'teacher' ? '/teacher/flagging' : '/oversight/flagging';

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoint);
      setLearners(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load flagging data.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Flagging</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Learners who may need support, based on attendance, quizzes, and material engagement.
          Click a learner to see why.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <FlaggingTable learners={learners} />
    </Box>
  );
}
