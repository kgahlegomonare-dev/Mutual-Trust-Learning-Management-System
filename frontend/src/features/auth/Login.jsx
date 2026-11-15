import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from "../../assets/icons/logo.svg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Component Form State
  const [loginNumber, setLoginNumber] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // Simple frontend validation guard
    if (!loginNumber.trim() || !password.trim()) {
      setLocalError('Please fill in both your operational identifier and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Fires the handler inside AuthContext
      const userProfile = await login(loginNumber, password);

      // Route navigation based on account onboarding state
      if (userProfile && !userProfile.is_profile_claimed) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/dashboard/overview', { replace: true });
      }
    } catch (err) {
      // Error message is already normalized by the context catch block
      setLocalError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* BRAND LOGO HEADER */}

        <div style={styles.logoContainer}>
          <img
            src={logo}
            alt="Kutlwanong Logo"
            style={{ ...styles.logoImage, width: "110px", height: "110px" }}
          />
        </div>

        <div style={styles.header}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>
            Sign in to access kutlwanong's learning management system
          </p>
        </div>

        {localError && (
          <div style={styles.errorAlert}>
            <span style={{ fontWeight: "600" }}> </span>
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="loginNumber">
              Operational Identifier
            </label>
            <input
              id="loginNumber"
              type="text"
              placeholder="e.g. 1002345"
              value={loginNumber}
              onChange={(e) => setLoginNumber(e.target.value)}
              disabled={isSubmitting}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitBtn,
              backgroundColor: isSubmitting ? "#94A3B8" : "#0A3161",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
            onMouseOver={(e) => {
              if (!isSubmitting)
                e.currentTarget.style.backgroundColor = "#1073f5";
            }}
            onMouseOut={(e) => {
              if (!isSubmitting)
                e.currentTarget.style.backgroundColor = "#0A3161";
            }}
          >
            {isSubmitting ? "Verifying Credentials..." : "Sign In Securely"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Scoped layout styling objects conforming to Kutlwanong Style Guide
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC', // Slate 50
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '40px 36px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0', // Slate 200
    boxShadow: '0 10px 25px -5px rgba(10, 49, 97, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
    width: '100%',
    maxWidth: '460px',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '24px',
  },
  logoSvg: {
    display: 'block',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#001A35', // Deep Navy
  },
  subtitle: {
    margin: '0',
    fontSize: '14px',
    color: '#64748B', // Muted Text
    lineHeight: '1.5',
  },
  errorAlert: {
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #FCA5A5',
    fontSize: '13px',
    marginBottom: '24px',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column', // Vertically stacked labels and inputs for modern visual flow
    marginBottom: '20px',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B', // Body dark text
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1E293B',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  submitBtn: {
    width: '100%', // Full width primary CTA button
    padding: '14px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '8px',
    transition: 'background-color 0.2s ease-in-out, transform 0.1s ease',
    boxShadow: '0 2px 4px rgba(10, 49, 97, 0.15)',
  },
};
