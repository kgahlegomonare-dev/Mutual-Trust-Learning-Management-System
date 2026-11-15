import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { completeUserProfile } from '../../services/userService';

const CompleteProfile = () => {
  const { user, updateProfileContext, logout } = useAuth();
  const navigate = useNavigate();

  // Form Field Local State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [uiState, setUiState] = useState({
    loading: false,
    error: null,
    success: false,
  });

  // CLEAN SIDE EFFECT: Handles rogue users safely after the initial paint cycle completes
  useEffect(() => {
    if (user && user.is_profile_claimed) {
      navigate('/dashboard/overview');
    }
  }, [user, navigate]);

  // If the user's profile is already active, return an empty template to prevent form flicker
  if (user && user.is_profile_claimed) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, newPassword, confirmPassword } = formData;

    if (!firstName.trim() || !lastName.trim() || !newPassword) {
      setUiState((prev) => ({ ...prev, error: "All input data fields are strictly required." }));
      return;
    }

    if (newPassword.length < 6) {
      setUiState((prev) => ({ ...prev, error: "Your permanent password must be at least 6 characters long." }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setUiState((prev) => ({ ...prev, error: "Password confirmation mismatch. Please verify entries." }));
      return;
    }

    setUiState({ loading: true, error: null, success: false });

    try {
      const result = await completeUserProfile(firstName.trim(), lastName.trim(), newPassword);

      updateProfileContext({
        first_name: result.user.first_name,
        last_name: result.user.last_name,
      });

      setUiState({ loading: false, error: null, success: true });

      setTimeout(() => {
        navigate('/dashboard/overview');
      }, 1500);

    } catch (err) {
      setUiState({
        loading: false,
        error: err.response?.data?.message || "Failed to initialize profile. Please try again.",
        success: false,
      });
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '60px auto', padding: '30px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '10px', color: '#1a1a1a' }}>Claim Your Account Workspace</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Welcome! Please provide your official name details and establish a secure password to finalize your profile setup.
      </p>

      {uiState.error && (
        <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '14px' }}>
          {uiState.error}
        </div>
      )}

      {uiState.success && (
        <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontSize: '14px' }}>
          Profile verified successfully! Redirecting to workspace...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '640' }}>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            disabled={uiState.loading || uiState.success}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '640' }}>Surname (Last Name)</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            disabled={uiState.loading || uiState.success}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '640' }}>New Secure Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            disabled={uiState.loading || uiState.success}
            required
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '640' }}>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            disabled={uiState.loading || uiState.success}
            required
          />
        </div>

        <button
          type="submit"
          style={{ width: '100%', padding: '12px', backgroundColor: uiState.loading ? '#9e9e9e' : '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          disabled={uiState.loading || uiState.success}
        >
          {uiState.loading ? 'Saving Profile...' : 'Complete Registration'}
        </button>
      </form>

      <button
        onClick={logout}
        style={{ width: '100%', marginTop: '12px', padding: '10px', backgroundColor: 'transparent', color: '#757575', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
        disabled={uiState.loading}
      >
        Cancel and Sign Out
      </button>
    </div>
  );
};

export default CompleteProfile;