import express from 'express';
import OnboardingFlow from '../models/OnboardingFlow.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { validateOnboardingStep, validateOnboardingFlow, validateObjectId } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/onboarding/flows
// @desc    Get available onboarding flows
// @access  Private
router.get('/flows', auth, async (req, res) => {
  try {
    const flows = await OnboardingFlow.getActiveFlows();
    
    res.json({ flows });
  } catch (error) {
    logger.error('Get onboarding flows error:', error);
    res.status(500).json({ message: 'Server error fetching onboarding flows' });
  }
});

// @route   GET /api/onboarding/flows/:id
// @desc    Get specific onboarding flow
// @access  Private
router.get('/flows/:id', auth, validateObjectId, async (req, res) => {
  try {
    const flow = await OnboardingFlow.findById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({ message: 'Onboarding flow not found' });
    }
    
    res.json({ flow });
  } catch (error) {
    logger.error('Get onboarding flow error:', error);
    res.status(500).json({ message: 'Server error fetching onboarding flow' });
  }
});

// @route   GET /api/onboarding/progress
// @desc    Get user's onboarding progress
// @access  Private
router.get('/progress', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const progress = {
      isCompleted: user.onboarding.isCompleted,
      currentStep: user.onboarding.currentStep,
      completedSteps: user.onboarding.completedSteps,
      preferences: user.onboarding.preferences
    };
    
    res.json({ progress });
  } catch (error) {
    logger.error('Get onboarding progress error:', error);
    res.status(500).json({ message: 'Server error fetching onboarding progress' });
  }
});

// @route   POST /api/onboarding/start
// @desc    Start onboarding process
// @access  Private
router.post('/start', auth, async (req, res) => {
  try {
    const { flowId } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user already completed onboarding
    if (user.onboarding.isCompleted) {
      return res.status(400).json({ message: 'Onboarding already completed' });
    }
    
    // Get the onboarding flow
    const flow = await OnboardingFlow.findById(flowId);
    if (!flow) {
      return res.status(404).json({ message: 'Onboarding flow not found' });
    }
    
    // Reset onboarding progress
    user.onboarding.currentStep = 0;
    user.onboarding.completedSteps = [];
    user.onboarding.isCompleted = false;
    
    await user.save();
    
    logger.info(`Onboarding started for user: ${user.email}, flow: ${flow.name}`);
    
    res.json({
      message: 'Onboarding started successfully',
      flow: {
        id: flow._id,
        name: flow.name,
        description: flow.description,
        totalSteps: flow.steps.length
      },
      progress: {
        currentStep: user.onboarding.currentStep,
        totalSteps: flow.steps.length,
        percentage: 0
      }
    });
  } catch (error) {
    logger.error('Start onboarding error:', error);
    res.status(500).json({ message: 'Server error starting onboarding' });
  }
});

// @route   POST /api/onboarding/complete-step
// @desc    Complete an onboarding step
// @access  Private
router.post('/complete-step', auth, validateOnboardingStep, async (req, res) => {
  try {
    const { stepId, data } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if step is already completed
    const alreadyCompleted = user.onboarding.completedSteps.find(
      step => step.stepId === stepId
    );
    
    if (alreadyCompleted) {
      return res.status(400).json({ message: 'Step already completed' });
    }
    
    // Add completed step
    user.onboarding.completedSteps.push({
      stepId,
      completedAt: new Date(),
      data: data || {}
    });
    
    // Update current step
    user.onboarding.currentStep = user.onboarding.completedSteps.length;
    
    await user.save();
    
    logger.info(`Onboarding step completed: ${stepId} by user: ${user.email}`);
    
    res.json({
      message: 'Step completed successfully',
      progress: {
        currentStep: user.onboarding.currentStep,
        completedSteps: user.onboarding.completedSteps.length
      }
    });
  } catch (error) {
    logger.error('Complete onboarding step error:', error);
    res.status(500).json({ message: 'Server error completing onboarding step' });
  }
});

