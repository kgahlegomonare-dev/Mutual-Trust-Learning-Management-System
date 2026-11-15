import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
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
  Tooltip as MuiTooltip,
  Typography,
  useTheme,
} from "@mui/material";

import {
  Business,
  CheckCircle,
  Close,
  Download,
  EventAvailable,
  Groups,
  InfoOutlined,
  People,
  School,
  TrendingUp,
} from "@mui/icons-material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const unwrap = (response) =>
  response?.data?.data ?? response?.data ?? response;

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const numericRows = (list, keys) =>
  (Array.isArray(list) ? list : []).map((row) => {
    const convertedRow = { ...row };

    keys.forEach((key) => {
      convertedRow[key] = toNumber(row[key]);
    });

    return convertedRow;
  });

const percentage = (value) => {
  const number = toNumber(value);
  return number === null ? "—" : `${number.toFixed(1)}%`;
};

const formatNumber = (value) => {
  const number = toNumber(value);
  return number === null ? "—" : number.toLocaleString();
};

function Panel({ value, index, children }) {
  if (value !== index) {
    return null;
  }

  return <Box sx={{ pt: 1 }}>{children}</Box>;
}

function KPI({ title, value, icon, accent = "primary.main" }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        transition: "border-color 0.2s ease",
        "&:hover": {
          borderColor: accent,
        },
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
        >
          <Box minWidth={0}>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              display="block"
            >
              {title}
            </Typography>

            <Typography
              variant="h5"
              fontWeight={800}
              mt={0.5}
              lineHeight={1.2}
            >
              {value}
            </Typography>
          </Box>

          <Box sx={{ color: accent, opacity: 0.85, display: "flex" }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children, hint, sx }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{ mb: 0.5, ...sx }}
    >
      <Typography variant="subtitle1" fontWeight={700}>
        {children}
      </Typography>

      {hint && (
        <MuiTooltip title={hint} arrow>
          <InfoOutlined
            sx={{
              fontSize: 16,
              color: "text.disabled",
            }}
          />
        </MuiTooltip>
      )}
    </Stack>
  );
}

