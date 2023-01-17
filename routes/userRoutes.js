const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const verifyJWT = require("../middleware/verifyJWT");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/profile", verifyJWT, getProfile);
router.put("/profile", verifyJWT, updateProfile);
router.put("/changepassword", verifyJWT, changePassword);
router.delete("/profile", verifyJWT, deleteProfile);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

module.exports = router;
