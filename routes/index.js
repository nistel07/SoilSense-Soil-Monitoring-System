var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const isAuthenticated = require("../middlewares/authMiddleware");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const cron = require("node-cron");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
// import OpenAI from "openai";
// import dotenv from "dotenv";


const OpenAI = require("openai");
const dotenv = require("dotenv");



dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let moistureData = 0;
let aiFeedback = "No feedback yet";


let clock = Date.now();
let lastAlertTime = Date.now();

// Function to initialize router with io instance
module.exports = (io) => {
  // Dashboard route
  router.get("/", isAuthenticated, async (req, res) => {
    res.render("dashboard", { moisture: moistureData });
  });

  // Authentication page
  router.get("/auth", async (req, res) => {
    res.render("auth", { title: "Login", moisture: moistureData });
  });

  // Route to receive moisture data from sensors
  let isProcessing = false; // Prevent overlapping AI requests

  // Route to receive sensor data
  router.post("/sensor", async (req, res) => {

    try {
      // Extract sensor values from request body
      const { moisture, nitrogen, phosphorus, potassium, temperature, humidity } = req.body;

      // Ensure valid sensor data
      if ([moisture, nitrogen, phosphorus, potassium, temperature, humidity].some(isNaN)) {
        return res.status(400).send("Invalid sensor data");
      }

      // Store the latest sensor values
      const sensorData = { moisture, humidity, temperature, nitrogen, phosphorus, potassium };

      alert(humidity, temperature, moisture, nitrogen, potassium, phosphorus);
      clock = Date.now();

      // Emit the raw sensor data first
      io.emit("sensorUpdate", { ...sensorData, ai: aiFeedback });

      // Schedule AI feedback update every 1 minute
      cron.schedule("*/1 * * * *", async () => {
        if (isProcessing) return; // Prevent multiple overlapping calls
        isProcessing = true;

        try {
          console.log("Fetching AI feedback...");
          aiFeedback = await getSoilFeedback(sensorData); // Fetch AI feedback
          console.log("AI feedback received:", aiFeedback);

          // Emit updated data with AI feedback
          io.emit("sensorUpdate", { ...sensorData, ai: aiFeedback });
        } catch (error) {
          console.error("Error fetching AI feedback:", error);
        } finally {
          isProcessing = false;
        }
      });

      res.status(200).send("Sensor data received");
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

 
  async function alert(humidity, temperature, moisture, nitrogen, potassium, phosphorus) {

    // set clock and if previous alert was before 15 minutes, dont send, else only send
    console.log("Alert sent less than 15 minutes ago:  "+(clock - lastAlertTime));
    // if the condition is met
    if (clock - lastAlertTime < 1 * 60 * 1000) {
      console.log("Alert sent less than 1 minute ago:  "+(clock - lastAlertTime));
      
      return;
    } else {
      
      if (moisture < 30) {
        const message = "Moisture level is low at ${moisture}%. Please water the plants.";
        await fetch(
          `https://api.ultramsg.com/instance110828/messages/chat?token=${process.env.ULTRATOKEN}&to=${process.env.ALERTNUMBER}&body=${message}&priority=10`
        );


      }

      if (humidity > 80) {
        const message = `Humidity level is high at ${humidity}%. Please check the plants.`;
        // Send alert to WhatsApp
        await fetch(
          `https://api.ultramsg.com/instance110828/messages/chat?token=${process.env.ULTRATOKEN}&to=${process.env.ALERTNUMBER}&body=${message}&priority=10`
        );

      }
      if (temperature > 40) {
        const message = `Temperature level is high at ${temperature}%. Please check the plants.`;
        // Send alert to WhatsApp
        await fetch(
          `https://api.ultramsg.com/instance110828/messages/chat?token=${process.env.ULTRATOKEN}&to=${process.env.ALERTNUMBER}&body=${message}&priority=10`
        );
      }
      if (nitrogen < 10) {
        const message = `Nitrogen level is low at ${nitrogen}%. Please check the plants.`;
        // Send alert to WhatsApp
        await fetch(
          `https://api.ultramsg.com/instance110828/messages/chat?token=${process.env.ULTRATOKEN}&to=${process.env.ALERTNUMBER}&body=${message}&priority=10`
        );
      }
      if (phosphorus < 10) {
        const message = `Phosphorus level is low at ${phosphorus}%. Please check the plants.`;
        // Send alert to WhatsApp
        await fetch(
          `https://api.ultramsg.com/instance110828/messages/chat?token=${process.env.ULTRATOKEN}&to=${process.env.ALERTNUMBER}&body=${message}&priority=10`
        );
      }
      if (potassium < 10) {
        const message = `Potassium level is low at ${potassium}%. Please check the plants.`;
        // Send alert to WhatsApp
        await fetch(
          `https://api.ultramsg.com/instance110828/messages/chat?token=${process.env.ULTRATOKEN}&to=${process.env.ALERTNUMBER}&body=${message}&priority=10`
        );
      }
    }
    lastAlertTime = Date.now();


  }

  // Function to fetch AI feedback from OpenAI
  async function getSoilFeedback(sensorData) {
    try {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        max_tokens: 70,
        messages: [
          { role: "system", content: "Soil and plant health expert. Give remedies based on sensor data." },
          { role: "user", content: `Sensor readings: ${JSON.stringify(sensorData)}. Feedback (max 50 words, POINTS only):` },
        ],
      });

      return chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error("AI Error:", error);
      return "Error fetching AI feedback";
    }
  }

  // Socket.IO connection handler
  io.on("connection", (socket) => {
    console.log("Client connected");
    socket.emit("sensorUpdate", { ai: aiFeedback }); // Send latest AI feedback

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // User Login
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and Password are required");
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send("Invalid email or password");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).send("Invalid email or password");
      }

      // Save user session
      req.session.userId = user._id;
      res.redirect("/");
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // User Registration
  router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send("Email already in use");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({ name, email, password: hashedPassword });
      await newUser.save();

      return res.redirect("/auth"); // Redirect to login
    } catch (err) {
      console.error("Error during registration:", err);
      return res.status(500).send("Internal Server Error");
    }
  });

  // User Logout
  router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).send("Internal Server Error");
      }
      res.redirect("/auth"); // Redirect to login page
    });
  });

  return router;
};
