// backend/services/alertService.js - CONVERTED TO ES MODULES
import alertModel from '../models/alertModel.js';

class AlertService {
  static async checkSensorConditions(sensorData) {
    const alerts = [];

    // Check soil moisture
    if (sensorData.soil_moisture < 25) {
      alerts.push({
        type: 'critical',
        title: '🌵 Critical Soil Moisture',
        message: `Sensor ${sensorData.sensor_id} has critically low soil moisture (${sensorData.soil_moisture}%). Irrigation needed.`,
        sensorId: sensorData.sensor_id,
        value: sensorData.soil_moisture,
        threshold: 25,
        location: sensorData.location.name
      });
    } else if (sensorData.soil_moisture < 40) {
      alerts.push({
        type: 'warning',
        title: '⚠️ Low Soil Moisture',
        message: `Sensor ${sensorData.sensor_id} has low soil moisture (${sensorData.soil_moisture}%). Consider irrigation.`,
        sensorId: sensorData.sensor_id,
        value: sensorData.soil_moisture,
        threshold: 40,
        location: sensorData.location.name
      });
    }

    // Check pH levels
    if (sensorData.ph_level < 5.5 || sensorData.ph_level > 7.5) {
      alerts.push({
        type: 'warning',
        title: '🧪 pH Level Alert',
        message: `Sensor ${sensorData.sensor_id} has abnormal pH level (${sensorData.ph_level}). Optimal range is 5.5-7.5.`,
        sensorId: sensorData.sensor_id,
        value: sensorData.ph_level,
        threshold: '5.5-7.5',
        location: sensorData.location.name
      });
    }

    // Check temperature
    if (sensorData.temperature > 35) {
      alerts.push({
        type: 'warning',
        title: '🌡️ High Temperature',
        message: `Sensor ${sensorData.sensor_id} has high temperature (${sensorData.temperature}°C). Monitor for plant stress.`,
        sensorId: sensorData.sensor_id,
        value: sensorData.temperature,
        threshold: 35,
        location: sensorData.location.name
      });
    }

    // Check battery level
    if (sensorData.battery_level < 20) {
      alerts.push({
        type: 'warning',
        title: '🔋 Low Battery',
        message: `Sensor ${sensorData.sensor_id} has low battery (${sensorData.battery_level}%). Replacement needed soon.`,
        sensorId: sensorData.sensor_id,
        value: sensorData.battery_level,
        threshold: 20,
        location: sensorData.location.name
      });
    }

    // Create alerts in database
    for (const alert of alerts) {
      await alertModel.createAlert(alert);
    }

    return alerts;
  }

  static async getSystemStatus() {
    const unreadCount = await alertModel.getUnreadCount();
    const recentAlerts = await alertModel.getAlerts(5);
    
    let overallStatus = 'healthy';
    if (unreadCount > 0) {
      const hasCritical = recentAlerts.some(alert => alert.type === 'critical');
      overallStatus = hasCritical ? 'critical' : 'warning';
    }

    return {
      overallStatus,
      unreadCount,
      recentAlerts: recentAlerts.slice(0, 3)
    };
  }
}

export default AlertService;