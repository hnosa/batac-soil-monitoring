// frontend/src/components/ExportData.js - UPDATED FOR PRODUCTION
import React, { useState } from 'react';
import './ExportData.css';

// PRODUCTION-READY API CONFIGURATION
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // Relative path in production
  : 'http://localhost:3001/api';

const ExportData = ({ sensors, onClose }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'csv',
    sensorId: 'all',
    startDate: getPastDate(7), // Default to last 7 days
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [loading, setLoading] = useState(false);

  // Helper function to get past date
  function getPastDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Validate dates
      const today = new Date().toISOString().split('T')[0];
      if (exportSettings.startDate > today || exportSettings.endDate > today) {
        alert('Cannot select future dates. Please select today or past dates.');
        setLoading(false);
        return;
      }

      if (exportSettings.startDate && exportSettings.endDate && exportSettings.startDate > exportSettings.endDate) {
        alert('Start date cannot be after end date.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      
      if (exportSettings.startDate) params.append('startDate', exportSettings.startDate);
      if (exportSettings.endDate) params.append('endDate', exportSettings.endDate);
      if (exportSettings.sensorId !== 'all') params.append('sensorId', exportSettings.sensorId);

      const endpoint = exportSettings.format === 'csv' ? 'csv' : 'json';
      const url = `${API_BASE}/export/sensor-data/${endpoint}?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Create download link
      const blob = await response.blob();
      
      // Check if blob is empty
      if (blob.size === 0) {
        throw new Error('Export file is empty');
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `batac-soil-data.${exportSettings.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      alert('Data exported successfully!');

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setExportSettings({
      ...exportSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleClearDates = () => {
    setExportSettings({
      ...exportSettings,
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="export-modal">
      <div className="export-content">
        <div className="export-header">
          <h2>📊 Export Sensor Data</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="export-form">
          <div className="form-group">
            <label>Export Format</label>
            <select name="format" value={exportSettings.format} onChange={handleChange}>
              <option value="csv">CSV (Excel compatible)</option>
              <option value="json">JSON (For developers)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sensor</label>
            <select name="sensorId" value={exportSettings.sensorId} onChange={handleChange}>
              <option value="all">All Sensors</option>
              {sensors.map(sensor => (
                <option key={sensor.sensor_id} value={sensor.sensor_id}>
                  {sensor.sensor_id} - {sensor.location?.name || 'Unknown Location'}
                </option>
              ))}
            </select>
          </div>

          <div className="date-range">
            <div className="form-group">
              <label>Start Date (Optional)</label>
              <input
                type="date"
                name="startDate"
                value={exportSettings.startDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>End Date (Optional)</label>
              <input
                type="date"
                name="endDate"
                value={exportSettings.endDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="date-actions">
            <button type="button" onClick={handleClearDates} className="clear-dates-btn">
              Clear Dates (Export All Data)
            </button>
          </div>

          <div className="export-info">
            <h4>📋 Export Includes:</h4>
            <ul>
              <li>Sensor ID & Location</li>
              <li>Soil Moisture, Temperature, Humidity</li>
              <li>pH Level & Nutrient Data (NPK)</li>
              <li>Battery Levels & Timestamps</li>
              <li>Up to 1000 most recent readings</li>
            </ul>
            <p className="export-tip">
              💡 <strong>Tip:</strong> Leave dates empty to export all available data
            </p>
          </div>

          <div className="export-actions">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              onClick={handleExport} 
              disabled={loading}
              className="export-btn"
            >
              {loading ? '⏳ Exporting...' : '📥 Download Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportData;