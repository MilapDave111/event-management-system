const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");

const organizationRoutes = require("./src/routes/organizationRoutes");
const userRoutes = require("./src/routes/userRoutes"); // New Import
const eventRoutes = require("./src/routes/eventRoutes");
const adminRoutes = require("./src/routes/adminRoutes"); // --- MILAP'S CODE ---
const app = express();

app.use(cors());
app.use(express.json());

// Register Routes
app.use("/api/admin", adminRoutes); // --- MILAP'S CODE ---
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes); // New Route Registration
app.use("/api/events", eventRoutes);

module.exports = app;

