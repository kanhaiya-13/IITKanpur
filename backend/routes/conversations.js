import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import aiService from '../services/aiService.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { validateMessage, validateConversation, validateObjectId, validatePagination } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @route   POST /api/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/', auth, validateConversation, async (req, res) => {
  try {
    const { title, context } = req.body;
    const sessionId = uuidv4();

    const conversation = new Conversation({
      userId: req.user._id,
      sessionId,
      title: title || 'New Conversation',
      context: context || {},
      messages: []
    });

    await conversation.save();

    logger.info(`New conversation created: ${sessionId} by user: ${req.user.email}`);

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        createdAt: conversation.createdAt
      }
    });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error creating conversation' });
  }
});

// @route   GET /api/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/', auth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      userId: req.user._id,
      isArchived: false
    })
    .select('sessionId title status lastActivity createdAt messageCount')
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Conversation.countDocuments({
      userId: req.user._id,
      isArchived: false
    });

    res.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// @route   GET /api/conversations/:sessionId
// @desc    Get specific conversation
// @access  Private
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error fetching conversation' });
  }
});

// @route   POST /api/conversations/:sessionId/messages
// @desc    Send a message in conversation
// @access  Private
router.post('/:sessionId/messages', auth, validateMessage, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, role = 'user' } = req.body;

    // Find conversation
    const conversation = await Conversation.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Create user message
    const userMessage = {
      id: uuidv4(),
      content,
      role,
      timestamp: new Date()
    };

    // Add user message to conversation
    await conversation.addMessage(userMessage);

    // Get user context for AI processing
    const user = await User.findById(req.user._id);
    const context = {
      userId: req.user._id,
      userProfile: user.profile,
      onboardingStep: user.onboarding.currentStep,
      conversationHistory: conversation.getRecentMessages(5)
    };

    // Process message with AI
    const aiResponse = await aiService.processMessage(content, context);

    // Add AI response to conversation
    await conversation.addMessage(aiResponse);

    // Update conversation context
    await conversation.updateContext({
      lastUserMessage: content,
      lastAIResponse: aiResponse.content,
      lastInteraction: new Date()
    });

    logger.info(`Message processed in conversation: ${sessionId}`);

    res.json({
      message: 'Message sent successfully',
      userMessage,
      aiResponse
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ message: 'Server error processing message' });
  }
});

// @route   GET /api/conversations/:sessionId/messages
// @desc    Get conversation messages
// @access  Private
router.get('/:sessionId/messages', auth, validatePagination, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = conversation.messages
      .slice(skip, skip + limit)
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
        metadata: msg.metadata
      }));

    const total = conversation.messages.length;

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// @route   PUT /api/conversations/:sessionId
// @desc    Update conversation
// @access  Private
router.put('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, status, context } = req.body;

    const conversation = await Conversation.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Update fields
    if (title) conversation.title = title;
    if (status) conversation.status = status;
    if (context) conversation.context = { ...conversation.context, ...context };

    await conversation.save();

    res.json({
      message: 'Conversation updated successfully',
      conversation
    });
  } catch (error) {
    logger.error('Update conversation error:', error);
    res.status(500).json({ message: 'Server error updating conversation' });
  }
});

// @route   DELETE /api/conversations/:sessionId
// @desc    Archive conversation
// @access  Private
router.delete('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.isArchived = true;
    conversation.status = 'archived';
    await conversation.save();

    logger.info(`Conversation archived: ${sessionId} by user: ${req.user.email}`);

    res.json({ message: 'Conversation archived successfully' });
  } catch (error) {
    logger.error('Archive conversation error:', error);
    res.status(500).json({ message: 'Server error archiving conversation' });
  }
});

// @route   POST /api/conversations/:sessionId/feedback
// @desc    Submit feedback for conversation
// @access  Private
router.post('/:sessionId/feedback', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const conversation = await Conversation.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Add feedback to conversation analytics
    if (!conversation.analytics.userFeedback) {
      conversation.analytics.userFeedback = [];
    }

    conversation.analytics.userFeedback.push({
      userId: req.user._id,
      rating,
      comment,
      timestamp: new Date()
    });

    await conversation.save();

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    logger.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// @route   GET /api/conversations/analytics/summary
// @desc    Get conversation analytics summary
// @access  Private
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const totalConversations = await Conversation.countDocuments({
      userId,
      isArchived: false
    });

    const totalMessages = await Conversation.aggregate([
      { $match: { userId: userId, isArchived: false } },
      { $group: { _id: null, total: { $sum: '$analytics.messageCount' } } }
    ]);

    const recentActivity = await Conversation.find({
      userId,
      isArchived: false
    })
    .select('title lastActivity status')
    .sort({ lastActivity: -1 })
    .limit(5);

    res.json({
      summary: {
        totalConversations,
        totalMessages: totalMessages[0]?.total || 0,
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

export default router;


