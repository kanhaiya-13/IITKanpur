import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import aiService from '../services/aiService.js';
import logger from '../utils/logger.js';

const setupSocketHandlers = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.email} (${socket.id})`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle joining conversation room
    socket.on('join_conversation', async (data) => {
      try {
        const { sessionId } = data;
        
        // Verify user has access to this conversation
        const conversation = await Conversation.findOne({
          sessionId,
          userId: socket.userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        socket.join(`conversation_${sessionId}`);
        socket.currentSessionId = sessionId;
        
        logger.info(`User ${socket.user.email} joined conversation: ${sessionId}`);
        
        socket.emit('joined_conversation', { sessionId });
      } catch (error) {
        logger.error('Join conversation error:', error);
        socket.emit('error', { message: 'Error joining conversation' });
      }
    });

    // Handle leaving conversation room
    socket.on('leave_conversation', (data) => {
      const { sessionId } = data;
      socket.leave(`conversation_${sessionId}`);
      socket.currentSessionId = null;
      
      logger.info(`User ${socket.user.email} left conversation: ${sessionId}`);
      socket.emit('left_conversation', { sessionId });
    });

    // Handle real-time messages
    socket.on('send_message', async (data) => {
      try {
        const { sessionId, content, role = 'user' } = data;

        if (!sessionId || !content) {
          socket.emit('error', { message: 'Session ID and content are required' });
          return;
        }

        // Verify user has access to this conversation
        const conversation = await Conversation.findOne({
          sessionId,
          userId: socket.userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
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

        // Broadcast user message to conversation room
        io.to(`conversation_${sessionId}`).emit('message_received', {
          type: 'user_message',
          message: userMessage,
          sessionId
        });

        // Process message with AI
        const context = {
          userId: socket.userId,
          userProfile: socket.user.profile,
          onboardingStep: socket.user.onboarding.currentStep,
          conversationHistory: conversation.getRecentMessages(5)
        };

        let aiResponse;
        try {
          aiResponse = await aiService.processMessage(content, context);
        } catch (aiError) {
          logger.error('AI processing error in socket:', aiError);
          // Fallback response if AI fails
          aiResponse = {
            id: uuidv4(),
            content: "I'm here to help you with your onboarding! How can I assist you today?",
            role: 'assistant',
            timestamp: new Date(),
            metadata: {
              intent: 'fallback',
              confidence: 0,
              entities: [],
              sentiment: { score: 0, label: 'neutral' },
              processingTime: 0,
              context
            }
          };
        }

        // Add AI response to conversation
        await conversation.addMessage(aiResponse);

        // Update conversation context
        await conversation.updateContext({
          lastUserMessage: content,
          lastAIResponse: aiResponse.content,
          lastInteraction: new Date()
        });

        // Broadcast AI response to conversation room
        io.to(`conversation_${sessionId}`).emit('message_received', {
          type: 'ai_response',
          message: aiResponse,
          sessionId
        });

        logger.info(`Message processed in conversation: ${sessionId} by user: ${socket.user.email}`);

      } catch (error) {
        logger.error('Send message error:', error);
        socket.emit('error', { 
          message: 'Error processing message',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
        });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { sessionId } = data;
      if (socket.currentSessionId === sessionId) {
        socket.to(`conversation_${sessionId}`).emit('user_typing', {
          userId: socket.userId,
          userName: socket.user.fullName,
          sessionId
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { sessionId } = data;
      if (socket.currentSessionId === sessionId) {
        socket.to(`conversation_${sessionId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          sessionId
        });
      }
    });

    // Handle onboarding progress updates
    socket.on('onboarding_progress', async (data) => {
      try {
        const { stepId, completed, data: stepData } = data;

        if (completed) {
          // Update user's onboarding progress
          const user = await User.findById(socket.userId);
          
          if (!user.onboarding.completedSteps.find(step => step.stepId === stepId)) {
            user.onboarding.completedSteps.push({
              stepId,
              completedAt: new Date(),
              data: stepData || {}
            });
            user.onboarding.currentStep = user.onboarding.completedSteps.length;
            
            await user.save();
          }
        }

        // Broadcast progress update to user's personal room
        socket.emit('onboarding_updated', {
          currentStep: socket.user.onboarding.currentStep,
          completedSteps: socket.user.onboarding.completedSteps.length
        });

        logger.info(`Onboarding progress updated for user: ${socket.user.email}`);

      } catch (error) {
        logger.error('Onboarding progress error:', error);
        socket.emit('error', { message: 'Error updating onboarding progress' });
      }
    });

    // Handle user status updates
    socket.on('update_status', (data) => {
      const { status } = data;
      socket.userStatus = status;
      
      // Broadcast status update to user's personal room
      socket.emit('status_updated', { status });
      
      logger.info(`User status updated: ${socket.user.email} - ${status}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.user.email} (${socket.id}) - Reason: ${reason}`);
      
      // Clean up any active sessions
      if (socket.currentSessionId) {
        socket.leave(`conversation_${socket.currentSessionId}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user.email}:`, error);
    });
  });

  // Broadcast system messages
  const broadcastSystemMessage = (message, targetUsers = null) => {
    const systemMessage = {
      id: uuidv4(),
      content: message,
      role: 'system',
      timestamp: new Date(),
      metadata: {
        intent: 'system',
        confidence: 1
      }
    };

    if (targetUsers) {
      targetUsers.forEach(userId => {
        io.to(`user_${userId}`).emit('system_message', systemMessage);
      });
    } else {
      io.emit('system_message', systemMessage);
    }
  };

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Socket server shutting down gracefully');
    broadcastSystemMessage('Server is shutting down. Please save your work.');
    io.close();
  });

  return {
    broadcastSystemMessage
  };
};

export { setupSocketHandlers };


