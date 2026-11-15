import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Route Guard: Verifies authentication, forces profile completion for unclaimed accounts,
 * and handles strict Role-Based Access Control (RBAC).
 */
export const ProtectedUserRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // 1. Wait until AuthContext finishes checking localStorage on refresh
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', color: '#666' }}>
        Verifying security clearance tokens...
      </div>
    );
  }

  // 2. Kick out unauthenticated visitors
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Force onboarding step if the account has not been claimed yet
  if (!user.is_profile_claimed) {
    return <Navigate to="/complete-profile" replace />;
  }

  // 4. RBAC Check: Case-Insensitive evaluation ensures user role matches allowed view permissions
  if (allowedRoles.length > 0) {
    const lowerAllowed = allowedRoles.map(role => role.toLowerCase());
    const currentUserRole = user.user_role ? user.user_role.toLowerCase() : '';

    if (!lowerAllowed.includes(currentUserRole)) {
      return <Navigate to="/dashboard/overview" replace />;
    }
  }

  // All checks passed! Render the target workspace page
  return children;
};