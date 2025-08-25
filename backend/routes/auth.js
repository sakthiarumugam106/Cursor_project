const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { sendEmail } = require('../services/emailService');
const { errorHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2, max: 100 }),
  body('lastName').trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/),
  body('role').optional().isIn(['student', 'tutor', 'admin', 'super_admin'])
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
];

// Login route
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send welcome WhatsApp message for new users
    if (user.createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000) { // Within 24 hours
      try {
        await sendWhatsAppMessage(
          user.phone,
          `Welcome to Education Management System! 🎓\n\nHi ${user.firstName}, your account has been created successfully.\n\nRole: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}\nEmail: ${user.email}\n\nYou can now log in to your dashboard.`
        );
      } catch (error) {
        console.error('WhatsApp welcome message failed:', error);
      }
    }

    // Return user data and tokens
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profilePicture: user.profilePicture,
          phone: user.phone,
          status: user.status
        },
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Register route
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Auto-assign role based on email domain if not specified
    let userRole = role;
    if (!userRole) {
      if (email.endsWith('@std.com')) {
        userRole = 'student';
      } else if (email.endsWith('@tut.com')) {
        userRole = 'tutor';
      } else if (email.endsWith('@adm.com')) {
        userRole = 'admin';
      } else {
        userRole = 'student'; // Default role
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: userRole,
      status: 'active'
    });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send welcome email
    try {
      await sendEmail(
        user.email,
        'Welcome to Education Management System',
        `Hi ${user.firstName},\n\nWelcome to our Education Management System! Your account has been created successfully.\n\nAccount Details:\n- Email: ${user.email}\n- Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}\n- Status: Active\n\nYou can now log in to your dashboard.\n\nBest regards,\nEducation Management Team`
      );
    } catch (error) {
      console.error('Welcome email failed:', error);
    }

    // Send WhatsApp welcome message if phone is provided
    if (user.phone) {
      try {
        await sendWhatsAppMessage(
          user.phone,
          `Welcome to Education Management System! 🎓\n\nHi ${user.firstName}, your account has been created successfully.\n\nRole: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}\nEmail: ${user.email}\n\nYou can now log in to your dashboard.`
        );
      } catch (error) {
        console.error('WhatsApp welcome message failed:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status
        },
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Forgot password route
router.post('/forgot-password', forgotPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in user preferences (in production, use a separate table)
    user.preferences = {
      ...user.preferences,
      resetToken,
      resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    try {
      await sendEmail(
        user.email,
        'Password Reset Request',
        `Hi ${user.firstName},\n\nYou requested a password reset for your account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nEducation Management Team`
      );
    } catch (error) {
      console.error('Password reset email failed:', error);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
});

// Reset password route
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if reset token is valid
    if (!user.preferences?.resetToken || 
        user.preferences.resetToken !== token ||
        new Date(user.preferences.resetTokenExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    
    // Clear reset token
    user.preferences = {
      ...user.preferences,
      resetToken: null,
      resetTokenExpires: null
    };
    
    await user.save();

    // Send confirmation email
    try {
      await sendEmail(
        user.email,
        'Password Reset Successful',
        `Hi ${user.firstName},\n\nYour password has been reset successfully.\n\nYou can now log in with your new password.\n\nIf you didn't make this change, please contact support immediately.\n\nBest regards,\nEducation Management System`
      );
    } catch (error) {
      console.error('Password reset confirmation email failed:', error);
    }

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    if (decoded.type !== 'refresh') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    // This route requires authentication, so it should be protected
    // by the authenticateToken middleware in the main server.js
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          profilePicture: req.user.profilePicture,
          phone: req.user.phone,
          status: req.user.status,
          dateOfBirth: req.user.dateOfBirth,
          gender: req.user.gender,
          address: req.user.address,
          city: req.user.city,
          state: req.user.state,
          country: req.user.country,
          postalCode: req.user.postalCode,
          lastLoginAt: req.user.lastLoginAt,
          emailVerified: req.user.emailVerified,
          phoneVerified: req.user.phoneVerified,
          twoFactorEnabled: req.user.twoFactorEnabled,
          preferences: req.user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

module.exports = router;