import express from 'express';
import { body, param, validationResult } from 'express-validator';
import OnboardingFlowConfig from '../models/OnboardingFlowConfig.js';
import OnboardingProgress from '../models/OnboardingProgress.js';
import { auth } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all available onboarding flows
router.get('/flows', auth, async (req, res) => {
  try {
    const flows = await OnboardingFlowConfig.find({ isActive: true })
      .select('flowId flowName flowDescription welcomeMessage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      flows
    });
  } catch (error) {
    logger.error('Error fetching onboarding flows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding flows'
    });
  }
});

// Get specific onboarding flow configuration
router.get('/flows/:flowId', auth, async (req, res) => {
  try {
    const { flowId } = req.params;
    
    const flow = await OnboardingFlowConfig.findOne({ 
      flowId, 
      isActive: true 
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding flow not found'
      });
    }

    res.json({
      success: true,
      flow
    });
  } catch (error) {
    logger.error('Error fetching onboarding flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding flow'
    });
  }
});

// Start a new onboarding flow
router.post('/start/:flowId', [
  auth,
  param('flowId').notEmpty().withMessage('Flow ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { flowId } = req.params;
    const { sessionId } = req.body;
    const userId = req.user._id;

    // Get flow configuration
    const flowConfig = await OnboardingFlowConfig.findOne({ 
      flowId, 
      isActive: true 
    });

    if (!flowConfig) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding flow not found'
      });
    }

    // Check if user already has an active progress for this flow
    const existingProgress = await OnboardingProgress.findOne({
      userId,
      flowId,
      status: { $in: ['active', 'paused'] }
    });

    if (existingProgress) {
      return res.json({
        success: true,
        message: 'Resuming existing onboarding flow',
        progress: existingProgress,
        flowConfig
      });
    }

    // Create new onboarding progress
    const onboardingProgress = new OnboardingProgress({
      userId,
      flowId,
      sessionId: sessionId || `session_${Date.now()}`,
      currentStep: 'welcome',
      status: 'active',
      stepProgress: [],
      collectedData: {}
    });

    await onboardingProgress.save();

    // Get the first step
    const firstStep = flowConfig.steps.find(step => step.stepId === 'welcome') || flowConfig.steps[0];
    const welcomeMessage = flowConfig.welcomeMessage;

    res.json({
      success: true,
      message: 'Onboarding flow started successfully',
      progress: onboardingProgress,
      flowConfig,
      currentStep: firstStep,
      welcomeMessage
    });

  } catch (error) {
    logger.error('Error starting onboarding flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start onboarding flow'
    });
  }
});

// Get current onboarding progress
router.get('/progress/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const progress = await OnboardingProgress.findOne({
      sessionId,
      userId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding progress not found'
      });
    }

    // Get flow configuration
    const flowConfig = await OnboardingFlowConfig.findOne({ 
      flowId: progress.flowId, 
      isActive: true 
    });

    if (!flowConfig) {
      return res.status(404).json({
        success: false,
        message: 'Flow configuration not found'
      });
    }

    const currentStep = flowConfig.steps.find(step => step.stepId === progress.currentStep);

    res.json({
      success: true,
      progress,
      flowConfig,
      currentStep
    });

  } catch (error) {
    logger.error('Error fetching onboarding progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding progress'
    });
  }
});

// Update onboarding progress (for manual updates)
router.put('/progress/:sessionId', [
  auth,
  body('currentStep').optional().isString(),
  body('status').optional().isIn(['active', 'paused', 'completed', 'abandoned'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const progress = await OnboardingProgress.findOne({
      sessionId,
      userId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding progress not found'
      });
    }

    // Update progress
    Object.assign(progress, updates);
    progress.lastActivity = new Date();

    if (updates.status === 'completed') {
      progress.completedAt = new Date();
    }

    await progress.save();

    res.json({
      success: true,
      message: 'Onboarding progress updated successfully',
      progress
    });

  } catch (error) {
    logger.error('Error updating onboarding progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update onboarding progress'
    });
  }
});

// Get user's onboarding history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const progressList = await OnboardingProgress.find({ userId })
      .populate('userId', 'email firstName lastName')
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await OnboardingProgress.countDocuments({ userId });

    res.json({
      success: true,
      progressList,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    logger.error('Error fetching onboarding history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding history'
    });
  }
});

// Create new onboarding flow (admin only)
router.post('/flows', [
  auth,
  body('flowId').notEmpty().withMessage('Flow ID is required'),
  body('flowName').notEmpty().withMessage('Flow name is required'),
  body('welcomeMessage').notEmpty().withMessage('Welcome message is required'),
  body('completionMessage').notEmpty().withMessage('Completion message is required'),
  body('steps').isArray().withMessage('Steps must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if flow already exists
    const existingFlow = await OnboardingFlowConfig.findOne({ flowId: req.body.flowId });
    if (existingFlow) {
      return res.status(409).json({
        success: false,
        message: 'Flow with this ID already exists'
      });
    }

    const flowData = {
      ...req.body,
      createdBy: req.user._id
    };

    const newFlow = new OnboardingFlowConfig(flowData);
    await newFlow.save();

    res.status(201).json({
      success: true,
      message: 'Onboarding flow created successfully',
      flow: newFlow
    });

  } catch (error) {
    logger.error('Error creating onboarding flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create onboarding flow'
    });
  }
});

export default router;
