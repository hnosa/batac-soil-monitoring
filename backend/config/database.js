// backend/config/database.js - CONVERTED TO ES MODULES
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = "batac_soil_monitoring";

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

let client;
let database;

async function connectToDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, {
      // Add these options for better connection handling
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10
    });
    
    await client.connect();
    
    // Test the connection
    await client.db().admin().ping();
    
    database = client.db(dbName);
    console.log('✅ Connected to MongoDB Atlas successfully');
    console.log(`📁 Database: ${dbName}`);
    
    return database;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    
    // More specific error messages
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Tips: Check your internet connection and IP whitelist in Atlas');
    } else if (error.name === 'AuthenticationFailed') {
      console.error('💡 Tips: Check your username and password in the connection string');
    }
    
    process.exit(1);
  }
}

function getDatabase() {
  if (!database) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return database;
}

async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('📋 MongoDB connection closed');
  }
}

export {
  connectToDatabase,
  getDatabase,
  closeDatabase
};