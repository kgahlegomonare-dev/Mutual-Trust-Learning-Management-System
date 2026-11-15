import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
} from "@mui/material";

import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  EventAvailable as AttendanceIcon,
  WarningAmber as WarningIcon,
  EmojiEvents as PassIcon,
  Class as ClassIcon,
  MenuBook as SubjectIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import axiosInstance from "../../api/axiosInstance.js";

const API_PREFIX = "/teacher-reports";

const formatNumber = (value, decimals = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(decimals);
};


/*
|--------------------------------------------------------------------------
| Unwraps API responses defensively. Handles the {success, data} envelope
| and guards against non-array shapes so a single unexpected response
| never throws during render (which would otherwise crash the whole app,
| taking the sidebar/layout down with it since nothing here is wrapped
| in an error boundary).
|--------------------------------------------------------------------------
*/

const unwrap = (res) => {
  const level1 = res?.data ?? res;
  return level1?.data ?? level1 ?? null;
};

const unwrapArray = (res) => {
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};


const getInitial = (name) => {
  // Default parameters only cover `undefined`, not `null` or other
  // falsy values — a null/empty name from the API would otherwise
  // throw here and crash the whole render.
  const safeName = typeof name === "string" ? name : "";

  if (!safeName.trim()) {
    return "?";
  }

  return safeName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};


