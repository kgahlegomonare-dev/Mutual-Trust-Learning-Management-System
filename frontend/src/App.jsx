import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import { AuthProvider } from './context/AuthContext';
import { ProtectedUserRoute } from './routes/userRoutes';
import Login from './features/auth/Login';
import CompleteProfile from './features/auth/CompleteProfile';
import { useAuth } from './hooks/useAuth';

// ==========================================
// SHARED FEATURES
// ==========================================
import CentersManagement from './features/shared/CentersManagement';
import ClassroomManagement from './features/shared/ClassroomManagement';
import SubjectManagement from './features/shared/SubjectManagement';
import TimetableManagement from './features/shared/TimetableManagement';
import UserManagement from './features/shared/UserManagement';

// ==========================================
// KGAHLEGO'S FEATURES
// ==========================================
import Announcements from './features/kgahlegos-features/Announcements';
import LearningMaterial from './features/kgahlegos-features/LearningMaterial';
//import LessonPlanner from './features/kgahlegos-features/LessonPlanner';

// ==========================================
// JAY'S FEATURES
// ==========================================
import Overview from './features/jays-features/Reports';
import Quizzes from './features/jays-features/Quizzes';
import Assessments from './features/jays-features/Assessments';
import GradeManagement from './features/jays-features/GradeManagement';
import Reports from './features/jays-features/Reports';
import TeacherApp from './features/jays-features/TeacherApp';
import StudentApp from './features/jays-features/StudentApp';

// ==========================================
// MIHLA'S FEATURES
// ==========================================
import DiscussionForums from './features/mihlas-features/DiscussionForums';

// ==========================================
// VHUTALI'S FEATURES
// ==========================================
import Attendance from './features/vhutalis-features/Attendance';
import LearnerFeedback from './features/vhutalis-features/LearnerFeedback';
import AttendanceOversight from './features/vhutalis-features/AttendanceOversight';
import LessonPlanner from './features/vhutalis-features/LessonPlanner';
import Flagging from './features/vhutalis-features/Flagging';
// Helper wrapper to supply active authenticated user to TeacherApp
function TeacherAppWrapper() {
  const { user } = useAuth();
  return <TeacherApp teacher={user} />;
}

// Helper wrapper to supply active authenticated user and logout handler to StudentApp
function StudentAppWrapper() {
  const { user, logout } = useAuth();
  return <StudentApp student={user} onLogout={logout} />;
}

export default function App() {
  const [currentRole, setCurrentRole] = useState('admin');

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* ROOT REDIRECT */}
          <Route path="/" element={<Navigate to="/login" replace />} />
      
          {/* ================================================= */}
          {/* ISOLATED FULL-SCREEN TEACHER ASSESSMENT ROUTE    */}
          {/* ================================================= */}
          <Route 
            path="/teacher-assessments/*" 
            element={
              <ProtectedUserRoute>
                <TeacherAppWrapper />
              </ProtectedUserRoute>
            } 
          />

          {/* ================================================= */}
          {/* ISOLATED FULL-SCREEN STUDENT ASSESSMENT ROUTE    */}
          {/* ================================================= */}
          <Route 
            path="/student-assessments/*" 
            element={
              <ProtectedUserRoute>
                <StudentAppWrapper />
              </ProtectedUserRoute>
            } 
          />

          {/* MASTER DASHBOARD LAYOUT */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedUserRoute>
                <Dashboard currentRole={currentRole} onRoleChange={setCurrentRole} />
              </ProtectedUserRoute>
            }
          >
            {/* Default Dashboard Redirection */}
            <Route index element={<Navigate to="overview" replace />} />
            
            {/* CORE / OVERVIEW */}
            <Route path="overview" element={<Overview />} />
            <Route path="announcements" element={<Announcements />} />

            {/* SHARED / ADMIN / MANAGER MANAGEMENT PANELS */}
            <Route path="centers" element={<CentersManagement />} />
            <Route path="classes" element={<ClassroomManagement />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="users" element={<UserManagement />} />

            {/* TIMETABLES */}
            <Route path="timetables" element={<TimetableManagement />} />
            <Route path="timetable" element={<TimetableManagement />} />

            {/* GRADES / MARKS */}
            <Route path="grades" element={<GradeManagement />} />
            <Route path="marks" element={<GradeManagement />} />
            <Route path="my-marks" element={<GradeManagement />} />

            {/* QUIZZES & ASSESSMENTS */}
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="my-quizzes" element={<Quizzes />} />
            <Route path="assessments" element={<Assessments />} />
            <Route path="my-assessments" element={<Assessments />} />

            {/* COMMUNICATION & FORUMS */}
            <Route path="forums" element={<DiscussionForums />} />
            <Route path="forum" element={<DiscussionForums />} />

            {/* FEEDBACK & REPORTS */}
            <Route path="feedback" element={<LearnerFeedback />} />
            <Route path="my-feedback" element={<LearnerFeedback />} />
            <Route path="reports" element={<Reports />} />
            <Route path="flagging" element={<Flagging />} />
            <Route path="my-report" element={<Reports />} />

            {/* ACADEMICS & MATERIALS */}
            <Route path="lesson-planner" element={<LessonPlanner />} />
            <Route path="lesson-plan" element={<LessonPlanner />} />
            <Route path="materials" element={<LearningMaterial />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="attendance-oversight" element={<AttendanceOversight />} />

            {/* Dashboard Catch-All Fallback */}
            <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
          </Route>

          {/* GLOBAL CATCH-ALL */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}