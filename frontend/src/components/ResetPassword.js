// frontend/src/components/ResetPassword.js - UPDATED FOR PRODUCTION
import React, { useState, useEffect } from 'react';
import './Auth.css';

// PRODUCTION-READY API CONFIGURATION
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // Relative path in production
  : 'http://localhost:3001/api';

const ResetPassword = ({ onSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const [token, setToken] = useState('');

  // Get token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    setToken(urlToken);
    
    if (urlToken) {
      verifyToken(urlToken);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-reset-token/${tokenToVerify}`);
      const data = await response.json();
      setTokenValid(data.valid);
    } catch (error) {
      setTokenValid(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      } else {
        setMessage(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Invalid Reset Link</h2>
          <p>The password reset link is invalid or has expired.</p>
          <button onClick={onBackToLogin} className="auth-button">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Invalid or Expired Link</h2>
          <p>This password reset link is invalid or has expired. Please request a new one.</p>
          <button onClick={onBackToLogin} className="auth-button">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verifying Link...</h2>
          <p>Please wait while we verify your reset link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔄 Reset Password</h2>
        <p>Enter your new password</p>
        
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="auth-switch">
          <button onClick={onBackToLogin} className="switch-button">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;