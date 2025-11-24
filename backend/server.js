// backend/server.js - COMPLETE REWRITE WITHOUT WILDCARD ISSUES
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

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure CORS for production
const io = new SocketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://batac-soil-monitoring.up.railway.app"] 
      : "*",
    methods: ["GET", "POST"]
  }
});

// Import routes
import { router as authRoutes, authenticateToken } from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import exportRoutes from './routes/export.js';

// Middleware
app.use(cors());
app.use(express.json());

// Serve React build files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// ======== API ROUTES ========
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Batac Soil Monitoring API is running!',
    database: 'MongoDB Connected ✅',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/export', exportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);

// Sensor data routes
app.get('/api/sensor-data', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const data = await sensorModel.getAllReadings(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

app.get('/api/sensor-data/latest', async (req, res) => {
  try {
    const data = await sensorModel.getLatestReadings();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest sensor data' });
  }
});

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

// Protected route
app.get('/api/protected-data', authenticateToken, (req, res) => {
  res.json({ 
    message: 'This is protected data', 
    user: req.user
  });
});

// ======== REACT APP ROUTES (Production only) ========
if (process.env.NODE_ENV === 'production') {
  // Define all possible React routes explicitly
  const reactRoutes = [
    '/',
    '/login',
    '/register', 
    '/forgot-password',
    '/reset-password',
    '/dashboard',
    '/map',
    '/charts',
    '/profile',
    '/export'
  ];

  // Serve React app for each route
  reactRoutes.forEach(route => {
    app.get(route, (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
  });

  // Serve React app for any other non-API route (without using *)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next(); // Let API routes handle themselves
    }
    // For any other route, serve React app
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Serve test page (development only)
app.get('/test', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Test page not available in production' });
  }
  res.sendFile(path.join(__dirname, 'test-client.html'));
});

// ======== SOCKET.IO ========
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
    sensor_id: `sensor_${Math.floor(Math.random() * 5) + 1}`,
    location: location,
    soil_moisture: Math.floor(30 + Math.random() * 50),
    temperature: parseFloat((25 + Math.random() * 10).toFixed(1)),
    humidity: Math.floor(60 + Math.random() * 25),
    ph_level: parseFloat((5.5 + Math.random() * 2.5).toFixed(1)),
    nitrogen: Math.floor(20 + Math.random() * 60),
    phosphorus: Math.floor(15 + Math.random() * 40),
    potassium: Math.floor(30 + Math.random() * 70),
    battery_level: Math.floor(20 + Math.random() * 80),
    timestamp: new Date()
  };
}

io.on('connection', (socket) => {
  console.log('Client connected');
  
  sensorModel.getAllReadings(10).then(data => {
    socket.emit('sensorData', data);
  });

  import('./services/alertService.js').then(AlertService => {
    AlertService.default.getSystemStatus().then(status => {
      socket.emit('systemStatus', status);
    });
  });
  
  const interval = setInterval(async () => {
    const newData = generateMockSensorData();
    
    try {
      await sensorModel.createSensorReading(newData);
      const AlertService = await import('./services/alertService.js');
      const newAlerts = await AlertService.default.checkSensorConditions(newData);
      
      io.emit('newSensorData', newData);
      
      if (newAlerts.length > 0) {
        io.emit('newAlerts', newAlerts);
        const status = await AlertService.default.getSystemStatus();
        io.emit('systemStatus', status);
      }
      
      console.log('📊 New sensor data saved:', newData.sensor_id);
    } catch (error) {
      console.error('Error saving sensor data:', error);
    }
  }, 5000);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

// Create demo user
async function createDemoUser() {
  try {
    const userModel = await import('./models/userModel.js');
    const demoUser = {
      name: 'Demo User',
      email: 'demo@batac.gov.ph',
      password: 'demo123'
    };
    
    await userModel.default.createUser(demoUser);
    console.log('✅ Demo user created: demo@batac.gov.ph / demo123');
  } catch (error) {
    if (error.message === 'User already exists') {
      console.log('✅ Demo user already exists');
    }
  }
}

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    await createDemoUser();
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Batac Soil Monitoring API is ready!`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();