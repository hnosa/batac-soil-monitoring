// backend/server.js - UPDATED FOR PRODUCTION
// Load environment variables first!
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIo } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database imports
import { connectToDatabase } from './config/database.js';
import sensorModel from './models/sensorModel.js';

// Create Express app FIRST
const app = express();
const server = http.createServer(app);

// Configure CORS for production
const io = new SocketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://your-project.up.railway.app"] // Replace with your actual Railway URL
      : "*",
    methods: ["GET", "POST"]
  }
});

// ======== IMPORT ROUTES ========
import { router as authRoutes, authenticateToken } from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import exportRoutes from './routes/export.js';

// Middleware
app.use(cors());
app.use(express.json());

// ======== PRODUCTION SETUP ========
// Serve React build files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// ======== ROUTES ========
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Batac Soil Monitoring API is running!',
    database: 'MongoDB Connected ✅',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      getAllData: 'GET /api/sensor-data',
      getLatest: 'GET /api/sensor-data/latest',
      getSensor: 'GET /api/sensor-data/sensor/:sensorId'
    }
  });
});

// API Routes
app.use('/api/export', exportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);

// Get all sensor data from database
app.get('/api/sensor-data', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const data = await sensorModel.getAllReadings(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// Get latest data from each sensor from database
app.get('/api/sensor-data/latest', async (req, res) => {
  try {
    const data = await sensorModel.getLatestReadings();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest sensor data' });
  }
});

// Get data for specific sensor
app.get('/api/sensor-data/sensor/:sensorId', async (req, res) => {
  try {
    const { sensorId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const data = await sensorModel.getReadingsBySensor(sensorId, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// Protected route example
app.get('/api/protected-data', authenticateToken, (req, res) => {
  res.json({ 
    message: 'This is protected data', 
    user: req.user,
    sensitiveData: 'Confidential soil analytics'
  });
});

// ======== SIMPLE CATCH-ALL FIX ========
if (process.env.NODE_ENV === 'production') {
  // Serve React app for non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Serve the test client page (development only)
app.get('/test', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Test page not available in production' });
  }
  res.sendFile(path.join(__dirname, 'test-client.html'));
});

// ======== SOCKET.IO WITH ALERTS ========
// Realistic mock data generator for Batac City soil conditions
function generateMockSensorData() {
  const locations = [
    { name: "Batac Farm 1", lat: 18.0554, lng: 120.5649 },
    { name: "Batac Farm 2", lat: 18.0589, lng: 120.5612 },
    { name: "Batac Farm 3", lat: 18.0521, lng: 120.5687 },
    { name: "Batac Farm 4", lat: 18.0498, lng: 120.5573 },
    { name: "Batac Farm 5", lat: 18.0612, lng: 120.5714 }
  ];

  const location = locations[Math.floor(Math.random() * locations.length)];
  
  return {
    sensor_id: `sensor_${Math.floor(Math.random() * 5) + 1}`, // Only 5 sensors for consistency
    location: location,
    soil_moisture: Math.floor(30 + Math.random() * 50), // 30-80%
    temperature: parseFloat((25 + Math.random() * 10).toFixed(1)), // 25-35°C
    humidity: Math.floor(60 + Math.random() * 25), // 60-85%
    ph_level: parseFloat((5.5 + Math.random() * 2.5).toFixed(1)), // 5.5-8.0
    nitrogen: Math.floor(20 + Math.random() * 60), // ppm
    phosphorus: Math.floor(15 + Math.random() * 40), // ppm
    potassium: Math.floor(30 + Math.random() * 70), // ppm
    battery_level: Math.floor(20 + Math.random() * 80), // 20-100%
    timestamp: new Date()
  };
}

// Socket.io setup
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial data from database
  sensorModel.getAllReadings(10).then(data => {
    socket.emit('sensorData', data);
  });

  // Send initial system status
  import('./services/alertService.js').then(AlertService => {
    AlertService.default.getSystemStatus().then(status => {
      socket.emit('systemStatus', status);
    });
  });
  
  // Simulate real-time data updates every 5 seconds
  const interval = setInterval(async () => {
    const newData = generateMockSensorData();
    
    try {
      // Save to database
      await sensorModel.createSensorReading(newData);
      
      // Check for alerts
      const AlertService = await import('./services/alertService.js');
      const newAlerts = await AlertService.default.checkSensorConditions(newData);
      
      // Send new data to all connected clients
      io.emit('newSensorData', newData);
      
      // Send alerts if any
      if (newAlerts.length > 0) {
        io.emit('newAlerts', newAlerts);
        
        // Update system status
        const status = await AlertService.default.getSystemStatus();
        io.emit('systemStatus', status);
      }
      
      console.log('📊 New sensor data saved to database:', newData.sensor_id);
    } catch (error) {
      console.error('Error saving sensor data:', error);
    }
  }, 5000);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

// Initialize server
async function startServer() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    // Create demo user if doesn't exist
    await createDemoUser();
    
    // Start server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Batac Soil Monitoring API is ready!`);
      console.log(`🗄️  MongoDB Database: Connected`);
      console.log(`🔐 Authentication: Demo user available`);
      console.log(`⚠️  Alert System: Active`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`📍 Production URL: https://your-project.up.railway.app`);
      } else {
        console.log(`📍 Visit: http://localhost:${PORT}`);
        console.log(`🧪 Test Client: http://localhost:${PORT}/test`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Create demo user function
async function createDemoUser() {
  try {
    const userModel = await import('./models/userModel.js');
    const demoUser = {
      name: 'Demo User',
      email: 'demo@batac.gov.ph',
      password: 'demo123'
    };
    
    // Try to create demo user, ignore if already exists
    await userModel.default.createUser(demoUser);
    console.log('✅ Demo user created: demo@batac.gov.ph / demo123');
  } catch (error) {
    if (error.message === 'User already exists') {
      console.log('✅ Demo user already exists');
    } else {
      console.log('⚠️  Demo user creation skipped:', error.message);
    }
  }
}

// Start the server
startServer();