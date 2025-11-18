// frontend/src/components/DataCharts.js
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import './DataCharts.css';

const DataCharts = ({ sensorData }) => {
  // Process data for charts
  const processChartData = () => {
    const recentData = sensorData.slice(-20); // Last 20 readings
    
    return recentData.map((data, index) => ({
      name: `Reading ${index + 1}`,
      time: new Date(data.timestamp).toLocaleTimeString(),
      moisture: data.soil_moisture,
      temperature: parseFloat(data.temperature),
      humidity: data.humidity,
      ph: parseFloat(data.ph_level),
      sensor: data.sensor_id
    }));
  };

  const chartData = processChartData();

  // Data for sensor distribution
  const sensorDistribution = sensorData.reduce((acc, data) => {
    const existing = acc.find(item => item.name === data.sensor_id);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: data.sensor_id, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];

  // Current averages
  const getAverages = () => {
    if (sensorData.length === 0) return null;
    
    const latest = sensorData.slice(-5); // Last 5 readings
    return {
      moisture: (latest.reduce((sum, data) => sum + data.soil_moisture, 0) / latest.length).toFixed(1),
      temperature: (latest.reduce((sum, data) => sum + parseFloat(data.temperature), 0) / latest.length).toFixed(1),
      humidity: (latest.reduce((sum, data) => sum + data.humidity, 0) / latest.length).toFixed(1),
      ph: (latest.reduce((sum, data) => sum + parseFloat(data.ph_level), 0) / latest.length).toFixed(1)
    };
  };

  const averages = getAverages();

  return (
    <div className="data-charts">
      <div className="charts-header">
        <h2>📈 Soil Analytics & Trends</h2>
        <p>Real-time data visualization and historical trends</p>
      </div>

      {averages && (
        <div className="averages-grid">
          <div className="average-card">
            <h3>💧 Avg Moisture</h3>
            <div className="average-value">{averages.moisture}%</div>
          </div>
          <div className="average-card">
            <h3>🌡️ Avg Temperature</h3>
            <div className="average-value">{averages.temperature}°C</div>
          </div>
          <div className="average-card">
            <h3>💦 Avg Humidity</h3>
            <div className="average-value">{averages.humidity}%</div>
          </div>
          <div className="average-card">
            <h3>🧪 Avg pH</h3>
            <div className="average-value">{averages.ph}</div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Soil Moisture Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="moisture" stroke="#4CAF50" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Temperature & Humidity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#FF9800" strokeWidth={3} />
              <Line type="monotone" dataKey="humidity" stroke="#2196F3" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>pH Level History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ph" fill="#9C27B0" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Sensor Data Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sensorDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sensorDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {sensorData.length === 0 && (
        <div className="no-data">
          <p>Collecting sensor data... Charts will appear here soon.</p>
        </div>
      )}
    </div>
  );
};

export default DataCharts;