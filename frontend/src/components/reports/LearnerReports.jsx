import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarMonthIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as EmojiEventsIcon,
  EventAvailable as EventAvailableIcon,
  MenuBook as MenuBookIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  WarningAmber as WarningIcon,
} from "@mui/icons-material";
import axiosInstance from "../../api/axiosInstance.js";

const REPORT_BASE = "/learner-reports";
const panelStyle = { border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" };
const tableStyle = { maxHeight: 390 };

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percentage(value) {
  return `${numberValue(value).toFixed(1)}%`;
}

function unwrap(response) {
  const firstLevel = response?.data ?? response;
  return firstLevel?.data ?? firstLevel ?? {};
}

function unwrapArray(response) {
  const data = unwrap(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatDate(date) {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatus(mark) {
  const value = numberValue(mark);
  if (value >= 75) return "Excellent";
  if (value >= 60) return "Good";
  if (value >= 50) return "Satisfactory";
  return "Needs Improvement";
}

function getStatusColor(mark) {
  const value = numberValue(mark);
  if (value >= 75) return "success";
  if (value >= 60) return "info";
  if (value >= 50) return "warning";
  return "error";
}

export default function LearnerReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [learnerOverview, setLearnerOverview] = useState({
    overallAverage: 0,
    termAverage: 0,
    attendance: 0,
    assessmentsCompleted: 0,
    assessmentsOutstanding: 0,
    passRate: 0,
  });
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ overall: 0, present: 0, absent: 0, late: 0, totalClasses: 0 });
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("term");
  const [performanceTrends, setPerformanceTrends] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewResponse, subjectResponse, assessmentResponse, attendanceResponse, upcomingResponse] = await Promise.all([
        axiosInstance.get(`${REPORT_BASE}/overview`),
        axiosInstance.get(`${REPORT_BASE}/subject-performance`),
        axiosInstance.get(`${REPORT_BASE}/assessment-results`),
        axiosInstance.get(`${REPORT_BASE}/attendance`),
        axiosInstance.get(`${REPORT_BASE}/upcoming-assessments`),
      ]);

      const overview = unwrap(overviewResponse);
      setLearnerOverview({
        overallAverage: numberValue(overview.overallAverage ?? overview.overall_average),
        termAverage: numberValue(overview.termAverage ?? overview.term_average),
        attendance: numberValue(overview.attendance ?? overview.attendanceRate ?? overview.attendance_rate),
        assessmentsCompleted: numberValue(overview.assessmentsCompleted ?? overview.assessments_completed),
        assessmentsOutstanding: numberValue(overview.assessmentsOutstanding ?? overview.assessmentsOutstandingCount ?? overview.assessments_outstanding),
        passRate: numberValue(overview.passRate ?? overview.pass_rate),
      });

      const subjects = unwrapArray(subjectResponse).map((item) => ({
        subject: item.subject ?? item.subject_name ?? "Unknown Subject",
        average: numberValue(item.average ?? item.average_mark ?? item.avg_mark),
        highest: numberValue(item.highest ?? item.highest_mark),
        lowest: numberValue(item.lowest ?? item.lowest_mark),
        passRate: numberValue(item.passRate ?? item.pass_rate),
        trend: numberValue(item.trend ?? item.trend_percentage ?? item.change),
      }));
      setSubjectPerformance(subjects);
      setSelectedSubject((current) => current || subjects[0]?.subject || "");

      setAssessmentResults(
        unwrapArray(assessmentResponse).map((item, index) => {
          const mark = numberValue(item.mark ?? item.score ?? item.points_awarded);
          const total = numberValue(item.total ?? item.maxScore ?? item.max_score);
          const suppliedPercentage = numberValue(item.percentage ?? item.percent);
          const calculatedPercentage = suppliedPercentage || (total > 0 ? (mark / total) * 100 : 0);
          return {
            id: item.id ?? item.submission_id ?? index,
            assessment: item.assessment ?? item.assessment_title ?? item.title ?? "Assessment",
            subject: item.subject ?? item.subject_name ?? "Unknown Subject",
            date: item.date ?? item.submitted_at ?? item.created_at,
            mark,
            total,
            percentage: calculatedPercentage,
            status: item.status_label ?? item.result ?? item.status ?? getStatus(calculatedPercentage),
          };
        })
      );

      const attendance = unwrap(attendanceResponse);
      setAttendanceData({
        overall: numberValue(attendance.overall ?? attendance.attendance ?? attendance.attendanceRate ?? attendance.attendance_rate),
        present: numberValue(attendance.present),
        absent: numberValue(attendance.absent),
        late: numberValue(attendance.late),
        totalClasses: numberValue(attendance.totalClasses ?? attendance.total_classes),
      });

      const attendanceTrendData = attendance.trend ?? attendance.attendanceTrend ?? attendance.attendance_trend ?? [];
      setAttendanceTrend(
        Array.isArray(attendanceTrendData)
          ? attendanceTrendData.map((item) =>
              typeof item === "number"
                ? { label: "", value: item }
                : {
                    label: item.label ?? item.period ?? item.date ?? item.week ?? "",
                    value: numberValue(item.value ?? item.attendance ?? item.rate),
                  }
            )
          : []
      );

      setUpcomingAssessments(
        unwrapArray(upcomingResponse).map((item, index) => ({
          id: item.id ?? index,
          title: item.title ?? item.assessment ?? item.assessment_title ?? "Assessment",
          subject: item.subject ?? item.subject_name ?? "Unknown Subject",
          date: item.date ?? item.available_until ?? item.available_from ?? item.created_at,
          type: item.type ?? "Assessment",
          status: item.status ?? "Upcoming",
        }))
      );
    } catch (requestError) {
      console.error("Failed to load learner report:", requestError);
      setError(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          requestError?.message ||
          "Unable to load your report."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setPerformanceTrends([]);
      return;
    }

    let active = true;
    const loadPerformanceTrend = async () => {
      setTrendLoading(true);
      try {
        const response = await axiosInstance.get(`${REPORT_BASE}/performance-trends`, {
          params: { period: selectedPeriod, subject: selectedSubject },
        });
        const trends = unwrap(response);
        const normalized = Array.isArray(trends)
          ? trends.map((item) => ({
              label: item.label ?? item.period ?? item.assessment ?? item.date ?? "",
              value: numberValue(item.value ?? item.average ?? item.percentage ?? item.mark),
            }))
          : (trends.data ?? trends.values ?? trends.percentages ?? []).map((value, index) => ({
              label: (trends.labels ?? [])[index] ?? `Assessment ${index + 1}`,
              value: numberValue(value),
            }));
        if (active) setPerformanceTrends(normalized);
      } catch (requestError) {
        console.error("Failed to load performance trend:", requestError);
        if (active) setPerformanceTrends([]);
      } finally {
        if (active) setTrendLoading(false);
      }
    };

    loadPerformanceTrend();
    return () => {
      active = false;
    };
  }, [selectedSubject, selectedPeriod]);

  const subjects = useMemo(() => subjectPerformance.map((item) => item.subject), [subjectPerformance]);
  const selectedSubjectData = useMemo(
    () => subjectPerformance.find((subject) => subject.subject === selectedSubject),
    [subjectPerformance, selectedSubject]
  );
  const strengths = useMemo(
    () => [...subjectPerformance].filter((subject) => subject.average >= 75).sort((a, b) => b.average - a.average),
    [subjectPerformance]
  );
  const attentionAreas = useMemo(
    () => [...subjectPerformance].filter((subject) => subject.average < 70 || subject.trend < 0).sort((a, b) => a.average - b.average),
    [subjectPerformance]
  );

  const kpis = [
    { title: "Overall Average", value: percentage(learnerOverview.overallAverage), icon: <SchoolIcon /> },
    { title: "Term Average", value: percentage(learnerOverview.termAverage), icon: <TrendingUpIcon /> },
    { title: "Attendance", value: percentage(learnerOverview.attendance), icon: <EventAvailableIcon /> },
    { title: "Completed", value: learnerOverview.assessmentsCompleted, icon: <CheckCircleIcon /> },
    { title: "Outstanding", value: learnerOverview.assessmentsOutstanding, icon: <AssignmentIcon /> },
    { title: "Pass Rate", value: percentage(learnerOverview.passRate), icon: <EmojiEventsIcon /> },
  ];

  if (loading) {
    return (
      <Box sx={{ minHeight: 400, display: "grid", placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading your academic report...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: "auto" }}>
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadReport}>Try Again</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, maxWidth: 1600, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>My Academic Report</Typography>
          <Typography variant="body2" color="text.secondary">Track your performance, assessments, attendance and upcoming work.</Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={loadReport}>Refresh</Button>
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {kpis.map((kpi) => (
          <Grid item xs={6} md={4} lg={2} key={kpi.title}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <Alert severity={learnerOverview.termAverage >= 70 ? "success" : "warning"} sx={{ mb: 2, borderRadius: 2, py: 0 }}>
        Current term average: <strong>{percentage(learnerOverview.termAverage)}</strong> · Attendance: <strong>{percentage(learnerOverview.attendance)}</strong>
      </Alert>

      <Paper elevation={0} sx={panelStyle}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, borderBottom: "1px solid", borderColor: "divider", minHeight: 52 }}
        >
          <Tab icon={<MenuBookIcon />} iconPosition="start" label="Performance" />
          <Tab icon={<AssessmentIcon />} iconPosition="start" label={`Results (${assessmentResults.length})`} />
          <Tab icon={<EventAvailableIcon />} iconPosition="start" label="Attendance" />
          <Tab icon={<CalendarMonthIcon />} iconPosition="start" label={`Upcoming (${upcomingAssessments.length})`} />
        </Tabs>

        <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
          {activeTab === 0 && (
            <PerformanceTab
              subjectPerformance={subjectPerformance}
              subjects={subjects}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              performanceTrends={performanceTrends}
              trendLoading={trendLoading}
              selectedSubjectData={selectedSubjectData}
              strengths={strengths}
              attentionAreas={attentionAreas}
            />
          )}
          {activeTab === 1 && <ResultsTab results={assessmentResults} />}
          {activeTab === 2 && <AttendanceTab attendance={attendanceData} trend={attendanceTrend} />}
          {activeTab === 3 && <UpcomingTab assessments={upcomingAssessments} />}
        </Box>
      </Paper>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
        <AccessTimeIcon fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary">Report data is loaded from your current academic records.</Typography>
      </Stack>
    </Box>
  );
}

