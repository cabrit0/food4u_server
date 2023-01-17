const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const User = require("../models/User");

// @desc    Register a user
// @route   POST /api/users/register
// @Access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  user = new User({
    name,
    email,
    password: hashedPassword,
  });

  // Save user to database
  await user.save();

  // Send response
  res.status(201).json({ message: "User registered successfully" });
});

// @desc Login a user
// @route POST /api/users/login
// @Access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Compare plain text password with hashed password in database
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Create and assign token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

// @desc Logout user
// @route GET /api/users/logout
// @Access Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout Successful" });
});

// @desc Change user password
// @route PUT /api/users/changepassword
// @Access Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);

  // Compare plain text current password with hashed password in database
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  // Update password in database
  user.password = hashedNewPassword;
  await user.save();

  res.status(200).json({ message: "Password changed successfully" });
});

// @desc Forgot password
// @route POST /api/users/forgotpassword
// @Access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Generate and send reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Send reset token to user email
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/users/resetpassword/${resetToken}`;
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    res
      .status(200)
      .json({ message: "A reset link has been sent to your email" });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({ message: "Email could not be sent" });
  }
});

module.exports = {
  register,
  login,
  logout,
  changePassword,
  forgotPassword,
  changePassword,
};
