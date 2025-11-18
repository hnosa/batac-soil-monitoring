// frontend/src/components/ForgotPassword.js - UPDATED FOR PRODUCTION
import React, { useState } from 'react';
import './Auth.css';

// PRODUCTION-READY API CONFIGURATION
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // Relative path in production
  : 'http://localhost:3001/api';

const ForgotPassword = ({ onBackToLogin, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        setMessage('Password reset instructions have been sent to your email.');
        if (data.resetToken) {
          setMessage(`Development mode - Use this token: ${data.resetToken}`);
        }
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>📧 Check Your Email</h2>
          <div className="success-message">
            <p>{message}</p>
            <p>Follow the instructions in the email to reset your password.</p>
          </div>
          <button onClick={onBackToLogin} className="auth-button">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔐 Forgot Password</h2>
        <p>Enter your email to reset your password</p>
        
        {message && (
          <div className={`message ${message.includes('sent') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>Remember your password? 
            <button onClick={onBackToLogin} className="switch-button">
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;