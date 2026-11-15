import userManIcon from "../public/icons/pixel--management.svg"
import analyticsIcon from "../public/icons/uil--analytics.svg"
import CenterManIcon from "../public/icons/center-icon.svg"
import HomeIcon from "../public/icons/material-symbols--home-outline-rounded.svg"
import AssessmentIcon from "../public/icons/exam.svg"
import ClassesIcon from "../public/icons/classes.svg"
import ResultsIcon from "../public/icons/results.svg"

// Type aliases for the menu and sub menu items
export type SubMenuItem = { label: string; path: string };
export type MenuItem = { label: string; icon: string; subMenu?: SubMenuItem[]; path?: string };

// ADMIN MENU
export const adminSidebarMenu: MenuItem[] = [
  {
    label: "Home", icon: HomeIcon, path: "/admin/home"
  },
  { 
    label: "User Management",
    icon: userManIcon,
    subMenu: [
      { label: "register users", path: "/admin/register-users" },
      { label: "view users", path: "/admin/view-users" }
    ]
  },
  {
    label: "Center Management",
    icon: CenterManIcon,
    subMenu: [
      { label: "create centers", path: "/admin/create-centers" }, 
      { label: "view centers", path: "/admin/view-centers" }
    ]
  },
  {
    label: "Academic Analytics",
    icon: analyticsIcon,
    subMenu: [
      { label: "academics", path: "/admin/academic-analytics" } // Fixed path from /manager/ to /admin/
    ]
  },
];

// MANAGER MENU
export const managerSidebarMenu: MenuItem[] = [
  {
    label: "Home", icon: HomeIcon, path: "/manager/home"
  },
  {
    label: "User Management", icon: userManIcon, 
    subMenu: [
      { label: "Register Users", path: "/manager/register-users" },
      { label: "View Users", path: "/manager/view-users" }
    ]
  },
  {
    label: "Center Management", icon: CenterManIcon, 
    subMenu: [
      { label: "Create Class Venues", path: "/manager/create-class-venues" },
      { label: "Create Timetables", path: "/manager/create-timetables" }
    ]
  },
  {
    label: "Analytics", icon: analyticsIcon,
    subMenu: [
      { label: "attendance", path: "/manager/attendance-analytics" },
      { label: "academics", path: "/manager/academic-analytics" }
    ]
  }
];

// TEACHER MENU
export const teacherSidebarMenu: MenuItem[] = [
  { label: "Home", icon: HomeIcon, path: "/teacher/home" },
  {
    label: "Assessments", icon: AssessmentIcon,
    subMenu: [
      { label: "Record Marks", path: "/teacher/record-marks" },
      { label: "Release Marks", path: "/teacher/release-marks" }
    ]
  },
  {
    label: "Class management", icon: ClassesIcon,
    subMenu: [
      { label: "Take Attendance", path: "/teacher/take-attendance" }
    ]
  },
  {
    label: "Analytics", icon: analyticsIcon,
    subMenu: [
      { label: "attendance", path: "/teacher/attendance-analytics" },
      { label: "academics", path: "/teacher/academic-analytics" }
    ]
  }
];

// LEARNER MENU
export const learnerSidebarMenu: MenuItem[] = [
  { label: "Home", icon: HomeIcon, path: "/learner/home" },
  {
    label: "Classes", icon: ClassesIcon,
    subMenu: [
      { label: "Enter Attendance Code", path: "/learner/submit-attendance" }
    ]
  },
  { label: "Results", icon: ResultsIcon, path: "/learner/view-results" },
  {
    label: "Analytics", icon: analyticsIcon,
    subMenu: [
      { label: "academics", path: "/learner/academic-analytics" }
    ]
  }
];