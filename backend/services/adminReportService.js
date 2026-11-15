import * as repository from "../repositories/adminReportRepository.js";

export const getOverview = () => repository.getOverview();
export const getOrganisationPerformanceTrend = (filters) => repository.getOrganisationPerformanceTrend(filters);
export const getCenterPerformance = (filters) => repository.getCenterPerformance(filters);
export const getCenterHealth = () => repository.getCenterHealth();
export const getCenterDrilldown = (centerId) => repository.getCenterDrilldown(centerId);
export const getAttendanceTrend = () => repository.getAttendanceTrend();
export const getAttendanceByCenter = () => repository.getAttendanceByCenter();
export const getLowAttendanceDistribution = (threshold) => repository.getLowAttendanceDistribution(threshold);
export const getSubjectPerformance = (filters) => repository.getSubjectPerformance(filters);
export const getCapacityAnalytics = () => repository.getCapacityAnalytics();
export const getTopStudents = (filters) => repository.getTopStudents(filters);
export const getSubjectSatisfaction = (filters) => repository.getSubjectSatisfaction(filters);
export const getReportFilters = () => repository.getReportFilters();
