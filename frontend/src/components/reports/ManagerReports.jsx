import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
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
  CheckCircle as CheckCircleIcon,
  EventAvailable as EventAvailableIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";
import axiosInstance from "../../api/axiosInstance.js";

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const percentageValue = (value) => Number(numberValue(value).toFixed(1));
const unwrap = (response) => response?.data?.data ?? response?.data;
const asList = (value, ...keys) => {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
};

const getStudentName = (student) => {
  const name = student.name ?? student.studentName ?? student.student_name;
  if (name) return name;
  const firstName = student.firstName ?? student.first_name ?? "";
  const lastName = student.lastName ?? student.last_name ?? "";
  return `${firstName} ${lastName}`.trim();
};

const getSubject = (student) => student.subjectName ?? student.subject ?? student.subject_name ?? null;
const getClassName = (student) => student.className ?? student.class_name ?? null;
const getGrade = (student) => student.grade ?? student.grade_number ?? null;
const getAverageMark = (student) => percentageValue(
  student.averageMark ?? student.average ?? student.average_mark ?? student.mark
);
const getAttendanceRate = (student) => percentageValue(
  student.attendanceRate ?? student.attendance ?? student.attendance_rate ?? student.rate
);
const rowKey = (student, index) => student.studentId ?? student.user_id ?? student.student_id ?? index;

const performanceStatus = (mark) => {
  if (mark >= 80) return { label: "Excellent", color: "success" };
  if (mark >= 70) return { label: "Good", color: "info" };
  if (mark >= 60) return { label: "Average", color: "warning" };
  return { label: "Critical", color: "error" };
};

const attendanceStatus = (value) => {
  if (value >= 90) return { label: "Excellent", color: "success" };
  if (value >= 80) return { label: "Good", color: "info" };
  if (value >= 75) return { label: "Monitor", color: "warning" };
  return { label: "Critical", color: "error" };
};

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ p: { xs: 1.5, md: 2 } }}>{children}</Box> : null;
}

function FilterSelect({ label, value, onChange, items, allLabel }) {
  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={(event) => onChange(event.target.value)}>
        <MenuItem value="all">{allLabel}</MenuItem>
        {items.map((item) => (
          <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function MetricProgress({ value, compact = false }) {
  const safeValue = Math.min(100, Math.max(0, numberValue(value)));
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: compact ? 64 : { xs: 70, sm: 100 } }}>
        <LinearProgress variant="determinate" value={safeValue} sx={{ height: 7, borderRadius: 5 }} />
      </Box>
      <Typography variant="body2" fontWeight={700} sx={{ minWidth: 42 }}>{safeValue}%</Typography>
    </Stack>
  );
}

function KpiCard({ title, value, subtitle, icon }) {
  return (
    <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
      <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box minWidth={0}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>{title}</Typography>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2} mt={0.25}>{value}</Typography>
          </Box>
          <Box sx={{ width: 36, height: 36, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "action.hover", color: "primary.main" }}>
            {icon}
          </Box>
        </Stack>
        <Typography variant="caption" color="text.disabled" noWrap display="block" mt={0.75}>{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}

function EmptyRow({ columns, message }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} align="center">
        <Typography color="text.secondary" sx={{ py: 4 }}>{message}</Typography>
      </TableCell>
    </TableRow>
  );
}

const tableContainerSx = {
  maxHeight: "calc(100vh - 365px)",
  minHeight: 320,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
};

const headerCellSx = { fontWeight: 800, bgcolor: "background.paper", whiteSpace: "nowrap" };

