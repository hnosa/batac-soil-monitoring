// frontend/src/App.js (With Back to Dashboard Feature) - UPDATED FOR PRODUCTION
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Dashboard from './components/Dashboard';
import SensorMap from './components/SensorMap';
import DataCharts from './components/DataCharts';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserProfile from './components/UserProfile';
import AlertsPanel from './components/AlertsPanel';
import ExportData from './components/ExportData';
import './App.css';

// PRODUCTION-READY API CONFIGURATION
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // Relative path in production
  : 'http://localhost:3001/api';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin  // Same origin in production
  : 'http://localhost:3001';

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [latestReadings, setLatestReadings] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  
  const [alerts, setAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    overallStatus: 'healthy',
    unreadCount: 0,
    recentAlerts: []
  });

  const [showExport, setShowExport] = useState(false);

  // Check for existing token on app start
  useEffect(() => {
    const validateStoredToken = async (token) => {
      try {
        const response = await axios.get(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
        initializeApp();
      } catch (error) {
        localStorage.removeItem('token');
        setLoading(false);
      }
    };

    const token = localStorage.getItem('token');
    if (token) {
      validateStoredToken(token);
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeApp = () => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    socket.on('sensorData', (data) => {
      setSensorData(prev => [...prev, ...data].slice(-50));
    });

    socket.on('newSensorData', (newData) => {
      console.log('New real-time data:', newData);
      setSensorData(prev => [...prev, newData].slice(-50));
      
      setLatestReadings(prev => {
        const filtered = prev.filter(item => item.sensor_id !== newData.sensor_id);
        return [...filtered, newData];
      });
    });

    socket.on('newAlerts', (newAlerts) => {
      console.log('New alerts received:', newAlerts);
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 20));
    });

    socket.on('systemStatus', (status) => {
      console.log('System status updated:', status);
      setSystemStatus(status);
    });

    fetchLatestData();
    fetchHistoricalData();
    fetchAlerts();
    fetchSystemStatus();
    
    setLoading(false);
  };

  const handleLogin = async (loginData) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, loginData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      initializeApp();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const handleRegister = async (registerData) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, registerData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      initializeApp();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSensorData([]);
    setLatestReadings([]);
    setConnectionStatus('disconnected');
    setAlerts([]);
    setSystemStatus({
      overallStatus: 'healthy',
      unreadCount: 0,
      recentAlerts: []
    });
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Update failed');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/auth/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      handleLogout();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Delete failed');
    }
  };

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/alerts?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/alerts/system-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSystemStatus(response.data);
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/alerts/${alertId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlerts(prev => prev.map(alert => 
        (alert._id === alertId || alert.id === alertId) 
          ? { ...alert, isRead: true }
          : alert
      ));
      
      await fetchSystemStatus();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/alerts/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
      await fetchSystemStatus();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const handleExport = () => {
    setShowExport(true);
  };

  const fetchLatestData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sensor-data/latest`);
      setLatestReadings(response.data);
    } catch (error) {
      console.error('Error fetching latest data:', error);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sensor-data?limit=50`);
      setSensorData(response.data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  // ======== ADDED: Function to handle going back to dashboard ========
  const handleBackToDashboard = () => {
    setShowProfile(false); // Close settings modal
    setActiveTab('dashboard'); // Switch to dashboard tab
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading Batac Soil Monitoring System...</h2>
        </div>
      </div>
    );
  }

  // Show authentication screens if not logged in
  if (!user) {
    return (
      <div className="App">
        {authView === 'login' && (
          <Login 
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
            onSwitchToForgotPassword={() => setAuthView('forgot')}
          />
        )}
        {authView === 'register' && (
          <Register 
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
        {authView === 'forgot' && (
          <ForgotPassword 
            onBackToLogin={() => setAuthView('login')}
          />
        )}
        {authView === 'reset' && (
          <ResetPassword 
            onBackToLogin={() => setAuthView('login')}
          />
        )}
      </div>
    );
  }

  // Main app when user is logged in
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🌱 Batac City Soil Monitoring System</h1>
            <div className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
          
          <div className="header-right">
            <AlertsPanel
              alerts={alerts}
              systemStatus={systemStatus}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
            <div className="user-info">
              <span>Welcome, {user.name}</span>
              <button onClick={() => setShowProfile(true)} className="profile-btn">
                Settings
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <nav className="navigation">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeTab === 'map' ? 'active' : ''}
            onClick={() => setActiveTab('map')}
          >
            🗺️ Sensor Map
          </button>
          <button 
            className={activeTab === 'charts' ? 'active' : ''}
            onClick={() => setActiveTab('charts')}
          >
            📈 Analytics
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            latestReadings={latestReadings} 
            sensorData={sensorData}
            onRefresh={fetchLatestData}
            onExport={handleExport}
          />
        )}
        
        {activeTab === 'map' && (
          <SensorMap latestReadings={latestReadings} />
        )}
        
        {activeTab === 'charts' && (
          <DataCharts sensorData={sensorData} />
        )}
      </main>

      <footer className="app-footer">
        <p>Real-Time Soil Condition Monitoring System • City of Batac • Powered by ESP8266 & LoRa</p>
      </footer>
      
      {/* ======== ENHANCED USER PROFILE MODAL ======== */}
      {showProfile && (
        <UserProfile
          user={user}
          onUpdateProfile={handleUpdateProfile}
          onDeleteAccount={handleDeleteAccount}
          onClose={handleBackToDashboard} // Changed to use the new function
          showBackButton={true} // Optional: Add this prop if your UserProfile component supports it
        />
      )}
      
      {/* ======== EXPORT DATA MODAL ======== */}
      {showExport && (
        <ExportData
          sensors={latestReadings}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

export default App;