function KpiCard({ title, value, icon }) {
  return (
    <Card elevation={0} sx={{ ...panelStyle, height: "100%" }}>
      <CardContent sx={{ p: "14px !important" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
            <Typography variant="h5" fontWeight={800}>{value}</Typography>
          </Box>
          <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: "action.hover", color: "primary.main" }}>{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function PerformanceTab({
  subjectPerformance,
  subjects,
  selectedSubject,
  setSelectedSubject,
  selectedPeriod,
  setSelectedPeriod,
  performanceTrends,
  trendLoading,
  selectedSubjectData,
  strengths,
  attentionAreas,
}) {
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Section title="Subject Performance" subtitle="Your results across all enrolled subjects.">
            <TableContainer sx={{ ...tableStyle, maxHeight: 330 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell><strong>Average</strong></TableCell>
                    <TableCell><strong>Highest</strong></TableCell>
                    <TableCell><strong>Lowest</strong></TableCell>
                    <TableCell><strong>Pass Rate</strong></TableCell>
                    <TableCell><strong>Progress</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjectPerformance.map((subject) => (
                    <TableRow key={subject.subject} hover>
                      <TableCell><Typography variant="body2" fontWeight={700}>{subject.subject}</Typography></TableCell>
                      <TableCell><strong>{percentage(subject.average)}</strong></TableCell>
                      <TableCell>{percentage(subject.highest)}</TableCell>
                      <TableCell>{percentage(subject.lowest)}</TableCell>
                      <TableCell><MetricProgress value={subject.passRate} /></TableCell>
                      <TableCell><TrendChip value={subject.trend} /></TableCell>
                    </TableRow>
                  ))}
                  {!subjectPerformance.length && <EmptyRow columns={6} message="No subject performance data available." />}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Section title="Performance Trend" subtitle="Filter by subject and reporting period.">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ p: 1.5, pb: 0 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select value={selectedSubject} label="Subject" onChange={(event) => setSelectedSubject(event.target.value)}>
                  {subjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Period</InputLabel>
                <Select value={selectedPeriod} label="Period" onChange={(event) => setSelectedPeriod(event.target.value)}>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                  <MenuItem value="term">Current Term</MenuItem>
                  <MenuItem value="year">Academic Year</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Box sx={{ p: 1.5, minHeight: 250, display: "grid", placeItems: "center" }}>
              {trendLoading ? <CircularProgress size={30} /> : <PerformanceChart data={performanceTrends} />}
            </Box>
            {selectedSubjectData && (
              <Stack direction="row" justifyContent="space-around" sx={{ px: 1.5, pb: 1.5 }}>
                <MiniMetric label="Average" value={percentage(selectedSubjectData.average)} />
                <MiniMetric label="Highest" value={percentage(selectedSubjectData.highest)} />
                <MiniMetric label="Pass Rate" value={percentage(selectedSubjectData.passRate)} />
              </Stack>
            )}
          </Section>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <InsightPanel title="Your Strengths" icon={<EmojiEventsIcon color="success" />} items={strengths} empty="No subjects currently meet the strength threshold." />
        </Grid>
        <Grid item xs={12} md={6}>
          <InsightPanel title="Areas to Improve" icon={<TrendingDownIcon color="warning" />} items={attentionAreas} empty="No immediate areas of concern." warning />
        </Grid>
      </Grid>
    </Stack>
  );
}

function ResultsTab({ results }) {
  return (
    <Section title="Assessment Results" subtitle="Your tests, quizzes, exams and assignments.">
      <TableContainer sx={tableStyle}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Assessment</strong></TableCell>
              <TableCell><strong>Subject</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Mark</strong></TableCell>
              <TableCell><strong>Percentage</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <TableRow hover key={result.id}>
                <TableCell><Typography variant="body2" fontWeight={700}>{result.assessment}</Typography></TableCell>
                <TableCell>{result.subject}</TableCell>
                <TableCell>{formatDate(result.date)}</TableCell>
                <TableCell>{result.total > 0 ? `${result.mark}/${result.total}` : result.mark}</TableCell>
                <TableCell><MetricProgress value={result.percentage} /></TableCell>
                <TableCell><Chip label={result.status || getStatus(result.percentage)} size="small" color={getStatusColor(result.percentage)} /></TableCell>
              </TableRow>
            ))}
            {!results.length && <EmptyRow columns={6} message="No assessment results available." />}
          </TableBody>
        </Table>
      </TableContainer>
    </Section>
  );
}

function AttendanceTab({ attendance, trend }) {
  const cards = [
    { title: "Overall", value: percentage(attendance.overall), icon: <EventAvailableIcon /> },
    { title: "Present", value: attendance.present, icon: <CheckCircleIcon /> },
    { title: "Absent", value: attendance.absent, icon: <WarningIcon /> },
    { title: "Late", value: attendance.late, icon: <AccessTimeIcon /> },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={5}>
        <Section title="Attendance Summary" subtitle={`${attendance.totalClasses} recorded class sessions.`}>
          <Grid container spacing={1.5} sx={{ p: 1.5 }}>
            {cards.map((card) => (
              <Grid item xs={6} key={card.title}>
                <KpiCard {...card} />
              </Grid>
            ))}
          </Grid>
        </Section>
      </Grid>
      <Grid item xs={12} lg={7}>
        <Section title="Attendance Trend" subtitle="Attendance rate across recorded periods.">
          <Box sx={{ p: 2, minHeight: 300 }}><PerformanceChart data={trend} suffix="%" /></Box>
        </Section>
      </Grid>
    </Grid>
  );
}

function UpcomingTab({ assessments }) {
  return (
    <Section title="Upcoming Assessments" subtitle="Assessments that are scheduled next.">
      <TableContainer sx={tableStyle}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Assessment</strong></TableCell>
              <TableCell><strong>Subject</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow hover key={assessment.id}>
                <TableCell><Typography variant="body2" fontWeight={700}>{assessment.title}</Typography></TableCell>
                <TableCell>{assessment.subject}</TableCell>
                <TableCell><Chip label={assessment.type} size="small" variant="outlined" /></TableCell>
                <TableCell>{formatDate(assessment.date)}</TableCell>
                <TableCell><Chip label={assessment.status || "Upcoming"} size="small" color="info" /></TableCell>
              </TableRow>
            ))}
            {!assessments.length && <EmptyRow columns={5} message="No upcoming assessments." />}
          </TableBody>
        </Table>
      </TableContainer>
    </Section>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <Paper elevation={0} sx={{ ...panelStyle, height: "100%" }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {children}
    </Paper>
  );
}

