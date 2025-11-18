// backend/models/alertModel.js - CONVERTED TO ES MODULES
import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

class AlertModel {
  constructor() {
    this.collectionName = 'alerts';
  }

  getCollection() {
    const db = getDatabase();
    return db.collection(this.collectionName);
  }

  async createAlert(alertData) {
    try {
      const collection = this.getCollection();
      const alert = {
        ...alertData,
        isRead: false,
        createdAt: new Date(),
        acknowledgedAt: null
      };

      const result = await collection.insertOne(alert);
      return { id: result.insertedId.toString(), ...alert };
    } catch (error) {
      throw error;
    }
  }

  async getAlerts(limit = 50, includeRead = false) {
    try {
      const collection = this.getCollection();
      const query = includeRead ? {} : { isRead: false };
      
      const alerts = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return alerts;
    } catch (error) {
      throw error;
    }
  }

  async markAsRead(alertId) {
    try {
      const collection = this.getCollection();
      
      await collection.updateOne(
        { _id: new ObjectId(alertId) },
        { 
          $set: { 
            isRead: true,
            acknowledgedAt: new Date()
          } 
        }
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const collection = this.getCollection();
      
      await collection.updateMany(
        { isRead: false },
        { 
          $set: { 
            isRead: true,
            acknowledgedAt: new Date()
          } 
        }
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const collection = this.getCollection();
      const count = await collection.countDocuments({ isRead: false });
      return count;
    } catch (error) {
      throw error;
    }
  }
}

export default new AlertModel();