import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to instantly access the active authentication state, roles, and session triggers
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be executed within an explicit and active <AuthProvider> wrapper block.');
  }
  
  return context;
};