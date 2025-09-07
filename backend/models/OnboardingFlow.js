import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['welcome', 'profile', 'preferences', 'training', 'quiz', 'completion'],
    required: true
  },
  content: {
    text: String,
    questions: [{
      id: String,
      question: String,
      type: {
        type: String,
        enum: ['text', 'multiple-choice', 'checkbox', 'rating', 'file-upload']
      },
      options: [String],
      required: Boolean,
      validation: mongoose.Schema.Types.Mixed
    }],
    resources: [{
      title: String,
      url: String,
      type: String
    }]
  },
  conditions: {
    required: Boolean,
    dependsOn: [String],
    skipConditions: mongoose.Schema.Types.Mixed
  },
  order: {
    type: Number,
    required: true
  },
  estimatedTime: Number, // in minutes
  isOptional: {
    type: Boolean,
    default: false
  }
});

const onboardingFlowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  version: {
    type: String,
    default: '1.0.0'
  },
  steps: [stepSchema],
  settings: {
    allowSkip: {
      type: Boolean,
      default: true
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    timeLimit: Number, // in minutes
    completionReward: String,
    welcomeMessage: String,
    completionMessage: String
  },
  targetAudience: {
    roles: [String],
    departments: [String],
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  analytics: {
    totalCompletions: { type: Number, default: 0 },
    averageCompletionTime: Number,
    stepCompletionRates: mongoose.Schema.Types.Mixed,
    userFeedback: [{
      userId: mongoose.Schema.Types.ObjectId,
      rating: Number,
      comment: String,
      timestamp: Date
    }]
  }
}, {
  timestamps: true
});

// Indexes
onboardingFlowSchema.index({ name: 1 });
onboardingFlowSchema.index({ isActive: 1 });
onboardingFlowSchema.index({ 'targetAudience.roles': 1 });

// Method to get step by ID
onboardingFlowSchema.methods.getStep = function(stepId) {
  return this.steps.find(step => step.id === stepId);
};

// Method to get next step
onboardingFlowSchema.methods.getNextStep = function(currentStepId) {
  const currentIndex = this.steps.findIndex(step => step.id === currentStepId);
  return currentIndex >= 0 && currentIndex < this.steps.length - 1 
    ? this.steps[currentIndex + 1] 
    : null;
};

// Method to get previous step
onboardingFlowSchema.methods.getPreviousStep = function(currentStepId) {
  const currentIndex = this.steps.findIndex(step => step.id === currentStepId);
  return currentIndex > 0 ? this.steps[currentIndex - 1] : null;
};

// Method to calculate progress
onboardingFlowSchema.methods.calculateProgress = function(completedSteps) {
  const totalSteps = this.steps.length;
  const completedCount = completedSteps.length;
  return Math.round((completedCount / totalSteps) * 100);
};

// Static method to get active flows
onboardingFlowSchema.statics.getActiveFlows = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

export default mongoose.model('OnboardingFlow', onboardingFlowSchema);