export default function ManagerReports() {
  const [tab, setTab] = useState(0);
  const [overview, setOverview] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceByClass, setAttendanceByClass] = useState([]);
  const [studentsBelowAttendance, setStudentsBelowAttendance] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const [overviewResponse, performanceResponse, attendanceResponse, classResponse, belowResponse] =
          await Promise.all([
            axiosInstance.get("/manager-reports/overview"),
            axiosInstance.get("/manager-reports/student-performance"),
            axiosInstance.get("/manager-reports/attendance"),
            axiosInstance.get("/manager-reports/attendance-by-class"),
            axiosInstance.get("/manager-reports/students-below-attendance"),
          ]);

        if (!mounted) return;
        const overviewData = unwrap(overviewResponse);
        const performanceData = unwrap(performanceResponse);
        const attendanceData = unwrap(attendanceResponse);
        const classData = unwrap(classResponse);
        const belowData = unwrap(belowResponse);

        setOverview(overviewData || {});
        setStudentPerformance(asList(performanceData, "students", "data"));
        setAttendance(asList(attendanceData, "students", "attendance", "data"));
        setAttendanceByClass(asList(classData, "classes", "data"));
        setStudentsBelowAttendance(asList(belowData, "students", "data"));
      } catch (requestError) {
        if (mounted) setError(requestError?.response?.data?.message || "Unable to load centre reports.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadReports();
    return () => { mounted = false; };
  }, []);

  const reportData = useMemo(() => ({
    totalStudents: numberValue(overview?.totalStudents ?? overview?.total_students ?? overview?.students),
    totalTeachers: numberValue(overview?.totalTeachers ?? overview?.total_teachers ?? overview?.teachers),
    averageMark: percentageValue(overview?.averageMark ?? overview?.average_mark ?? overview?.avgPerformance ?? overview?.average),
    attendance: percentageValue(overview?.attendance ?? overview?.attendanceRate ?? overview?.attendance_rate),
    atRisk: numberValue(overview?.atRisk ?? overview?.at_risk ?? overview?.atRiskStudents),
    passRate: percentageValue(overview?.passRate ?? overview?.pass_rate),
  }), [overview]);

  const grades = useMemo(() => [...new Set(
    studentPerformance.map(getGrade).filter((value) => value !== null && value !== undefined).map(String)
  )].sort((a, b) => Number(a) - Number(b)), [studentPerformance]);

  const subjects = useMemo(() => [...new Set(studentPerformance.map(getSubject).filter(Boolean))].sort(), [studentPerformance]);
  const classes = useMemo(() => [...new Set(studentPerformance.map(getClassName).filter(Boolean))].sort(), [studentPerformance]);

  const matchesFilters = (student, includeSubject = true) => {
    if (selectedGrade !== "all" && String(getGrade(student)) !== String(selectedGrade)) return false;
    if (includeSubject && selectedSubject !== "all" && getSubject(student) !== selectedSubject) return false;
    if (selectedClass !== "all" && getClassName(student) !== selectedClass) return false;
    return true;
  };

  const filteredStudents = useMemo(
    () => studentPerformance.filter((student) => matchesFilters(student)).sort((a, b) => getAverageMark(b) - getAverageMark(a)),
    [studentPerformance, selectedGrade, selectedSubject, selectedClass]
  );

  const filteredAttendance = useMemo(
    () => attendance.filter((student) => {
      const subject = getSubject(student);
      const includeSubject = Boolean(subject);
      return matchesFilters(student, includeSubject);
    }).sort((a, b) => getAttendanceRate(b) - getAttendanceRate(a)),
    [attendance, selectedGrade, selectedSubject, selectedClass]
  );

  const kpis = [
    { title: "Total Students", value: reportData.totalStudents.toLocaleString(), subtitle: "Students in this centre", icon: <PeopleIcon /> },
    { title: "Total Teachers", value: reportData.totalTeachers, subtitle: "Active teachers", icon: <SchoolIcon /> },
    { title: "Average Mark", value: `${reportData.averageMark}%`, subtitle: "Centre average", icon: <TrendingUpIcon /> },
    { title: "Attendance", value: `${reportData.attendance}%`, subtitle: "Overall attendance", icon: <EventAvailableIcon /> },
    { title: "At Risk", value: reportData.atRisk, subtitle: "Requiring attention", icon: <WarningAmberIcon /> },
    { title: "Pass Rate", value: `${reportData.passRate}%`, subtitle: "Overall pass rate", icon: <CheckCircleIcon /> },
  ];

  const filters = (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
      <FilterSelect label="Grade" value={selectedGrade} onChange={setSelectedGrade} allLabel="All Grades"
        items={grades.map((grade) => ({ value: grade, label: `Grade ${grade}` }))} />
      <FilterSelect label="Subject" value={selectedSubject} onChange={setSelectedSubject} allLabel="All Subjects"
        items={subjects.map((subject) => ({ value: subject, label: subject }))} />
      <FilterSelect label="Class" value={selectedClass} onChange={setSelectedClass} allLabel="All Classes"
        items={classes.map((className) => ({ value: className, label: className }))} />
    </Stack>
  );

  if (loading) {
    return (
      <Box minHeight={400} display="grid" sx={{ placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading centre reports...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, maxWidth: 1600, mx: "auto" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={1} mb={1.75}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Centre Reports</Typography>
          <Typography variant="body2" color="text.secondary">Performance, attendance and learners requiring intervention.</Typography>
        </Box>
        <Chip label={`${reportData.atRisk} learners at risk`} color={reportData.atRisk ? "warning" : "success"} variant="outlined" />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

      <Grid container spacing={1.25} mb={1.75}>
        {kpis.map((kpi) => (
          <Grid item xs={6} md={4} lg={2} key={kpi.title}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, borderBottom: "1px solid", borderColor: "divider", minHeight: 46 }}
        >
          <Tab label={`Performance (${filteredStudents.length})`} />
          <Tab label={`Attendance (${filteredAttendance.length})`} />
          <Tab label={`At Risk (${studentsBelowAttendance.length})`} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={1.25} mb={1.5}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Student Performance</Typography>
              <Typography variant="caption" color="text.secondary">Ranked by average mark.</Typography>
            </Box>
            {filters}
          </Stack>

          <TableContainer sx={tableContainerSx}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {["Rank", "Student", "Grade", "Subject", "Class", "Average Mark", "Status"].map((heading) => (
                    <TableCell key={heading} sx={headerCellSx}>{heading}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student, index) => {
                  const mark = getAverageMark(student);
                  const status = performanceStatus(mark);
                  return (
                    <TableRow hover key={rowKey(student, index)}>
                      <TableCell><Typography fontWeight={800}>{index + 1}</Typography></TableCell>
                      <TableCell><Typography fontWeight={650}>{getStudentName(student) || "Unknown"}</Typography></TableCell>
                      <TableCell>{getGrade(student) ?? "-"}</TableCell>
                      <TableCell>{getSubject(student) ?? "-"}</TableCell>
                      <TableCell>{getClassName(student) ?? "-"}</TableCell>
                      <TableCell><MetricProgress value={mark} /></TableCell>
                      <TableCell><Chip label={status.label} color={status.color} size="small" /></TableCell>
                    </TableRow>
                  );
                })}
                {!filteredStudents.length && <EmptyRow columns={7} message="No student performance data available." />}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={1.25} mb={1.5}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Attendance Analysis</Typography>
              <Typography variant="caption" color="text.secondary">Overall, class and individual learner attendance.</Typography>
            </Box>
            {filters}
          </Stack>

          <Grid container spacing={1.25} mb={1.5}>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">Overall Attendance</Typography>
                      <Typography variant="h3" fontWeight={850} color="primary.main">{reportData.attendance}%</Typography>
                    </Box>
                    <EventAvailableIcon color="primary" sx={{ fontSize: 36 }} />
                  </Stack>
                  <LinearProgress variant="determinate" value={Math.min(100, reportData.attendance)} sx={{ mt: 1.25, height: 8, borderRadius: 5 }} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={9}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="subtitle2" fontWeight={800} mb={1}>Attendance by Class</Typography>
                  <Box sx={{ maxHeight: 125, overflowY: "auto", pr: 0.5 }}>
                    <Grid container spacing={1.25}>
                      {attendanceByClass.map((item, index) => {
                        const value = getAttendanceRate(item);
                        const className = getClassName(item) ?? `Class ${index + 1}`;
                        return (
                          <Grid item xs={12} sm={6} lg={4} key={item.classId ?? item.class_id ?? className}>
                            <Stack direction="row" justifyContent="space-between" mb={0.25}>
                              <Typography variant="caption" fontWeight={700} noWrap>{className}</Typography>
                              <Typography variant="caption" fontWeight={800}>{value}%</Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, value))} sx={{ height: 7, borderRadius: 5 }} />
                          </Grid>
                        );
                      })}
                      {!attendanceByClass.length && (
                        <Grid item xs={12}><Typography variant="body2" color="text.secondary">No class attendance data available.</Typography></Grid>
                      )}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer sx={{ ...tableContainerSx, maxHeight: "calc(100vh - 545px)", minHeight: 260 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {["Rank", "Student", "Grade", "Class", "Attendance", "Status"].map((heading) => (
                    <TableCell key={heading} sx={headerCellSx}>{heading}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAttendance.map((student, index) => {
                  const value = getAttendanceRate(student);
                  const status = attendanceStatus(value);
                  return (
                    <TableRow hover key={rowKey(student, index)}>
                      <TableCell><Typography fontWeight={800}>{index + 1}</Typography></TableCell>
                      <TableCell><Typography fontWeight={650}>{getStudentName(student) || "Unknown"}</Typography></TableCell>
                      <TableCell>{getGrade(student) ?? "-"}</TableCell>
                      <TableCell>{getClassName(student) ?? "-"}</TableCell>
                      <TableCell><MetricProgress value={value} /></TableCell>
                      <TableCell><Chip label={status.label} color={status.color} size="small" /></TableCell>
                    </TableRow>
                  );
                })}
                {!filteredAttendance.length && <EmptyRow columns={6} message="No attendance data available." />}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Students Below Attendance Threshold</Typography>
              <Typography variant="caption" color="text.secondary">Learners who need attendance intervention.</Typography>
            </Box>
            <Chip label={`${studentsBelowAttendance.length} Students`} color="warning" />
          </Stack>

          <TableContainer sx={tableContainerSx}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {["Student", "Grade", "Class", "Attendance", "Status"].map((heading) => (
                    <TableCell key={heading} sx={headerCellSx}>{heading}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsBelowAttendance.map((student, index) => {
                  const value = getAttendanceRate(student);
                  return (
                    <TableRow hover key={rowKey(student, index)}>
                      <TableCell><Typography fontWeight={650}>{getStudentName(student) || "Unknown"}</Typography></TableCell>
                      <TableCell>{getGrade(student) ?? "-"}</TableCell>
                      <TableCell>{getClassName(student) ?? "-"}</TableCell>
                      <TableCell><MetricProgress value={value} compact /></TableCell>
                      <TableCell><Chip label={student.status || "Below Threshold"} size="small" color="error" /></TableCell>
                    </TableRow>
                  );
                })}
                {!studentsBelowAttendance.length && <EmptyRow columns={5} message="No students are currently below the attendance threshold." />}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
}
