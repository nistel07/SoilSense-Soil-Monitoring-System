var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");

// Initialize Express App & Server
const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Attach Socket.io to server

// MongoDB Connection
const uri =
  "mongodb+srv://root:root@cluster0.pl98b.mongodb.net/soilease?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Create a MongoDB session store
const store = new MongoDBStore({
  uri: uri,
  collection: "sessions",
});

// Express session middleware (should be above routers)
app.use(
  session({
    secret: "your-secret-key", // Replace with a secure secret key
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Set up Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Pass io instance to routes
const indexRouter = require("./routes/index")(io);
const usersRouter = require("./routes/users");

// View Engine Setup
const exphbs = require("express-handlebars");
const hbs = exphbs.create({
  extname: "hbs",
  defaultLayout: "layout",
  layoutsDir: path.join(__dirname, "views"),
  helpers: {
    eq: function (a, b) {
      return a === b;
    },
  },
});
app.engine("hbs", hbs.engine);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// Middleware Setup
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error Handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// Start Server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

module.exports = { app, server, io };
