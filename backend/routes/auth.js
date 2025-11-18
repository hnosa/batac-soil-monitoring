// backend/routes/auth.js - CONVERTED TO ES MODULES
import express from 'express';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'batac-soil-monitoring-secret-key';

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await userModel.createUser({ name, email, password });
    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userModel.validateUser(email, password);
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Verify token middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userModel.getUserById(req.user.userId);
    res.json({ user });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    // Delete user from database
    await userModel.deleteUser(req.user.userId);
    
    res.json({ 
      message: 'Account deleted successfully',
      deleted: true 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const updatedUser = await userModel.updateUser(req.user.userId, { name, email });
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { resetToken, user } = await userModel.createPasswordResetToken(email);
    
    // Send email (in development, we'll log the token)
    if (process.env.NODE_ENV === 'production') {
      const EmailService = await import('../services/emailService.js');
      await EmailService.default.sendPasswordResetEmail(email, resetToken);
    } else {
      console.log('📧 Development mode - Password reset token:', resetToken);
      console.log('📧 Reset link:', `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);
    }

    res.json({ 
      message: 'Password reset email sent successfully',
      // In development, return token for testing
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    });
  } catch (error) {
    // Don't reveal if email exists or not
    res.json({ 
      message: 'If the email exists, a password reset link has been sent' 
    });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await userModel.resetPassword(token, newPassword);

    res.json({
      message: 'Password reset successfully',
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // We'll reuse the resetPassword method to validate token
    const user = await userModel.resetPassword(token, 'temporary-password');
    
    // If we get here, token is valid
    res.json({ 
      valid: true,
      email: user.email 
    });
  } catch (error) {
    res.json({ 
      valid: false,
      error: error.message 
    });
  }
});

// Export router and middleware separately
export { router };