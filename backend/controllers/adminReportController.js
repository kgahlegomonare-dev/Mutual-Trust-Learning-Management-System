import * as service from "../services/adminReportService.js";

const CSV_FIELDS = [
  { label: "Name", value: "name" },
  { label: "Surname", value: "surname" },
  { label: "ID Number", value: "idNumber" },
  { label: "Contact Number", value: "contactNumber" },
  { label: "Email", value: "email" },
  { label: "Average Percentage", value: "averagePercentage" },
  { label: "Centre", value: "centerName" },
  { label: "Grade", value: "grade" },
];

const escapeCsv = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const fallbackCsv = (rows) =>
  [
    CSV_FIELDS.map((f) => escapeCsv(f.label)).join(","),
    ...rows.map((r) => CSV_FIELDS.map((f) => escapeCsv(r[f.value])).join(",")),
  ].join("\r\n");

async function toCsv(rows) {
  for (const mod of ["@json2csv/plainjs", "json2csv"]) {
    try {
      const { Parser } = await import(mod);
      if (typeof Parser === "function") {
        return new Parser({ fields: CSV_FIELDS }).parse(rows);
      }
    } catch {
      // Module not installed, or no Parser export in this version: try the next.
    }
  }
  return fallbackCsv(rows);
}

const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const toNumber = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const filters = (req) => ({
  term: toId(req.query.term),
  grade: toNumber(req.query.grade),
  subjectId: toId(req.query.subjectId),
  centerId: toId(req.query.centerId),
});

const send = (res, data) => res.json({ success: true, data });

// Logs the underlying error before handing it to the error middleware, so the
// real Postgres message reaches the server log instead of being swallowed.
const fail = (req, next) => (e) => {
  console.error(`[adminReports] ${req.method} ${req.originalUrl} failed:`, e);
  next(e);
};

export async function getOverview(req, res, next) {
  try { send(res, await service.getOverview()); } catch (e) { fail(req, next)(e); }
}

export async function getOrganisationPerformanceTrend(req, res, next) {
  try { send(res, await service.getOrganisationPerformanceTrend(filters(req))); } catch (e) { fail(req, next)(e); }
}

export async function getCenterPerformance(req, res, next) {
  try { send(res, await service.getCenterPerformance(filters(req))); } catch (e) { fail(req, next)(e); }
}

export async function getCenterHealth(req, res, next) {
  try { send(res, await service.getCenterHealth()); } catch (e) { fail(req, next)(e); }
}

export async function getCenterDrilldown(req, res, next) {
  try {
    const centerId = toId(req.params.centerId);
    if (!centerId) return res.status(400).json({ success: false, message: "A valid centerId is required." });
    send(res, await service.getCenterDrilldown(centerId));
  } catch (e) { fail(req, next)(e); }
}

export async function getAttendanceTrend(req, res, next) {
  try { send(res, await service.getAttendanceTrend()); } catch (e) { fail(req, next)(e); }
}

export async function getAttendanceByCenter(req, res, next) {
  try { send(res, await service.getAttendanceByCenter()); } catch (e) { fail(req, next)(e); }
}

export async function getLowAttendanceDistribution(req, res, next) {
  try {
    const t = Math.min(100, Math.max(0, Number(req.query.threshold) || 75));
    send(res, await service.getLowAttendanceDistribution(t));
  } catch (e) { fail(req, next)(e); }
}

export async function getSubjectPerformance(req, res, next) {
  try { send(res, await service.getSubjectPerformance(filters(req))); } catch (e) { fail(req, next)(e); }
}

export async function getCapacityAnalytics(req, res, next) {
  try { send(res, await service.getCapacityAnalytics()); } catch (e) { fail(req, next)(e); }
}

export async function getTopStudents(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    send(res, await service.getTopStudents({ ...filters(req), limit }));
  } catch (e) { fail(req, next)(e); }
}

export async function getSubjectSatisfaction(req, res, next) {
  try { send(res, await service.getSubjectSatisfaction(filters(req))); } catch (e) { fail(req, next)(e); }
}

export async function getReportFilters(req, res, next) {
  try { send(res, await service.getReportFilters()); } catch (e) { fail(req, next)(e); }
}

export async function exportTopStudents(req, res, next) {
  try {
    const rows = await service.getTopStudents({ ...filters(req), limit: 1000 });
    const csv = await toCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="top-performing-learners.csv"');
    // BOM so Excel opens UTF-8 names correctly.
    res.send("\uFEFF" + csv);
  } catch (e) { fail(req, next)(e); }
}
