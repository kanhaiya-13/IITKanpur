import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  stepId: {
    type: String,
    required: true
  },
  stepName: {
    type: String,
    required: true
  },
  stepType: {
    type: String,
    enum: ['data_collection', 'confirmation', 'document_upload', 'completion'],
    required: true
  },
  fields: [{
    fieldId: {
      type: String,
      required: true
    },
    fieldName: {
      type: String,
      required: true
    },
    fieldType: {
      type: String,
      enum: ['text', 'email', 'phone', 'date', 'number', 'select', 'textarea', 'file'],
      required: true
    },
    required: {
      type: Boolean,
      default: true
    },
    validation: {
      pattern: String,
      minLength: Number,
      maxLength: Number,
      options: [String] // For select fields
    },
    prompt: {
      type: String,
      required: true
    },
    confirmationPrompt: String
  }],
  confirmationMessage: String,
  nextStep: String,
  isCheckpoint: {
    type: Boolean,
    default: false
  }
});

const onboardingFlowConfigSchema = new mongoose.Schema({
  flowId: {
    type: String,
    required: true,
    unique: true
  },
  flowName: {
    type: String,
    required: true
  },
  flowDescription: String,
  welcomeMessage: {
    type: String,
    required: true
  },
  completionMessage: {
    type: String,
    required: true
  },
  steps: [stepSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
onboardingFlowConfigSchema.index({ flowId: 1 });
onboardingFlowConfigSchema.index({ isActive: 1 });

export default mongoose.model('OnboardingFlowConfig', onboardingFlowConfigSchema);
