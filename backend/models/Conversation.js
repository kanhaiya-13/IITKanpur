import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    intent: String,
    confidence: Number,
    entities: [{
      type: String,
      value: String,
      confidence: Number
    }],
    sentiment: {
      score: Number,
      label: String
    },
    context: mongoose.Schema.Types.Mixed
  },
  attachments: [{
    type: String,
    url: String,
    name: String,
    size: Number
  }]
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  context: {
    currentStep: Number,
    onboardingFlow: String,
    userPreferences: mongoose.Schema.Types.Mixed,
    sessionData: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  analytics: {
    messageCount: { type: Number, default: 0 },
    averageResponseTime: Number,
    userSatisfaction: Number,
    topics: [String],
    keywords: [String]
  },
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ sessionId: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastActivity: -1 });

// Update lastActivity when messages are added
conversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
    this.analytics.messageCount = this.messages.length;
  }
  next();
});

// Virtual for message count
conversationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add message
conversationSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  this.lastActivity = new Date();
  return this.save();
};

// Method to get recent messages
conversationSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Method to update context
conversationSchema.methods.updateContext = function(contextData) {
  this.context = { ...this.context, ...contextData };
  return this.save();
};

export default mongoose.model('Conversation', conversationSchema);


