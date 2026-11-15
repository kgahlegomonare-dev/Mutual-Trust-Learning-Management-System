import React, { createContext, useState, useEffect } from 'react';
import { loginUser } from '../services/userService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync login status on page refresh or initialization
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Failed to restore auth session:", err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Logs a user into the application using their generated identity number
   */
  const handleLogin = async (loginNumber, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(loginNumber, password);
      
      // Save credentials downstream to browser storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || "Invalid credentials or network connection error.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs out the user and cleans up browser local storage
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  /**
   * Force updates the user context state when they complete their profile onboarding
   */
  const updateProfileContext = (updatedUserFields) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const revisedUser = { ...prevUser, ...updatedUserFields, is_profile_claimed: true };
      localStorage.setItem('user', JSON.stringify(revisedUser));
      return revisedUser;
    });
  };

  const contextValue = {
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    updateProfileContext
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/*Render children directly so the layout mounts cleanly without flash frames */}
      {children}
    </AuthContext.Provider>
  );
};