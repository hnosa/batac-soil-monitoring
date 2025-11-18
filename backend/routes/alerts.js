// backend/routes/alerts.js - CONVERTED TO ES MODULES
import express from 'express';
import alertModel from '../models/alertModel.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, includeRead = false } = req.query;
    const alerts = await alertModel.getAlerts(parseInt(limit), includeRead === 'true');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Mark alert as read
router.patch('/:alertId/read', authenticateToken, async (req, res) => {
  try {
    await alertModel.markAsRead(req.params.alertId);
    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Mark all alerts as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await alertModel.markAllAsRead();
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alerts' });
  }
});

// Get system status
router.get('/system-status', authenticateToken, async (req, res) => {
  try {
    const AlertService = await import('../services/alertService.js');
    const status = await AlertService.default.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

export default router;