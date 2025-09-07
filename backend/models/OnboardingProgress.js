import mongoose from 'mongoose';

const fieldDataSchema = new mongoose.Schema({
  fieldId: String,
  value: mongoose.Schema.Types.Mixed,
  extractedAt: {
    type: Date,
    default: Date.now
  },
  confirmed: {
    type: Boolean,
    default: false
  }
});

const stepProgressSchema = new mongoose.Schema({
  stepId: String,
  stepName: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    default: 'pending'
  },
  startedAt: Date,
  completedAt: Date,
  fieldData: [fieldDataSchema],
  confirmationData: mongoose.Schema.Types.Mixed
});

const onboardingProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flowId: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  currentStep: {
    type: String,
    default: 'welcome'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active'
  },
  stepProgress: [stepProgressSchema],
  collectedData: mongoose.Schema.Types.Mixed,
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
onboardingProgressSchema.index({ userId: 1, flowId: 1 });
onboardingProgressSchema.index({ sessionId: 1 });
onboardingProgressSchema.index({ status: 1 });

// Method to get current step progress
onboardingProgressSchema.methods.getCurrentStepProgress = function() {
  return this.stepProgress.find(step => step.stepId === this.currentStep);
};

// Method to update field data
onboardingProgressSchema.methods.updateFieldData = function(stepId, fieldId, value) {
  const stepProgress = this.stepProgress.find(step => step.stepId === stepId);
  if (!stepProgress) return false;

  const existingField = stepProgress.fieldData.find(field => field.fieldId === fieldId);
  if (existingField) {
    existingField.value = value;
    existingField.extractedAt = new Date();
  } else {
    stepProgress.fieldData.push({
      fieldId,
      value,
      extractedAt: new Date()
    });
  }

  this.lastActivity = new Date();
  return this.save();
};

// Method to confirm step data
onboardingProgressSchema.methods.confirmStepData = function(stepId, confirmationData) {
  const stepProgress = this.stepProgress.find(step => step.stepId === stepId);
  if (!stepProgress) return false;

  stepProgress.status = 'completed';
  stepProgress.completedAt = new Date();
  stepProgress.confirmationData = confirmationData;

  // Mark all fields as confirmed
  stepProgress.fieldData.forEach(field => {
    field.confirmed = true;
  });

  this.lastActivity = new Date();
  return this.save();
};

// Method to move to next step
onboardingProgressSchema.methods.moveToNextStep = function(nextStepId) {
  this.currentStep = nextStepId;
  this.lastActivity = new Date();
  return this.save();
};

export default mongoose.model('OnboardingProgress', onboardingProgressSchema);
