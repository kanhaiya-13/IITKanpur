import express from 'express';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { validateUserUpdate, validateObjectId, validatePagination } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({ user });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, validateUserUpdate, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    Object.keys(updates).forEach(key => {
      if (key === 'profile' && typeof updates[key] === 'object') {
        user.profile = { ...user.profile, ...updates[key] };
      } else if (key !== 'password' && key !== 'email') {
        user[key] = updates[key];
      }
    });
    
    await user.save();
    
    logger.info(`User profile updated: ${user.email}`);
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: user.profile,
        role: user.role,
        onboarding: user.onboarding
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', adminAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private (Admin)
router.get('/:id', adminAuth, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', adminAuth, validateObjectId, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = isActive;
    await user.save();
    
    logger.info(`User status updated: ${user.email} - Active: ${isActive} by admin: ${req.user.email}`);
    
    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put('/:id/role', adminAuth, validateObjectId, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    logger.info(`User role updated: ${user.email} - Role: ${role} by admin: ${req.user.email}`);
    
    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// @route   GET /api/users/analytics/summary
// @desc    Get user analytics summary (Admin only)
// @access  Private (Admin)
router.get('/analytics/summary', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const completedOnboarding = await User.countDocuments({
      'onboarding.isCompleted': true
    });
    
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentRegistrations = await User.find()
      .select('email firstName lastName createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      summary: {
        totalUsers,
        activeUsers,
        completedOnboarding,
        onboardingCompletionRate: totalUsers > 0 ? (completedOnboarding / totalUsers) * 100 : 0,
        roleDistribution,
        recentRegistrations
      }
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error fetching user analytics' });
  }
});

export default router;