// @route   POST /api/onboarding/complete
// @desc    Complete entire onboarding process
// @access  Private
router.post('/complete', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.onboarding.isCompleted = true;
    user.onboarding.completedAt = new Date();
    
    await user.save();
    
    logger.info(`Onboarding completed for user: ${user.email}`);
    
    res.json({
      message: 'Onboarding completed successfully!',
      completionDate: user.onboarding.completedAt
    });
  } catch (error) {
    logger.error('Complete onboarding error:', error);
    res.status(500).json({ message: 'Server error completing onboarding' });
  }
});

// @route   PUT /api/onboarding/preferences
// @desc    Update onboarding preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update preferences
    user.onboarding.preferences = {
      ...user.onboarding.preferences,
      ...preferences
    };
    
    await user.save();
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: user.onboarding.preferences
    });
  } catch (error) {
    logger.error('Update onboarding preferences error:', error);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

// @route   GET /api/onboarding/analytics
// @desc    Get onboarding analytics (Admin only)
// @access  Private (Admin)
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const completedOnboarding = await User.countDocuments({
      'onboarding.isCompleted': true
    });
    const inProgressOnboarding = await User.countDocuments({
      'onboarding.isCompleted': false,
      'onboarding.currentStep': { $gt: 0 }
    });
    
    // Get step completion rates
    const stepCompletionRates = await User.aggregate([
      { $unwind: '$onboarding.completedSteps' },
      {
        $group: {
          _id: '$onboarding.completedSteps.stepId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get average completion time
    const completionTimes = await User.aggregate([
      { $match: { 'onboarding.isCompleted': true } },
      {
        $project: {
          completionTime: {
            $subtract: ['$onboarding.completedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$completionTime' }
        }
      }
    ]);
    
    res.json({
      analytics: {
        totalUsers,
        completedOnboarding,
        inProgressOnboarding,
        completionRate: totalUsers > 0 ? (completedOnboarding / totalUsers) * 100 : 0,
        stepCompletionRates,
        averageCompletionTime: completionTimes[0]?.averageTime || 0
      }
    });
  } catch (error) {
    logger.error('Get onboarding analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// @route   POST /api/onboarding/flows
// @desc    Create new onboarding flow (Admin only)
// @access  Private (Admin)
router.post('/flows', adminAuth, validateOnboardingFlow, async (req, res) => {
  try {
    const flowData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const flow = new OnboardingFlow(flowData);
    await flow.save();
    
    logger.info(`New onboarding flow created: ${flow.name} by admin: ${req.user.email}`);
    
    res.status(201).json({
      message: 'Onboarding flow created successfully',
      flow
    });
  } catch (error) {
    logger.error('Create onboarding flow error:', error);
    res.status(500).json({ message: 'Server error creating onboarding flow' });
  }
});

// @route   PUT /api/onboarding/flows/:id
// @desc    Update onboarding flow (Admin only)
// @access  Private (Admin)
router.put('/flows/:id', adminAuth, validateObjectId, async (req, res) => {
  try {
    const flow = await OnboardingFlow.findById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({ message: 'Onboarding flow not found' });
    }
    
    // Update flow
    Object.assign(flow, req.body);
    await flow.save();
    
    logger.info(`Onboarding flow updated: ${flow.name} by admin: ${req.user.email}`);
    
    res.json({
      message: 'Onboarding flow updated successfully',
      flow
    });
  } catch (error) {
    logger.error('Update onboarding flow error:', error);
    res.status(500).json({ message: 'Server error updating onboarding flow' });
  }
});

// @route   DELETE /api/onboarding/flows/:id
// @desc    Delete onboarding flow (Admin only)
// @access  Private (Admin)
router.delete('/flows/:id', adminAuth, validateObjectId, async (req, res) => {
  try {
    const flow = await OnboardingFlow.findById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({ message: 'Onboarding flow not found' });
    }
    
    // Soft delete by setting isActive to false
    flow.isActive = false;
    await flow.save();
    
    logger.info(`Onboarding flow deactivated: ${flow.name} by admin: ${req.user.email}`);
    
    res.json({ message: 'Onboarding flow deactivated successfully' });
  } catch (error) {
    logger.error('Delete onboarding flow error:', error);
    res.status(500).json({ message: 'Server error deleting onboarding flow' });
  }
});

export default router;


