import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CompleteProfile from './components/CompleteProfile';
import EditProfile from './components/EditProfile';
import EventsList from './components/EventsList';
import EventDetails from './components/EventDetails';
import AdminEvents from './components/AdminEvents';
import AdminEventDetail from './components/AdminEventDetail';
import AdminParticipantManagement from './components/AdminParticipantManagement';
import AdminEvaluators from './components/AdminEvaluators';
import AdminAttendance from './components/AdminAttendance';
import EvaluatorLogin from './components/EvaluatorLogin';
import EvaluatorPortal from './components/EvaluatorPortal';
import PublicProfile from './components/PublicProfile';
import ProjectSubmission from './components/ProjectSubmission';
import AdminProjectReview from './components/AdminProjectReview';
import Feedback from './components/Feedback';
import AdminFeedback from './components/AdminFeedback';
import AdminUsers from './components/AdminUsers';
import AdminAuditLogs from './components/AdminAuditLogs';
import AdminDocuments from './components/AdminDocuments';
import AdminOverview from './components/AdminOverview';
import AdminTeam from './components/AdminTeam';
import ProtectedRoute from './components/ProtectedRoute';
import WinnersBoard from './components/WinnersBoard';
import AppLayout from './components/AppLayout';

// Global OAuth persistence
axios.defaults.withCredentials = true;

// Safe LocalStorage Access
const getSafeToken = () => {
  try { return localStorage.getItem('sid'); } catch { return null; }
};
const setSafeToken = (val) => {
  try { localStorage.setItem('sid', val); } catch {}
};

// Axios interceptor for session fallback
axios.interceptors.request.use(config => {
  const token = getSafeToken();
  if (token) config.headers['x-auth-token'] = token;
  return config;
});

// Capture session ID from URL
try {
  const urlParams = new URLSearchParams(window.location.search);
  const sid = urlParams.get('sid');
  if (sid) {
    setSafeToken(sid);
    window.history.replaceState({}, document.title, window.location.pathname + (window.location.hash || ''));
  }
} catch (e) {
  console.error('Auth capture error:', e);
}

// Helper: wrap in ProtectedRoute + AppLayout (sidebar included)
const Protected = ({ children }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login"            element={<Login />} />
        <Route path="/profile/:id"      element={<PublicProfile />} />
        <Route path="/evaluator/login"  element={<EvaluatorLogin />} />
        <Route path="/evaluator/portal" element={<EvaluatorPortal />} />

        {/* Complete Profile — protected but no sidebar yet */}
        <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

        {/* Protected + Sidebar Routes */}
        <Route path="/dashboard"              element={<Protected><Dashboard /></Protected>} />
        <Route path="/dashboard.html"         element={<Navigate to="/dashboard" replace />} />
        <Route path="/edit-profile"           element={<Protected><EditProfile /></Protected>} />
        <Route path="/events"                 element={<Protected><EventsList /></Protected>} />
        <Route path="/events/:id"             element={<Protected><EventDetails /></Protected>} />
        <Route path="/events/:id/project-submission" element={<Protected><ProjectSubmission /></Protected>} />
        <Route path="/events/:id/winners"     element={<Protected><WinnersBoard /></Protected>} />
        <Route path="/feedback"               element={<Protected><Feedback /></Protected>} />

        {/* Admin Routes */}
        <Route path="/admin"                           element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"                 element={<Protected><AdminOverview /></Protected>} />
        <Route path="/admin/team"                      element={<Protected><AdminTeam /></Protected>} />
        <Route path="/admin/events"                    element={<Protected><AdminEvents /></Protected>} />
        <Route path="/admin/events/:id"                element={<Protected><AdminEventDetail /></Protected>} />
        <Route path="/admin/events/:id/participants"   element={<Protected><AdminParticipantManagement /></Protected>} />
        <Route path="/admin/events/:id/evaluators"     element={<Protected><AdminEvaluators /></Protected>} />
        <Route path="/admin/events/:id/attendance"     element={<Protected><AdminAttendance /></Protected>} />
        <Route path="/admin/events/:id/project-review" element={<Protected><AdminProjectReview /></Protected>} />
        <Route path="/admin/feedback"                  element={<Protected><AdminFeedback /></Protected>} />
        <Route path="/admin/users"                     element={<Protected><AdminUsers /></Protected>} />
        <Route path="/admin/audit"                     element={<Protected><AdminAuditLogs /></Protected>} />
        <Route path="/admin/documents"                 element={<Protected><AdminDocuments /></Protected>} />

        {/* Root → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