function InsightPanel({ title, icon, items, empty, warning = false }) {
  return (
    <Section title={title}>
      <Stack spacing={1.25} sx={{ p: 1.5, maxHeight: 170, overflowY: "auto" }}>
        {items.length ? items.map((subject) => (
          <Stack key={subject.subject} direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">{icon}<Typography variant="body2" fontWeight={600}>{subject.subject}</Typography></Stack>
            <Chip label={percentage(subject.average)} size="small" color={warning ? "warning" : "success"} variant={warning ? "filled" : "outlined"} />
          </Stack>
        )) : <Typography variant="body2" color="text.secondary">{empty}</Typography>}
      </Stack>
    </Section>
  );
}

function MiniMetric({ label, value }) {
  return (
    <Box textAlign="center">
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={800}>{value}</Typography>
    </Box>
  );
}

function EmptyRow({ columns, message }) {
  return <TableRow><TableCell colSpan={columns} align="center" sx={{ py: 5, color: "text.secondary" }}>{message}</TableCell></TableRow>;
}

function MetricProgress({ value }) {
  const safeValue = Math.min(Math.max(numberValue(value), 0), 100);
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 65 }}><LinearProgress variant="determinate" value={safeValue} sx={{ height: 6, borderRadius: 5 }} /></Box>
      <Typography variant="caption" fontWeight={700}>{percentage(value)}</Typography>
    </Stack>
  );
}

