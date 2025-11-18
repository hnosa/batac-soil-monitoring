// frontend/src/components/Login.js
import React, { useState } from 'react';
import './Auth.css';

const Login = ({ onLogin, onSwitchToRegister, onSwitchToForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🌱 Welcome Back</h2>
        <p>Sign in to your Batac Soil Monitoring account</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          {/* Add Forgot Password Link */}
          <div className="auth-options">
            <button 
              type="button" 
              onClick={onSwitchToForgotPassword} 
              className="forgot-password-link"
            >
              Forgot your password?
            </button>
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>Don't have an account? 
            <button onClick={onSwitchToRegister} className="switch-button">
              Sign Up
            </button>
          </p>
        </div>

        <div className="demo-credentials">
          <h4>Demo Credentials:</h4>
          <p>Email: demo@batac.gov.ph</p>
          <p>Password: demo123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;