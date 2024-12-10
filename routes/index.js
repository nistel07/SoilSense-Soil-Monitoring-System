var express = require('express');
var router = express.Router();
const sensorData = {
  temperature: 25, 
  humidity: 60,
  NPK: {
    nitrogen: 12, 
    phosphorus: 8,
    potassium: 15
  },
  waterLevel: 70
};

// Fetch weather data (you can replace with actual API calls)
const fetchWeatherData = async () => {
  // Example data from OpenWeatherMap or a similar API
  return {
    temperature: 22,
    condition: 'Cloudy',
    icon: 'cloud',  // 'sun', 'rain', etc.
  };
};

// Fetch agriculture news (example: API like NewsAPI)
const fetchAgricultureNews = async () => {
  return [
    { title: "Global Trends in Organic Farming", url: "https://example.com" },
    { title: "Technological Advancements in Irrigation", url: "https://example.com" },
  ];
};

// Render the dashboard
router.get('/', async (req, res) => {
  const weatherData = await fetchWeatherData();
  const agricultureNews = await fetchAgricultureNews();

  res.render('dashboard', { 
    title: 'Soil & Crop Dashboard',
    sensorData,
    weatherData,
    agricultureNews,
  });
});

module.exports = router;
