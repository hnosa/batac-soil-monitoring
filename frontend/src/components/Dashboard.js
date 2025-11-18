// frontend/src/components/Dashboard.js
import React from 'react';
import './Dashboard.css';

const Dashboard = ({ latestReadings, sensorData, onRefresh, onExport }) => {
  const getMoistureStatus = (moisture) => {
    if (moisture < 25) return { status: 'Critical', class: 'critical', emoji: '🔴' };
    if (moisture < 40) return { status: 'Dry', class: 'warning', emoji: '🟡' };
    return { status: 'Good', class: 'good', emoji: '🟢' };
  };

  const getPHStatus = (ph) => {
    if (ph < 6.0 || ph > 7.5) return { status: 'Poor', class: 'warning', emoji: '🟡' };
    return { status: 'Optimal', class: 'good', emoji: '🟢' };
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Real-Time Sensor Dashboard</h2>
        <div className="dashboard-actions">
          <button onClick={onRefresh} className="refresh-btn">
            🔄 Refresh Data
          </button>
          <button onClick={onExport} className="export-btn">
            📥 Export Data
          </button>
        </div>
      </div>

      <div className="sensors-grid">
        {latestReadings.map((sensor) => {
          const moistureStatus = getMoistureStatus(sensor.soil_moisture);
          const phStatus = getPHStatus(sensor.ph_level);
          
          return (
            <div key={sensor.sensor_id} className="sensor-card">
              <div className="sensor-header">
                <h3>{sensor.sensor_id}</h3>
                <span className="location">{sensor.location.name}</span>
              </div>
              
              <div className="sensor-data">
                <div className="data-row">
                  <span className="label">💧 Moisture:</span>
                  <span className={`value ${moistureStatus.class}`}>
                    {sensor.soil_moisture}% {moistureStatus.emoji}
                  </span>
                </div>
                
                <div className="data-row">
                  <span className="label">🌡️ Temperature:</span>
                  <span className="value">{sensor.temperature}°C</span>
                </div>
                
                <div className="data-row">
                  <span className="label">💦 Humidity:</span>
                  <span className="value">{sensor.humidity}%</span>
                </div>
                
                <div className="data-row">
                  <span className="label">🧪 pH Level:</span>
                  <span className={`value ${phStatus.class}`}>
                    {sensor.ph_level} {phStatus.emoji}
                  </span>
                </div>
                
                <div className="data-row nutrients">
                  <span className="label">🌱 Nutrients:</span>
                  <div className="nutrient-values">
                    <span>N: {sensor.nitrogen}ppm</span>
                    <span>P: {sensor.phosphorus}ppm</span>
                    <span>K: {sensor.potassium}ppm</span>
                  </div>
                </div>
                
                <div className="data-row">
                  <span className="label">🔋 Battery:</span>
                  <span className="value">{sensor.battery_level}%</span>
                </div>
              </div>
              
              <div className="sensor-footer">
                <span className="timestamp">
                  Updated: {new Date(sensor.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {latestReadings.length === 0 && (
        <div className="no-data">
          <p>No sensor data available. Waiting for connections...</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;