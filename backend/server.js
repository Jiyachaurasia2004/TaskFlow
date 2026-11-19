
const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log(
  "JWT Secret Loaded:",
  Boolean(process.env.JWT_SECRET)
);
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow Backend Server is Running!",
  });
});

// Start server after database connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

   app.listen(PORT, "0.0.0.0", () => {
  console.log(`TaskFlow Server running on port ${PORT}`);
});
  } catch (error) {
    console.log("Server Startup Error:", error.message);
  }
};

startServer();
