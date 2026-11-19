
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
    updateProfile,
     changePassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Current logged-in user
router.get("/me", protect, getMe);

// Update logged-in user's profile
router.put("/update-profile", protect, updateProfile);
// Change Password
router.put("/change-password", protect, changePassword);
module.exports = router;
