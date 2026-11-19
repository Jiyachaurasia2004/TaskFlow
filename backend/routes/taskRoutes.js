const express = require("express");
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getSingleTask,
  updateTask,
  deleteTask,
  getTaskStats,
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");

router.post("/", protect, createTask);

router.get("/", protect, getAllTasks);
router.get("/stats", protect, getTaskStats);
router.get("/:id", protect, getSingleTask);

router.put("/:id", protect, updateTask);

router.delete("/:id", protect, deleteTask);

module.exports = router;