function KpiCard({
  title,
  value,
  subtitle,
  icon,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
            >
              {value}
            </Typography>

            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "action.hover",
              color: "primary.main",
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}


function PerformanceBars({ data }) {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: "center",
        }}
      >
        <Typography color="text.secondary">
          No performance data available.
        </Typography>
      </Box>
    );
  }

  const max = Math.max(
    ...safeData.map((item) => Number(item?.average || 0)),
    100
  );

  return (
    <Stack spacing={2.5}>
      {safeData.map((item, index) => {
        const value = Number(item?.average || 0);

        return (
          <Box key={item?.subjectId || item?.classId || index}>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 0.7 }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
              >
                {item?.subject || item?.className || "Unknown"}
              </Typography>

              <Typography
                variant="body2"
                fontWeight={700}
              >
                {formatNumber(value)}%
              </Typography>
            </Stack>

            <Box
              sx={{
                height: 12,
                borderRadius: 10,
                backgroundColor: "action.hover",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${Math.min(
                    (value / max) * 100,
                    100
                  )}%`,
                  backgroundColor: "primary.main",
                  borderRadius: 10,
                  transition: "width 0.4s ease",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}


function TrendChart({
  data,
  valueKey,
  emptyMessage,
}) {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: "center",
        }}
      >
        <Typography color="text.secondary">
          {emptyMessage || "No trend data available."}
        </Typography>
      </Box>
    );
  }

  const width = 900;
  const height = 300;
  const padding = 45;

  const values = safeData.map((item) =>
    Number(item?.[valueKey] || 0)
  );

  const maxValue = Math.max(
    ...values,
    100
  );

  const minValue = Math.min(
    ...values,
    0
  );

  const range =
    maxValue - minValue === 0
      ? 100
      : maxValue - minValue;

  const points = safeData.map((item, index) => {
    const x =
      safeData.length === 1
        ? width / 2
        : padding +
          (index / (safeData.length - 1)) *
            (width - padding * 2);

    const value = Number(item?.[valueKey] || 0);

    const y =
      height -
      padding -
      ((value - minValue) / range) *
        (height - padding * 2);

    return {
      x,
      y,
      value,
      label: item?.label ?? "",
    };
  });

  const polyline = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="300"
      >
        {[0, 25, 50, 75, 100].map(
          (line) => {
            const y =
              height -
              padding -
              (line / 100) *
                (height - padding * 2);

            return (
              <g key={line}>
                <line
                  x1={padding}
                  x2={width - padding}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  opacity="0.12"
                />

                <text
                  x={10}
                  y={y + 4}
                  fontSize="12"
                  fill="currentColor"
                  opacity="0.65"
                >
                  {line}%
                </text>
              </g>
            );
          }
        )}

        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="currentColor"
            />

            <text
              x={point.x}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              opacity="0.7"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
}


export default function TeacherReport() {

  const [overview, setOverview] = useState(null);

  const [subjects, setSubjects] = useState([]);

  const [classes, setClasses] = useState([]);

  const [subjectPerformance, setSubjectPerformance] =
    useState([]);

  const [classPerformance, setClassPerformance] =
    useState([]);

  const [performanceTrend, setPerformanceTrend] =
    useState([]);

  const [attendanceTrend, setAttendanceTrend] =
    useState([]);

  const [studentRanking, setStudentRanking] =
    useState([]);

  const [interventionStudents, setInterventionStudents] =
    useState([]);


  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedClass, setSelectedClass] =
    useState("");

  const [performancePeriod, setPerformancePeriod] =
    useState("term");

  const [rankingSort, setRankingSort] =
    useState("average");

  const [rankingOrder, setRankingOrder] =
    useState("desc");


  const [loading, setLoading] =
    useState(true);

  const [trendLoading, setTrendLoading] =
    useState(false);

  const [rankingLoading, setRankingLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        overviewResponse,
        subjectsResponse,
        classesResponse,
        subjectPerformanceResponse,
        classPerformanceResponse,
        interventionResponse,
      ] = await Promise.all([
        axiosInstance.get(
          `${API_PREFIX}/overview`
        ),

        axiosInstance.get(
          `${API_PREFIX}/subjects`
        ),

        axiosInstance.get(
          `${API_PREFIX}/classes`
        ),

        axiosInstance.get(
          `${API_PREFIX}/subject-performance`
        ),

        axiosInstance.get(
          `${API_PREFIX}/class-performance`
        ),

        axiosInstance.get(
          `${API_PREFIX}/intervention-students`
        ),
      ]);

      setOverview(unwrap(overviewResponse));

      setSubjects(unwrapArray(subjectsResponse));

      setClasses(unwrapArray(classesResponse));

      setSubjectPerformance(unwrapArray(subjectPerformanceResponse));

      setClassPerformance(unwrapArray(classPerformanceResponse));

      setInterventionStudents(unwrapArray(interventionResponse));

    } catch (err) {
      console.error(
        "Failed to load teacher report:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load teacher reports."
      );
    } finally {
      setLoading(false);
    }
  };


  const loadPerformanceTrend = async () => {
    if (
      !selectedSubject ||
      !selectedClass
    ) {
      setPerformanceTrend([]);
      return;
    }

    try {
      setTrendLoading(true);

      const response =
        await axiosInstance.get(
          `${API_PREFIX}/performance-trend`,
          {
            params: {
              subjectId: selectedSubject,
              classId: selectedClass,
              period: performancePeriod,
            },
          }
        );

      /*
       * Our service returns:
       *
       * {
       *   subjectId,
       *   classId,
       *   period,
       *   data: [...]
       * }
       *
       * unwrap() strips the {success, data} envelope; the inner
       * object may itself carry the array under `.data`.
       */

      const result = unwrap(response);
      const trendData = result?.data ?? result;

      setPerformanceTrend(Array.isArray(trendData) ? trendData : []);

    } catch (err) {
      console.error(
        "Failed to load performance trend:",
        err
      );

      setPerformanceTrend([]);
    } finally {
      setTrendLoading(false);
    }
  };


  const loadAttendanceTrend = async () => {
    if (!selectedClass) {
      setAttendanceTrend([]);
      return;
    }

    try {
      const response =
        await axiosInstance.get(
          `${API_PREFIX}/attendance-trend`,
          {
            params: {
              classId: selectedClass,
            },
          }
        );

      const result = unwrap(response);
      const trendData = result?.data ?? result;

      setAttendanceTrend(Array.isArray(trendData) ? trendData : []);

    } catch (err) {
      console.error(
        "Failed to load attendance trend:",
        err
      );

      setAttendanceTrend([]);
    }
  };


  const loadStudentRanking = async () => {
    if (
      !selectedSubject ||
      !selectedClass
    ) {
      setStudentRanking([]);
      return;
    }

    try {
      setRankingLoading(true);

      const response =
        await axiosInstance.get(
          `${API_PREFIX}/student-ranking`,
          {
            params: {
              subjectId: selectedSubject,
              classId: selectedClass,
              sortBy: rankingSort,
              order: rankingOrder,
            },
          }
        );

      setStudentRanking(unwrapArray(response));

    } catch (err) {
      console.error(
        "Failed to load student ranking:",
        err
      );

      setStudentRanking([]);
    } finally {
      setRankingLoading(false);
    }
  };


  useEffect(() => {
    loadReport();
  }, []);


  useEffect(() => {
    loadPerformanceTrend();
  }, [
    selectedSubject,
    selectedClass,
    performancePeriod,
  ]);


  useEffect(() => {
    loadAttendanceTrend();
  }, [selectedClass]);


  useEffect(() => {
    loadStudentRanking();
  }, [
    selectedSubject,
    selectedClass,
    rankingSort,
    rankingOrder,
  ]);


  useEffect(() => {
    if (
      subjects.length > 0 &&
      !selectedSubject
    ) {
      setSelectedSubject(
        subjects[0].subjectId
      );
    }
  }, [subjects, selectedSubject]);


  useEffect(() => {
    if (
      classes.length > 0 &&
      !selectedClass
    ) {
      setSelectedClass(
        classes[0].classId
      );
    }
  }, [classes, selectedClass]);


  const selectedSubjectName =
    useMemo(() => {
      const subject = subjects.find(
        (item) =>
          String(item.subjectId) ===
          String(selectedSubject)
      );

      return subject?.subjectName || "";
    }, [
      subjects,
      selectedSubject,
    ]);


  const selectedClassName =
    useMemo(() => {
      const classItem = classes.find(
        (item) =>
          String(item.classId) ===
          String(selectedClass)
      );

      return classItem?.className || "";
    }, [
      classes,
      selectedClass,
    ]);


  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={2}
          alignItems="center"
        >
          <CircularProgress />

          <Typography color="text.secondary">
            Loading teacher reports...
          </Typography>
        </Stack>
      </Box>
    );
  }


  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
          >
            Teacher Reports
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Monitor learner performance, attendance
            and areas requiring intervention.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadReport}
        >
          Refresh
        </Button>
      </Stack>


      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}


      <Grid
        container
        spacing={2}
        sx={{ mb: 4 }}
      >

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={2}
        >
          <KpiCard
            title="Total Students"
            value={
              overview?.totalStudents ?? 0
            }
            subtitle="Students you teach"
            icon={<PeopleIcon />}
          />
        </Grid>


        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={2}
        >

        </Grid>


        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={2}
        >
          <KpiCard
            title="Average Mark"
            value={`${formatNumber(
              overview?.averageMark
            )}%`}
            subtitle="Overall assessment average"
            icon={<TrendingUpIcon />}
          />
        </Grid>


        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={2}
        >
          <KpiCard
            title="Attendance"
            value={`${formatNumber(
              overview?.attendance
            )}%`}
            subtitle="Overall attendance"
            icon={<AttendanceIcon />}
          />
        </Grid>


        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={2}
        >
          <KpiCard
            title="At Risk"
            value={
              overview?.atRisk ?? 0
            }
            subtitle="Learners requiring attention"
            icon={<WarningIcon />}
          />
        </Grid>


        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={2}
        >
          <KpiCard
            title="Pass Rate"
            value={`${formatNumber(
              overview?.passRate
            )}%`}
            subtitle="Learners achieving 50%+"
            icon={<PassIcon />}
          />
        </Grid>

      </Grid>


      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
        >

          <FormControl
            fullWidth
            size="small"
          >
            <InputLabel>
              Subject
            </InputLabel>

            <Select
              value={selectedSubject}
              label="Subject"
              onChange={(event) =>
                setSelectedSubject(
                  event.target.value
                )
              }
            >
              {subjects.map((subject) => (
                <MenuItem
                  key={subject.subjectId}
                  value={subject.subjectId}
                >
                  {subject.subjectName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>


          <FormControl
            fullWidth
            size="small"
          >
            <InputLabel>
              Class
            </InputLabel>

            <Select
              value={selectedClass}
              label="Class"
              onChange={(event) =>
                setSelectedClass(
                  event.target.value
                )
              }
            >
              {classes.map((item) => (
                <MenuItem
                  key={item.classId}
                  value={item.classId}
                >
                  {item.className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

        </Stack>
      </Paper>


      <Grid
        container
        spacing={3}
        sx={{ mb: 3 }}
      >

        <Grid
          item
          xs={12}
          md={6}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: "100%",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 3 }}
            >
              <SubjectIcon color="primary" />

              <Typography
                variant="h6"
                fontWeight={700}
              >
                Performance by Subject
              </Typography>
            </Stack>

            <PerformanceBars
              data={subjectPerformance}
            />

          </Paper>
        </Grid>


        <Grid
          item
          xs={12}
          md={6}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: "100%",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 3 }}
            >
              <ClassIcon color="primary" />

              <Typography
                variant="h6"
                fontWeight={700}
              >
                Performance by Class
              </Typography>
            </Stack>

            <PerformanceBars
              data={classPerformance}
            />

          </Paper>
        </Grid>

      </Grid>


      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          spacing={2}
          sx={{ mb: 3 }}
        >

          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Performance Trend
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {selectedSubjectName &&
              selectedClassName
                ? `${selectedSubjectName} • ${selectedClassName}`
                : "Select a subject and class"}
            </Typography>
          </Box>


          <FormControl
            size="small"
            sx={{
              minWidth: 150,
            }}
          >
            <InputLabel>
              Period
            </InputLabel>

            <Select
              value={performancePeriod}
              label="Period"
              onChange={(event) =>
                setPerformancePeriod(
                  event.target.value
                )
              }
            >
              <MenuItem value="30days">
                Last 30 Days
              </MenuItem>

              <MenuItem value="term">
                Current Term
              </MenuItem>

              <MenuItem value="year">
                Last Year
              </MenuItem>

              <MenuItem value="academic-year">
                Academic Year
              </MenuItem>
            </Select>
          </FormControl>

        </Stack>


        {trendLoading ? (
          <Box
            sx={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <TrendChart
            data={performanceTrend}
            valueKey="average"
            emptyMessage="Select a subject and class to view performance trends."
          />
        )}

      </Paper>


      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            fontWeight={700}
          >
            Weekly Attendance Trend
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {selectedClassName
              ? `Attendance for ${selectedClassName}`
              : "Select a class"}
          </Typography>
        </Box>

        <TrendChart
          data={attendanceTrend}
          valueKey="attendance"
          emptyMessage="Select a class to view attendance trends."
        />

      </Paper>


      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            md: "center",
          }}
          spacing={2}
          sx={{ mb: 3 }}
        >

          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Student Performance Ranking
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Rank students from highest to lowest
              performance or attendance.
            </Typography>
          </Box>


          <Stack
            direction="row"
            spacing={1}
          >

            <FormControl
              size="small"
              sx={{ minWidth: 130 }}
            >
              <InputLabel>
                Rank By
              </InputLabel>

              <Select
                value={rankingSort}
                label="Rank By"
                onChange={(event) =>
                  setRankingSort(
                    event.target.value
                  )
                }
              >
                <MenuItem value="average">
                  Average
                </MenuItem>

                <MenuItem value="attendance">
                  Attendance
                </MenuItem>
              </Select>
            </FormControl>


            <FormControl
              size="small"
              sx={{ minWidth: 130 }}
            >
              <InputLabel>
                Order
              </InputLabel>

              <Select
                value={rankingOrder}
                label="Order"
                onChange={(event) =>
                  setRankingOrder(
                    event.target.value
                  )
                }
              >
                <MenuItem value="desc">
                  Highest First
                </MenuItem>

                <MenuItem value="asc">
                  Lowest First
                </MenuItem>
              </Select>
            </FormControl>

          </Stack>

        </Stack>


        {rankingLoading ? (
          <Box
            sx={{
              py: 8,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : studentRanking.length === 0 ? (

          <Box
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <Typography color="text.secondary">
              Select a subject and class to view
              student rankings.
            </Typography>
          </Box>

        ) : (

          <TableContainer>
            <Table>

              <TableHead>
                <TableRow>

                  <TableCell>
                    Rank
                  </TableCell>

                  <TableCell>
                    Student
                  </TableCell>

                  <TableCell>
                    Class
                  </TableCell>

                  <TableCell align="right">
                    Average
                  </TableCell>

                  <TableCell align="right">
                    Attendance
                  </TableCell>

                </TableRow>
              </TableHead>


              <TableBody>

                {studentRanking.map(
                  (student, index) => {

                    const average =
                      Number(
                        student.average || 0
                      );

                    const attendance =
                      Number(
                        student.attendance || 0
                      );

                    return (
                      <TableRow
                        key={
                          student.studentId ||
                          index
                        }
                        hover
                      >

                        <TableCell>
                          <Typography
                            fontWeight={700}
                          >
                            #{index + 1}
                          </Typography>
                        </TableCell>


                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.5}
                          >

                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                  "center",
                                backgroundColor:
                                  "action.hover",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {getInitial(
                                student.name
                              )}
                            </Box>

                            <Typography
                              fontWeight={600}
                            >
                              {student.name}
                            </Typography>

                          </Stack>
                        </TableCell>


                        <TableCell>
                          {student.className}
                        </TableCell>


                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={`${formatNumber(
                              average
                            )}%`}
                            color={
                              average >= 50
                                ? "success"
                                : "error"
                            }
                          />
                        </TableCell>


                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={`${formatNumber(
                              attendance
                            )}%`}
                            color={
                              attendance >= 75
                                ? "success"
                                : "warning"
                            }
                          />
                        </TableCell>

                      </TableRow>
                    );
                  }
                )}

              </TableBody>

            </Table>
          </TableContainer>

        )}

      </Paper>


      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 1 }}
        >

          <WarningIcon color="warning" />

          <Typography
            variant="h6"
            fontWeight={700}
          >
            Learners Requiring Intervention
          </Typography>

        </Stack>


        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Learners identified because of low academic
          performance, low attendance, or both.
        </Typography>


        {interventionStudents.length === 0 ? (

          <Alert severity="success">
            No learners currently require intervention.
          </Alert>

        ) : (

          <TableContainer>
            <Table>

              <TableHead>
                <TableRow>

                  <TableCell>
                    Student
                  </TableCell>

                  <TableCell>
                    Class
                  </TableCell>

                  <TableCell align="right">
                    Average
                  </TableCell>

                  <TableCell align="right">
                    Attendance
                  </TableCell>

                  <TableCell>
                    Reason
                  </TableCell>

                </TableRow>
              </TableHead>


              <TableBody>

                {interventionStudents.map(
                  (student, index) => (

                    <TableRow
                      key={
                        student.studentId ||
                        index
                      }
                      hover
                    >

                      <TableCell>
                        <Typography
                          fontWeight={600}
                        >
                          {student.name}
                        </Typography>
                      </TableCell>


                      <TableCell>
                        {student.className}
                      </TableCell>


                      <TableCell align="right">
                        {formatNumber(
                          student.average
                        )}%
                      </TableCell>


                      <TableCell align="right">
                        {formatNumber(
                          student.attendance
                        )}%
                      </TableCell>


                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            student.reason ||
                            "Requires attention"
                          }
                          color="warning"
                          variant="outlined"
                        />
                      </TableCell>

                    </TableRow>

                  )
                )}

              </TableBody>

            </Table>
          </TableContainer>

        )}

      </Paper>

    </Box>
  );
}