function TrendChip({ value }) {
  const trend = numberValue(value);
  if (trend > 0) return <Chip icon={<TrendingUpIcon />} label={`+${trend.toFixed(1)}%`} color="success" size="small" />;
  if (trend < 0) return <Chip icon={<TrendingDownIcon />} label={`${trend.toFixed(1)}%`} color="error" size="small" />;
  return <Chip label="No change" size="small" variant="outlined" />;
}

function PerformanceChart({ data, suffix = "" }) {
  if (!data?.length) {
    return <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}><Typography color="text.secondary">No data available.</Typography></Box>;
  }

  const width = 900;
  const height = 250;
  const left = 55;
  const right = 30;
  const top = 30;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const values = data.map((item) => numberValue(item.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const denominator = values.length > 1 ? values.length - 1 : 1;
  const points = values.map((value, index) => ({
    x: left + (index / denominator) * chartWidth,
    y: top + chartHeight - ((value - min) / range) * chartHeight,
    value,
    label: data[index]?.label || "",
  }));

  return (
    <Box sx={{ width: "100%", overflowX: "auto", color: "primary.main" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="250" style={{ minWidth: 560 }}>
        {[0, 1, 2, 3, 4].map((line) => {
          const y = top + (line / 4) * chartHeight;
          return <line key={line} x1={left} x2={width - right} y1={y} y2={y} stroke="currentColor" opacity="0.1" />;
        })}
        <text x="5" y={top} fontSize="12" fill="currentColor">{max.toFixed(1)}{suffix}</text>
        <text x="5" y={height - bottom} fontSize="12" fill="currentColor">{min.toFixed(1)}{suffix}</text>
        <polyline fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="currentColor" />
            <text x={point.x} y={point.y - 11} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">{point.value.toFixed(1)}{suffix}</text>
            {point.label && <text x={point.x} y={height - 12} textAnchor="middle" fontSize="11" fill="currentColor">{point.label}</text>}
          </g>
        ))}
      </svg>
    </Box>
  );
}
