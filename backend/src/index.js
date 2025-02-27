require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const connectionRoutes = require("./routes/connections");
const notificationRoutes = require("./routes/notifications");
const chatRoutes = require("./routes/chat");

const app = express();
const server = http.createServer(app);

// Initialize socket.io (only once)

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

// Add health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 4200;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
