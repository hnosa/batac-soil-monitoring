// frontend/src/components/SensorMap.js
import React from 'react';
import './SensorMap.css';

const SensorMap = ({ latestReadings }) => {
  // Simple map visualization using CSS - we'll add a real map later
  return (
    <div className="sensor-map">
      <div className="map-header">
        <h2>🗺️ Sensor Locations - Batac City</h2>
        <p>Real-time sensor positions across Batac farms</p>
      </div>

      <div className="map-container">
        <div className="simple-map">
          {latestReadings.map((sensor, index) => (
            <div 
              key={sensor.sensor_id}
              className="sensor-marker"
              style={{
                left: `${(sensor.location.lng - 120.55) * 1000}px`,
                top: `${(sensor.location.lat - 18.04) * 1000}px`
              }}
            >
              <div className="marker-pin"></div>
              <div className="sensor-info">
                <h4>{sensor.sensor_id}</h4>
                <p>{sensor.location.name}</p>
                <p>Moisture: {sensor.soil_moisture}%</p>
                <p>Temp: {sensor.temperature}°C</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sensors-list">
        <h3>Active Sensors</h3>
        <div className="sensors-grid">
          {latestReadings.map(sensor => (
            <div key={sensor.sensor_id} className="sensor-item">
              <div className="sensor-marker mini"></div>
              <div className="sensor-details">
                <strong>{sensor.sensor_id}</strong>
                <span>{sensor.location.name}</span>
                <small>📍 {sensor.location.lat.toFixed(4)}, {sensor.location.lng.toFixed(4)}</small>
              </div>
              <div className="sensor-status">
                <div className={`status-indicator ${sensor.soil_moisture < 40 ? 'warning' : 'good'}`}>
                  {sensor.soil_moisture}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {latestReadings.length === 0 && (
        <div className="no-sensors">
          <p>No active sensors detected. Waiting for connections...</p>
        </div>
      )}
    </div>
  );
};

export default SensorMap;