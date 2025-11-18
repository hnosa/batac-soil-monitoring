// backend/routes/export.js - CONVERTED TO ES MODULES
import express from 'express';
import sensorModel from '../models/sensorModel.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Export sensor data as CSV
router.get('/sensor-data/csv', authenticateToken, async (req, res) => {
  try {
    console.log('=== CSV Export Started ===');
    const { startDate, endDate, sensorId } = req.query;
    console.log('Query parameters:', { startDate, endDate, sensorId });
    
    let query = {};
    
    // Build date range query
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
        console.log('Start date:', query.timestamp.$gte);
      }
      if (endDate) {
        // Set end date to end of day (23:59:59)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDateTime;
        console.log('End date:', query.timestamp.$lte);
      }
    }
    
    // Filter by sensor if specified
    if (sensorId && sensorId !== 'all') {
      query.sensor_id = sensorId;
      console.log('Sensor filter:', sensorId);
    }

    console.log('Final query:', JSON.stringify(query, null, 2));
    
    const data = await sensorModel.getExportData(query);
    
    console.log('Data retrieved from database:', data ? data.length : 0, 'records');
    
    if (!data || data.length === 0) {
      console.log('No data found for query');
      return res.status(404).json({ 
        error: 'No sensor data found for the selected criteria. Please try different dates or sensors.' 
      });
    }

    // Convert to CSV
    console.log('Converting to CSV...');
    const csv = convertToCSV(data);
    console.log('CSV conversion successful, length:', csv.length);
    
    // Set headers for file download
    const filename = `batac-soil-data-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    console.log('Sending CSV response...');
    res.send(csv);
    
  } catch (error) {
    console.error('❌ CSV export error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: `Failed to export data: ${error.message}` 
    });
  }
});

// Export sensor data as JSON
router.get('/sensor-data/json', authenticateToken, async (req, res) => {
  try {
    console.log('=== JSON Export Started ===');
    const { startDate, endDate, sensorId } = req.query;
    console.log('Query parameters:', { startDate, endDate, sensorId });
    
    let query = {};
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDateTime;
      }
    }
    
    if (sensorId && sensorId !== 'all') {
      query.sensor_id = sensorId;
    }

    console.log('Final query:', JSON.stringify(query, null, 2));
    
    const data = await sensorModel.getExportData(query);
    
    console.log('Data retrieved from database:', data ? data.length : 0, 'records');
    
    if (!data || data.length === 0) {
      console.log('No data found for query');
      return res.status(404).json({ 
        error: 'No sensor data found for the selected criteria. Please try different dates or sensors.' 
      });
    }

    const filename = `batac-soil-data-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    console.log('Sending JSON response...');
    res.json({
      metadata: {
        exportedAt: new Date().toISOString(),
        recordCount: data.length,
        dateRange: {
          start: startDate || 'All',
          end: endDate || 'All'
        },
        sensor: sensorId || 'All'
      },
      data: data
    });
    
  } catch (error) {
    console.error('❌ JSON export error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: `Failed to export data: ${error.message}` 
    });
  }
});

// Improved CSV conversion function
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return 'No data available for the selected criteria';
  }

  try {
    // Flatten nested objects and handle special cases
    const flattenedData = data.map(item => {
      const flatItem = { ...item };
      
      // Handle nested objects (like location)
      if (item.location && typeof item.location === 'object') {
        flatItem.location_name = item.location.name || item.location.location || 'Unknown';
        flatItem.location_coordinates = item.location.coordinates ? 
          `Lat: ${item.location.coordinates.lat}, Lng: ${item.location.coordinates.lng}` : 'N/A';
        // Remove the original nested location object
        delete flatItem.location;
      }
      
      // Convert dates to readable strings
      if (item.timestamp) {
        flatItem.timestamp = new Date(item.timestamp).toLocaleString('en-PH', {
          timeZone: 'Asia/Manila'
        });
      }
      
      // Handle undefined/null values and format numbers
      Object.keys(flatItem).forEach(key => {
        const value = flatItem[key];
        
        if (value === null || value === undefined) {
          flatItem[key] = 'N/A';
        } else if (typeof value === 'number') {
          // Format numbers to 2 decimal places
          flatItem[key] = Number(value.toFixed(2));
        } else if (typeof value === 'boolean') {
          flatItem[key] = value ? 'Yes' : 'No';
        }
      });
      
      return flatItem;
    });

    const headers = Object.keys(flattenedData[0]);
    
    const headerRow = headers.map(header => 
      `"${header.replace(/"/g, '""')}"`
    ).join(',');
    
    const dataRows = flattenedData.map(item => 
      headers.map(header => {
        const value = item[header];
        // Stringify and escape quotes
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n');
    
  } catch (error) {
    console.error('CSV conversion error:', error);
    return 'Error converting data to CSV format';
  }
}

export default router;