// backend/models/userModel.js - CONVERTED TO ES MODULES
import { getDatabase } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

class UserModel {
  constructor() {
    this.collectionName = 'users';
  }

  getCollection() {
    const db = getDatabase();
    return db.collection(this.collectionName);
  }

  async createUser(userData) {
    try {
      const collection = this.getCollection();
      
      // Check if user already exists
      const existingUser = await collection.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        lastLogin: null
      };

      const result = await collection.insertOne(user);
      return { 
        id: result.insertedId.toString(), 
        name: user.name, 
        email: user.email, 
        role: user.role 
      };
    } catch (error) {
      throw error;
    }
  }

  async validateUser(email, password) {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Update last login
      await collection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );

      return { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        role: user.role 
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (!user) throw new Error('User not found');
      
      return { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        role: user.role 
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const collection = this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(userId) });
      
      if (result.deletedCount === 0) {
        throw new Error('User not found');
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const collection = this.getCollection();
      
      // Check if email is already taken by another user
      if (updateData.email) {
        const existingUser = await collection.findOne({ 
          email: updateData.email, 
          _id: { $ne: new ObjectId(userId) } 
        });
        
        if (existingUser) {
          throw new Error('Email already taken');
        }
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      // Return updated user
      const updatedUser = await collection.findOne({ _id: new ObjectId(userId) });
      return { 
        id: updatedUser._id.toString(), 
        name: updatedUser.name, 
        email: updatedUser.email, 
        role: updatedUser.role 
      };
    } catch (error) {
      throw error;
    }
  }
  
  async createPasswordResetToken(email) {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await collection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            resetToken,
            resetTokenExpiry
          } 
        }
      );

      return { resetToken, user: { id: user._id.toString(), email: user.email, name: user.name } };
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ 
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await collection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            password: hashedPassword 
          },
          $unset: {
            resetToken: "",
            resetTokenExpiry: ""
          }
        }
      );

      return { 
        id: user._id.toString(), 
        email: user.email, 
        name: user.name 
      };
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ email });
      
      if (!user) return null;
      
      return { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        role: user.role 
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new UserModel();