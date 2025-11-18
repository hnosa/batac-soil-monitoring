// frontend/src/components/AlertsPanel.js
import React, { useState } from 'react';
import './AlertsPanel.css';

const AlertsPanel = ({ alerts, systemStatus, onMarkAsRead, onMarkAllAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      default: return '🔵';
    }
  };

  const getAlertClass = (type) => {
    switch (type) {
      case 'critical': return 'critical';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="alerts-panel">
      {/* Alert Bell Button */}
      <button 
        className={`alert-bell ${systemStatus.overallStatus}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="bell-icon">🔔</span>
        {systemStatus.unreadCount > 0 && (
          <span className="alert-count">{systemStatus.unreadCount}</span>
        )}
      </button>

      {/* Alerts Dropdown */}
      {isOpen && (
        <div className="alerts-dropdown">
          <div className="alerts-header">
            <h3>System Alerts</h3>
            <div className="alerts-actions">
              {systemStatus.unreadCount > 0 && (
                <button onClick={onMarkAllAsRead} className="mark-all-read">
                  Mark all as read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="close-alerts">
                ×
              </button>
            </div>
          </div>

          <div className="alerts-list">
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <p>🎉 No active alerts</p>
                <p>All systems are normal</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert._id || alert.id} className={`alert-item ${getAlertClass(alert.type)}`}>
                  <div className="alert-icon">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="alert-content">
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-meta">
                      <span className="alert-location">{alert.location}</span>
                      <span className="alert-time">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {!alert.isRead && (
                    <button 
                      onClick={() => onMarkAsRead(alert._id || alert.id)}
                      className="mark-read-btn"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="alerts-footer">
            <div className={`system-status ${systemStatus.overallStatus}`}>
              System Status: <strong>{systemStatus.overallStatus.toUpperCase()}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;