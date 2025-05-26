require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const app = express();
const database = require("./config/database")
const authRoute = require('./routes/auth.router')
const folderRouter = require('./routes/folder.router')
const fileRouter = require('./routes/file.router')
const passport = require('./config/passportConfig');
app.use(passport.initialize());

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable Cross-Origin Resource Sharing

// Sample route for testing
app.use("/", authRoute);
app.use("/folder", folderRouter);
app.use("/file", fileRouter);



// Handle undefined routes
app.use((req, res, next) => {
    res.status(404).send("Route not found");
});

module.exports = app;
