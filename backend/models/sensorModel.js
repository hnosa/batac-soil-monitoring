// backend/models/sensorModel.js - CONVERTED TO ES MODULES
import { getDatabase } from '../config/database.js';

class SensorModel {
  constructor() {
    this.collectionName = 'sensor_readings';
  }

  getCollection() {
    const db = getDatabase();
    return db.collection(this.collectionName);
  }

  // Insert new sensor reading
  async createSensorReading(sensorData) {
    try {
      const collection = this.getCollection();
      const result = await collection.insertOne({
        ...sensorData,
        createdAt: new Date()
      });
      return result;
    } catch (error) {
      console.error('Error creating sensor reading:', error);
      throw error;
    }
  }

  // Get all sensor readings
  async getAllReadings(limit = 100) {
    try {
      const collection = this.getCollection();
      const readings = await collection
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return readings;
    } catch (error) {
      console.error('Error getting sensor readings:', error);
      throw error;
    }
  }

  // Get latest reading from each sensor
  async getLatestReadings() {
    try {
      const collection = this.getCollection();
      const pipeline = [
        {
          $sort: { timestamp: -1 }
        },
        {
          $group: {
            _id: "$sensor_id",
            latestReading: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$latestReading" }
        }
      ];

      const readings = await collection.aggregate(pipeline).toArray();
      return readings;
    } catch (error) {
      console.error('Error getting latest readings:', error);
      throw error;
    }
  }

  // Get readings by sensor ID
  async getReadingsBySensor(sensorId, limit = 50) {
    try {
      const collection = this.getCollection();
      const readings = await collection
        .find({ sensor_id: sensorId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return readings;
    } catch (error) {
      console.error('Error getting sensor readings:', error);
      throw error;
    }
  }

  // Get data for export
  async getExportData(query = {}) {
    try {
      const collection = this.getCollection();
      const data = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(1000) // Limit to prevent huge exports
        .toArray();
      
      // Format data for export
      return data.map(item => ({
        Sensor_ID: item.sensor_id,
        Location: item.location.name,
        Latitude: item.location.lat,
        Longitude: item.location.lng,
        Soil_Moisture: item.soil_moisture,
        Temperature: item.temperature,
        Humidity: item.humidity,
        pH_Level: item.ph_level,
        Nitrogen: item.nitrogen,
        Phosphorus: item.phosphorus,
        Potassium: item.potassium,
        Battery_Level: item.battery_level,
        Timestamp: item.timestamp
      }));
    } catch (error) {
      throw error;
    }
  }
}

export default new SensorModel();