function Filter({ label, value, onChange, items = [] }) {
  return (
    <FormControl size="small" sx={{ minWidth: 165 }}>
      <InputLabel>{label}</InputLabel>

      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <MenuItem value="">All</MenuItem>

        {items.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function Empty({
  label = "No data available for the selected filters.",
}) {
  return (
    <Stack
      height="100%"
      alignItems="center"
      justifyContent="center"
      spacing={0.5}
      py={4}
    >
      <Typography color="text.secondary">{label}</Typography>

      <Typography variant="caption" color="text.disabled">
        Nothing in the database matches this selection.
      </Typography>
    </Stack>
  );
}

function ChartBox({
  height = 320,
  hasData,
  children,
  emptyLabel,
}) {
  return (
    <Box sx={{ height, width: "100%" }}>
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <Empty label={emptyLabel} />
      )}
    </Box>
  );
}

function SplitRow({
  leftPct,
  children,
  spacing = 2.5,
  breakpoint = "lg",
}) {
  const childrenArray = React.Children.toArray(children);
  const left = childrenArray[0];
  const right = childrenArray[1];

  return (
    <Stack
      direction={{
        xs: "column",
        [breakpoint]: "row",
      }}
      spacing={spacing}
      alignItems="stretch"
    >
      <Box
        sx={{
          width: "100%",
          flex: {
            [breakpoint]: `0 0 ${leftPct}%`,
          },
          maxWidth: {
            [breakpoint]: `${leftPct}%`,
          },
        }}
      >
        {left}
      </Box>

      <Box
        sx={{
          width: "100%",
          flex: {
            [breakpoint]: `0 0 ${100 - leftPct}%`,
          },
          maxWidth: {
            [breakpoint]: `${100 - leftPct}%`,
          },
        }}
      >
        {right}
      </Box>
    </Stack>
  );
}

export default function AdminReports() {
  const theme = useTheme();

  const colours = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
    grid: theme.palette.divider,
    axis: theme.palette.text.secondary,
  };

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState({});
  const [trend, setTrend] = useState([]);
  const [centerPerformance, setCenterPerformance] = useState([]);
  const [health, setHealth] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [attendanceCenters, setAttendanceCenters] = useState([]);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [capacity, setCapacity] = useState({ centers: [] });
  const [topStudents, setTopStudents] = useState([]);
  const [satisfaction, setSatisfaction] = useState({});

  const [options, setOptions] = useState({
    currentTerm: null,
    terms: [],
    grades: [],
    centers: [],
    subjects: [],
  });

  const [term, setTerm] = useState("");
  const [grade, setGrade] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [centerId, setCenterId] = useState("");

  const [drilldown, setDrilldown] = useState({
    open: false,
    name: "",
    rows: [],
    loading: false,
  });

  const params = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({
          term,
          grade,
          subjectId,
          centerId,
        }).filter(([, value]) => value !== "")
      ),
    [term, grade, subjectId, centerId]
  );

  const initialRequests = useMemo(
    () => [
      ["overview", setOverview, {}],
      ["performance-trend", setTrend, []],
      ["center-performance", setCenterPerformance, []],
      ["center-health", setHealth, []],
      ["attendance-trend", setAttendanceTrend, []],
      ["attendance-by-center", setAttendanceCenters, []],
      ["low-attendance", setLowAttendance, []],
      ["subject-performance", setSubjects, []],
      ["capacity", setCapacity, { centers: [] }],
      ["top-students", setTopStudents, []],
      ["subject-satisfaction", setSatisfaction, {}],
      [
        "filters",
        setOptions,
        {
          currentTerm: null,
          terms: [],
          grades: [],
          centers: [],
          subjects: [],
        },
      ],
    ],
    []
  );

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled(
        initialRequests.map(([path]) =>
          axiosInstance.get(`/reports/${path}`)
        )
      );

      if (!mounted) {
        return;
      }

      const failed = [];

      results.forEach((result, index) => {
        const [path, setter, fallback] = initialRequests[index];

        if (result.status === "fulfilled") {
          setter(unwrap(result.value) ?? fallback);
        } else {
          setter(fallback);

          failed.push(
            `${path} (${
              result.reason?.response?.status ?? "network error"
            })`
          );
        }
      });

      if (failed.length) {
        setError(`Could not load: ${failed.join(", ")}.`);
      }

      setLoading(false);
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [initialRequests]);

  const filterKey = JSON.stringify(params);
  const skipFirstFilterFetch = useRef(true);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (skipFirstFilterFetch.current) {
      skipFirstFilterFetch.current = false;
      return;
    }

    let mounted = true;

    const loadFilteredData = async () => {
      const targets = [
        ["center-performance", setCenterPerformance, []],
        ["subject-performance", setSubjects, []],
        ["top-students", setTopStudents, []],
        ["subject-satisfaction", setSatisfaction, {}],
        ["performance-trend", setTrend, []],
      ];

      const results = await Promise.allSettled(
        targets.map(([path]) =>
          axiosInstance.get(`/reports/${path}`, { params })
        )
      );

      if (!mounted) {
        return;
      }

      const failed = [];

      results.forEach((result, index) => {
        const [path, setter, fallback] = targets[index];

        if (result.status === "fulfilled") {
          setter(unwrap(result.value) ?? fallback);
        } else {
          setter(fallback);

          failed.push(
            `${path} (${
              result.reason?.response?.status ?? "network error"
            })`
          );
        }
      });

      if (failed.length) {
        setError(
          `Could not apply report filters to: ${failed.join(", ")}.`
        );
      } else {
        setError("");
      }
    };

    loadFilteredData();

    return () => {
      mounted = false;
    };
  }, [filterKey, loading, params]);

  const openCenter = async (row) => {
    setDrilldown({
      open: true,
      name: row.centerName || "Centre",
      rows: [],
      loading: true,
    });

    try {
      const response = await axiosInstance.get(
        `/reports/center-health/${row.centerId}/drilldown`
      );

      const resultRows = unwrap(response);

      setDrilldown((current) => ({
        ...current,
        rows: Array.isArray(resultRows) ? resultRows : [],
        loading: false,
      }));
    } catch (requestError) {
      setDrilldown((current) => ({
        ...current,
        loading: false,
      }));

      setError(
        requestError?.response?.data?.message ||
          `Could not load the drill-down for ${row.centerName}.`
      );
    }
  };

  const exportTopStudents = async () => {
    try {
      const response = await axiosInstance.get(
        "/reports/top-students/export",
        {
          params,
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "top-performing-learners.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 0);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Could not export the top learners CSV."
      );
    }
  };

  const trendData = useMemo(
    () => numericRows(trend, ["averagePercentage", "term"]),
    [trend]
  );

  const centerPerformanceData = useMemo(
    () => numericRows(centerPerformance, ["averagePercentage"]),
    [centerPerformance]
  );

  const attendanceTrendData = useMemo(
    () => numericRows(attendanceTrend, ["attendance"]),
    [attendanceTrend]
  );

  const attendanceCenterData = useMemo(
    () => numericRows(attendanceCenters, ["attendance"]),
    [attendanceCenters]
  );

  const capacityData = useMemo(
    () =>
      numericRows(capacity?.centers, [
        "learnersPerTeacher",
        "learners",
        "teachers",
      ]),
    [capacity]
  );

  const organisationAttendance = toNumber(
    overview.overallAttendance
  );

  const satisfactionData = useMemo(
    () => [
      {
        name: "Satisfied",
        value: toNumber(satisfaction.satisfied) || 0,
      },
      {
        name: "Not satisfied",
        value: toNumber(satisfaction.notSatisfied) || 0,
      },
    ],
    [satisfaction]
  );

  const axisProps = {
    stroke: colours.axis,
    tick: {
      fill: colours.axis,
      fontSize: 12,
    },
  };

  const tooltipStyle = {
    contentStyle: {
      borderRadius: 10,
      border: `1px solid ${colours.grid}`,
      background: theme.palette.background.paper,
      fontSize: 13,
    },
  };

  const commonFilters = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      flexWrap="wrap"
      useFlexGap
    >
      <Filter
        label="Term"
        value={term}
        onChange={setTerm}
        items={(options.terms || []).map((item) => ({
          value: item,
          label: `Term ${item}`,
        }))}
      />

      <Filter
        label="Grade"
        value={grade}
        onChange={setGrade}
        items={(options.grades || []).map((item) => ({
          value: item,
          label: `Grade ${item}`,
        }))}
      />

      <Filter
        label="Subject"
        value={subjectId}
        onChange={setSubjectId}
        items={(options.subjects || []).map((item) => ({
          value: item.subjectId,
          label: item.grade
            ? `${item.subjectName} (Gr ${item.grade})`
            : item.subjectName,
        }))}
      />
    </Stack>
  );

  const centreFilter = (
    <Filter
      label="Centre"
      value={centerId}
      onChange={setCenterId}
      items={(options.centers || []).map((item) => ({
        value: item.centerId,
        label: item.centerName,
      }))}
    />
  );

  if (loading) {
    return (
      <Box
        minHeight={420}
        display="grid"
        sx={{ placeItems: "center" }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />

          <Typography color="text.secondary">
            Loading reports from the database…
          </Typography>
        </Stack>
      </Box>
    );
  }

  const capacityChartMinWidth = Math.max(
    680,
    capacityData.length * 110
  );

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
        maxWidth: 1600,
        mx: "auto",
      }}
    >
      <Box mb={2.5}>
        <Typography variant="h4" fontWeight={800}>
          Admin Reports &amp; Analytics
        </Typography>

        <Typography color="text.secondary">
          Organisation-wide performance, centre health and operational
          insight. All figures are live from the database.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={1.5} mb={2.5}>
        {[
          [
            "Active Learners",
            formatNumber(overview.totalActiveLearners),
            <People />,
            "primary.main",
          ],
          [
            "Centres",
            formatNumber(overview.totalCenters),
            <Business />,
            "info.main",
          ],
          [
            "Teachers",
            formatNumber(overview.totalTeachers),
            <School />,
            "info.main",
          ],
          [
            "Overall Average",
            percentage(overview.overallAverage),
            <TrendingUp />,
            "primary.main",
          ],
          [
            "Attendance",
            percentage(overview.overallAttendance),
            <EventAvailable />,
            "success.main",
          ],
          [
            "Pass Rate",
            percentage(overview.passRate),
            <CheckCircle />,
            "success.main",
          ],
        ].map(([title, value, icon, accent]) => (
          <Grid item xs={6} md={4} lg={2} key={title}>
            <KPI
              title={title}
              value={value}
              icon={icon}
              accent={accent}
            />
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Tab label="Performance" />
          <Tab label="Centres" />
          <Tab label="Attendance" />
          <Tab label="Subjects" />
          <Tab label="Capacity" />
          <Tab label="Top Learners" />
          <Tab label="Feedback" />
        </Tabs>

        <Box
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
            minHeight: 480,
          }}
        >
          <Panel value={tab} index={0}>
            <Box mb={2}>{commonFilters}</Box>

            <SplitRow leftPct={70}>
              <Box>
                <SectionTitle hint="Average of all graded submissions, grouped by the term the submission falls in.">
                  Overall Performance Trend
                </SectionTitle>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  Organisation average per term, out of 100%.
                </Typography>

                <ChartBox
                  height={480}
                  hasData={trendData.length > 0}
                >
                  <LineChart
                    data={trendData}
                    margin={{
                      top: 8,
                      right: 24,
                      bottom: 4,
                      left: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colours.grid}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="termLabel"
                      {...axisProps}
                    />

                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      {...axisProps}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Average",
                      ]}
                      {...tooltipStyle}
                    />

                    <ReferenceLine
                      y={50}
                      stroke={colours.warning}
                      strokeDasharray="4 4"
                      label={{
                        value: "Pass mark 50%",
                        position: "insideTopRight",
                        fill: colours.warning,
                        fontSize: 11,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="averagePercentage"
                      name="Average"
                      stroke={colours.primary}
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: colours.primary,
                      }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ChartBox>
              </Box>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  position: {
                    lg: "sticky",
                  },
                  top: 16,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    px: 2.5,
                    pt: 2.5,
                    pb: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800}>
                    Performance Summary
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Across all active learners
                  </Typography>

                  <Box
                    sx={{
                      mt: 2,
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "primary.light",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      textAlign: "center",
                      boxShadow: theme.shadows[2],
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight={900}
                      letterSpacing={0.8}
                    >
                      CURRENT TERM : {options.currentTerm ?? "—"}
                    </Typography>
                  </Box>
                </Box>

                <CardContent
                  sx={{
                    px: 2.5,
                    py: 1,
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Stack
                    divider={<Divider flexItem />}
                    sx={{ width: "100%" }}
                  >
                    {[
                      [
                        "Overall Average",
                        percentage(overview.overallAverage),
                        "primary.main",
                      ],
                      [
                        "Pass Rate",
                        percentage(overview.passRate),
                        "success.main",
                      ],
                      [
                        "Failure Rate",
                        percentage(overview.failureRate),
                        "error.main",
                      ],
                      [
                        "Assessments Completed",
                        formatNumber(overview.assessmentsCompleted),
                        "text.primary",
                      ],
                      [
                        "Learners Assessed",
                        formatNumber(overview.learnersAssessed),
                        "text.primary",
                      ],
                    ].map(([label, value, colour]) => (
                      <Stack
                        key={label}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                        py={2}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {label}
                        </Typography>

                        <Typography
                          variant="h6"
                          fontWeight={800}
                          color={colour}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </SplitRow>
          </Panel>

          <Panel value={tab} index={1}>
            <Box mb={2}>{commonFilters}</Box>

            <SectionTitle hint="Average of graded submissions by the learners registered at each centre.">
              Centre Performance Comparison
            </SectionTitle>

            <ChartBox
              height={Math.max(
                280,
                centerPerformanceData.length * 34
              )}
              hasData={centerPerformanceData.length > 0}
            >
              <BarChart
                data={centerPerformanceData}
                layout="vertical"
                margin={{
                  top: 8,
                  right: 24,
                  bottom: 4,
                  left: 8,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colours.grid}
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  {...axisProps}
                />

                <YAxis
                  dataKey="centerName"
                  type="category"
                  width={140}
                  {...axisProps}
                />

                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    "Average",
                  ]}
                  {...tooltipStyle}
                  cursor={{
                    fill: theme.palette.action.hover,
                  }}
                />

                <ReferenceLine
                  x={50}
                  stroke={colours.warning}
                  strokeDasharray="4 4"
                />

                <Bar
                  dataKey="averagePercentage"
                  name="Average"
                  fill={colours.primary}
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ChartBox>

            <Divider sx={{ my: 2.5 }} />

            <SectionTitle hint="Select a centre name to break its results down by grade, subject and class.">
              Centre Health
            </SectionTitle>

            {health.length === 0 ? (
              <Empty label="No active centres returned." />
            ) : (
              <TableContainer
                sx={{
                  maxHeight: 320,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {[
                        "Centre",
                        "Learners",
                        "Teachers",
                        "Avg",
                        "Attendance",
                        "Pass Rate",
                        "At Risk",
                        "Dropout",
                      ].map((item, index) => (
                        <TableCell
                          key={item}
                          align={index === 0 ? "left" : "right"}
                          sx={{ fontWeight: 700 }}
                        >
                          {item}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {health.map((row) => (
                      <TableRow hover key={row.centerId}>
                        <TableCell>
                          <Button
                            onClick={() => openCenter(row)}
                            size="small"
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            {row.centerName}
                          </Button>
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(row.learners)}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(row.teachers)}
                        </TableCell>

                        <TableCell align="right">
                          {percentage(row.average)}
                        </TableCell>

                        <TableCell align="right">
                          {percentage(row.attendance)}
                        </TableCell>

                        <TableCell align="right">
                          {percentage(row.passRate)}
                        </TableCell>

                        <TableCell align="right">
                          {toNumber(row.atRisk) > 0 ? (
                            <Chip
                              size="small"
                              label={formatNumber(row.atRisk)}
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            formatNumber(row.atRisk)
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {percentage(row.dropout)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Panel>

          <Panel value={tab} index={2}>
            <SplitRow leftPct={50}>
              <Box>
                <SectionTitle hint="Present and late records as a share of all attendance records, by month.">
                  Organisation Attendance Trend
                </SectionTitle>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  Monthly attendance rate across all active learners.
                </Typography>

                <ChartBox
                  height={360}
                  hasData={attendanceTrendData.length > 0}
                >
                  <LineChart
                    data={attendanceTrendData}
                    margin={{
                      top: 8,
                      right: 16,
                      bottom: 4,
                      left: -8,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colours.grid}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      {...axisProps}
                    />

                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      {...axisProps}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Attendance",
                      ]}
                      {...tooltipStyle}
                    />

                    <Line
                      type="monotone"
                      dataKey="attendance"
                      name="Attendance"
                      stroke={colours.success}
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: colours.success,
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartBox>
              </Box>

              <Box>
                <SectionTitle hint="Attendance rate for each active centre, with the organisation average for comparison.">
                  Attendance Rate per Centre
                </SectionTitle>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  Each point is one centre. The dashed line is the
                  organisation average
                  {organisationAttendance !== null
                    ? ` (${organisationAttendance.toFixed(1)}%)`
                    : ""}
                  .
                </Typography>

                <ChartBox
                  height={360}
                  hasData={attendanceCenterData.length > 0}
                  emptyLabel="No attendance records found for any active centre."
                >
                  <LineChart
                    data={attendanceCenterData}
                    margin={{
                      top: 8,
                      right: 16,
                      bottom: 56,
                      left: -8,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colours.grid}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="centerName"
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={70}
                      {...axisProps}
                      tick={{
                        fill: colours.axis,
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      {...axisProps}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Attendance",
                      ]}
                      {...tooltipStyle}
                    />

                    <Legend
                      verticalAlign="top"
                      height={28}
                      wrapperStyle={{ fontSize: 12 }}
                    />

                    {organisationAttendance !== null && (
                      <ReferenceLine
                        y={organisationAttendance}
                        stroke={colours.warning}
                        strokeDasharray="5 5"
                      />
                    )}

                    <Line
                      type="monotone"
                      dataKey="attendance"
                      name="Attendance rate"
                      stroke={colours.info}
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: colours.info,
                      }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </LineChart>
                </ChartBox>
              </Box>
            </SplitRow>

            <Divider sx={{ my: 2.5 }} />

            <SectionTitle hint="Active learners whose personal attendance rate is below 75%.">
              Learners Below 75% Attendance
            </SectionTitle>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1.5}
            >
              Organisation total:{" "}
              <b>
                {formatNumber(lowAttendance[0]?.total) === "—"
                  ? 0
                  : formatNumber(lowAttendance[0]?.total)}
              </b>{" "}
              learners
            </Typography>

            {lowAttendance.length === 0 ? (
              <Empty label="No centres returned for this threshold." />
            ) : (
              <Grid container spacing={1.5}>
                {lowAttendance.map((row) => (
                  <Grid
                    item
                    xs={6}
                    sm={4}
                    md={3}
                    lg={2}
                    key={row.centerId}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        height: "100%",
                      }}
                    >
                      <CardContent sx={{ py: 1.75 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          display="block"
                        >
                          {row.centerName}
                        </Typography>

                        <Typography
                          variant="h5"
                          fontWeight={800}
                          color={
                            toNumber(row.learnerCount) > 0
                              ? "warning.main"
                              : "text.primary"
                          }
                        >
                          {formatNumber(row.learnerCount)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Panel>

          <Panel value={tab} index={3}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
              mb={2}
            >
              {commonFilters}
              {centreFilter}
            </Stack>

            <SectionTitle hint="Average and pass rate per subject across the whole organisation.">
              Subject Performance
            </SectionTitle>

            <ChartBox
              height={Math.max(260, subjects.length * 32)}
              hasData={subjects.length > 0}
            >
              <BarChart
                data={numericRows(subjects, [
                  "organisationAverage",
                  "passRate",
                ])}
                layout="vertical"
                margin={{
                  top: 8,
                  right: 24,
                  bottom: 4,
                  left: 8,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colours.grid}
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  {...axisProps}
                />

                <YAxis
                  dataKey="subjectName"
                  type="category"
                  width={150}
                  {...axisProps}
                />

                <Tooltip
                  formatter={(value) =>
                    `${Number(value).toFixed(1)}%`
                  }
                  {...tooltipStyle}
                  cursor={{
                    fill: theme.palette.action.hover,
                  }}
                />

                <Legend
                  verticalAlign="top"
                  height={28}
                  wrapperStyle={{ fontSize: 12 }}
                />

                <ReferenceLine
                  x={50}
                  stroke={colours.warning}
                  strokeDasharray="4 4"
                />

                <Bar
                  dataKey="organisationAverage"
                  name="Average"
                  fill={colours.primary}
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />

                <Bar
                  dataKey="passRate"
                  name="Pass rate"
                  fill={colours.success}
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />
              </BarChart>
            </ChartBox>

            <Divider sx={{ my: 2.5 }} />

            {subjects.length > 0 && (
              <TableContainer
                sx={{
                  maxHeight: 340,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Subject
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700 }}
                      >
                        Organisation Avg
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700 }}
                      >
                        Pass Rate
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700 }}
                      >
                        Learners
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {subjects.map((row) => (
                      <TableRow hover key={row.subjectId}>
                        <TableCell>{row.subjectName}</TableCell>

                        <TableCell align="right">
                          {percentage(row.organisationAverage)}
                        </TableCell>

                        <TableCell align="right">
                          {percentage(row.passRate)}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(row.learners)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Panel>

          <Panel value={tab} index={4}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2.5}
              alignItems="stretch"
            >
              <Box
                sx={{
                  width: "100%",
                  flex: {
                    md: "0 0 220px",
                  },
                  maxWidth: {
                    md: "220px",
                  },
                }}
              >
                <Stack spacing={1.5}>
                  <KPI
                    title="Organisation Learners per Teacher"
                    value={`${
                      toNumber(capacity.organisationRatio) ?? 0
                    }:1`}
                    icon={<Groups />}
                  />

                  <KPI
                    title="Active Learners"
                    value={formatNumber(
                      capacity.totalLearners ??
                        overview.totalActiveLearners
                    )}
                    icon={<People />}
                  />

                  <KPI
                    title="Active Teachers"
                    value={formatNumber(
                      capacity.totalTeachers ??
                        overview.totalTeachers
                    )}
                    icon={<School />}
                  />
                </Stack>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <SectionTitle hint="Active learners divided by active teachers at each centre. Higher bars mean a heavier teaching load.">
                  Learners per Teacher by Centre
                </SectionTitle>

                <Box sx={{ overflowX: "auto", pb: 1 }}>
                  <Box sx={{ minWidth: capacityChartMinWidth }}>
                    <ChartBox
                      height={440}
                      hasData={capacityData.length > 0}
                    >
                      <BarChart
                        data={capacityData}
                        margin={{
                          top: 8,
                          right: 16,
                          bottom: 70,
                          left: -8,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colours.grid}
                          vertical={false}
                        />

                        <XAxis
                          dataKey="centerName"
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={90}
                          {...axisProps}
                          tick={{
                            fill: colours.axis,
                            fontSize: 12,
                          }}
                        />

                        <YAxis {...axisProps} />

                        <Tooltip
                          formatter={(value) => [
                            `${value}:1`,
                            "Learners per teacher",
                          ]}
                          {...tooltipStyle}
                          cursor={{
                            fill: theme.palette.action.hover,
                          }}
                        />

                        {toNumber(
                          capacity.organisationRatio
                        ) > 0 && (
                          <ReferenceLine
                            y={toNumber(
                              capacity.organisationRatio
                            )}
                            stroke={colours.warning}
                            strokeDasharray="5 5"
                            label={{
                              value: "Organisation average",
                              position: "insideTopRight",
                              fill: colours.warning,
                              fontSize: 11,
                            }}
                          />
                        )}

                        <Bar
                          dataKey="learnersPerTeacher"
                          name="Learners per teacher"
                          fill={colours.primary}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={56}
                        />
                      </BarChart>
                    </ChartBox>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Panel>

          <Panel value={tab} index={5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ md: "center" }}
              spacing={1.5}
              mb={2}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                flexWrap="wrap"
                useFlexGap
              >
                {commonFilters}
                {centreFilter}
              </Stack>

              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={exportTopStudents}
                disabled={topStudents.length === 0}
                sx={{ whiteSpace: "nowrap" }}
              >
                Export CSV
              </Button>
            </Stack>

            {topStudents.length === 0 ? (
              <Empty />
            ) : (
              <TableContainer
                sx={{
                  maxHeight: 420,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {[
                        "Rank",
                        "Name",
                        "Surname",
                        "Centre",
                        "Grade",
                        "Average",
                      ].map((item, index) => (
                        <TableCell
                          key={item}
                          align={index >= 4 ? "right" : "left"}
                          sx={{ fontWeight: 700 }}
                        >
                          {item}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {topStudents.map((row, index) => (
                      <TableRow
                        hover
                        key={`${
                          row.email ||
                          row.userId ||
                          "student"
                        }-${index}`}
                      >
                        <TableCell sx={{ color: "text.secondary" }}>
                          {index + 1}
                        </TableCell>

                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.surname}</TableCell>
                        <TableCell>{row.centerName}</TableCell>

                        <TableCell align="right">
                          {row.grade}
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            label={percentage(
                              row.averagePercentage
                            )}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Panel>

          <Panel value={tab} index={6}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
              mb={2}
            >
              {centreFilter}

              <Filter
                label="Grade"
                value={grade}
                onChange={setGrade}
                items={(options.grades || []).map((item) => ({
                  value: item,
                  label: `Grade ${item}`,
                }))}
              />

              <Filter
                label="Subject"
                value={subjectId}
                onChange={setSubjectId}
                items={(options.subjects || []).map((item) => ({
                  value: item.subjectId,
                  label: item.subjectName,
                }))}
              />
            </Stack>

            <SplitRow leftPct={50} breakpoint="md">
              <Box>
                <SectionTitle hint="Ratings of 4 and above count as satisfied; 3 and below as not satisfied.">
                  Subject Satisfaction
                </SectionTitle>

                <ChartBox
                  height={420}
                  hasData={
                    toNumber(satisfaction.totalResponses) > 0
                  }
                  emptyLabel="No feedback responses match this selection."
                >
                  <PieChart>
                    <Pie
                      data={satisfactionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={95}
                      outerRadius={165}
                      paddingAngle={2}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      <Cell fill={colours.success} />
                      <Cell fill={colours.warning} />
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [
                        `${formatNumber(value)} responses`,
                        name,
                      ]}
                      {...tooltipStyle}
                    />

                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ChartBox>
              </Box>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    px: 2.5,
                    pt: 2.5,
                    pb: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800}>
                    Feedback Summary
                  </Typography>
                </Box>

                <CardContent
                  sx={{
                    px: 2.5,
                    py: 1,
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Stack
                    divider={<Divider flexItem />}
                    sx={{ width: "100%" }}
                  >
                    {[
                      [
                        "Satisfaction Rate",
                        percentage(
                          satisfaction.satisfactionRate
                        ),
                        "success.main",
                      ],
                      [
                        "Satisfied",
                        formatNumber(satisfaction.satisfied),
                        "success.main",
                      ],
                      [
                        "Not Satisfied",
                        formatNumber(
                          satisfaction.notSatisfied
                        ),
                        "warning.main",
                      ],
                      [
                        "Total Responses",
                        formatNumber(
                          satisfaction.totalResponses
                        ),
                        "text.primary",
                      ],
                    ].map(([label, value, colour]) => (
                      <Stack
                        key={label}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                        py={2}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {label}
                        </Typography>

                        <Typography
                          variant="h6"
                          fontWeight={800}
                          color={colour}
                        >
                          {value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </SplitRow>
          </Panel>
        </Box>
      </Paper>

      <Dialog
        open={drilldown.open}
        onClose={() =>
          setDrilldown((current) => ({
            ...current,
            open: false,
          }))
        }
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                {drilldown.name}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Grade → Subject → Class
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setDrilldown((current) => ({
                  ...current,
                  open: false,
                }))
              }
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {drilldown.loading ? (
            <Box py={6} textAlign="center">
              <CircularProgress />
            </Box>
          ) : drilldown.rows.length === 0 ? (
            <Empty label="No classes or enrolments found for this centre." />
          ) : (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      "Grade",
                      "Subject",
                      "Class",
                      "Learners",
                      "Average",
                      "Pass Rate",
                    ].map((item, index) => (
                      <TableCell
                        key={item}
                        align={index >= 3 ? "right" : "left"}
                        sx={{ fontWeight: 700 }}
                      >
                        {item}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {drilldown.rows.map((row, index) => (
                    <TableRow
                      hover
                      key={`${row.classId}-${row.subjectId}-${index}`}
                    >
                      <TableCell>{row.grade}</TableCell>
                      <TableCell>{row.subjectName}</TableCell>
                      <TableCell>{row.className}</TableCell>

                      <TableCell align="right">
                        {formatNumber(row.learners)}
                      </TableCell>

                      <TableCell align="right">
                        {percentage(row.average)}
                      </TableCell>

                      <TableCell align="right">
                        {percentage(row.passRate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}