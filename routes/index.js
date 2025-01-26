var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing and verification
const User = require('../models/user');
const isAuthenticated = require('../middlewares/authMiddleware');
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
router.get('/', isAuthenticated, async (req, res) => {
  const weatherData = await fetchWeatherData();
  const agricultureNews = await fetchAgricultureNews();

  res.render('dashboard', {
    title: 'Soil & Crop Dashboard',
    sensorData,
    weatherData,
    agricultureNews,
  });
});

router.get('/auth', async (req, res) => {
  res.render('auth', { title: 'Login' });
});


// Route to handle login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and Password are required');
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid email or password');
    }

    // Save user ID in session
    req.session.userId = user._id;
    res.redirect('/'); // Redirect to home page
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Route to register a new user
router.post('/register', async (req, res) => {
  console.log(req.body);

  const { name, email, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to the database
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return res.redirect('/auth'); // Redirect to login after registration
  } catch (err) {
    console.error('Error during registration:', err);
    return res.status(500).send('Internal Server Error');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.error('Error during logout:', err);
          return res.status(500).send('Internal Server Error');
      }
      res.redirect('/auth'); // Redirect to login page
  });
});

module.exports = router;
