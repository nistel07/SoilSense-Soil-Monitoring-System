var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const isAuthenticated = require("../middlewares/authMiddleware");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let moistureData = 0;

// Function to initialize router with io instance
module.exports = (io) => {
  // Dashboard route
  router.get("/", isAuthenticated, async (req, res) => {
    res.render("dashboard", { moisture: moistureData });
  });

  // Authentication page
  router.get("/auth", async (req, res) => {
    res.render("auth", { title: "Login",moisture: moistureData });
  });

  // Route to receive moisture data from sensors
  router.post("/update-moisture", (req, res) => {
    if (req.body.moisture !== undefined) {
      moistureData = req.body.moisture;
      console.log("Moisture Updated:", moistureData);
      
      io.emit("moistureUpdate", moistureData); // Broadcast update to clients
      res.status(200).send("Updated");
    } else {
      res.status(400).send("Invalid Data");
    }
  });
  io.on("connection", (socket) => {
    console.log("Client connected");
    socket.emit("moistureUpdate", moistureData); // Send initial data
  
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
