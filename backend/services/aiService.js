import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import OnboardingFlowConfig from '../models/OnboardingFlowConfig.js';
import OnboardingProgress from '../models/OnboardingProgress.js';

class AIService {
  constructor() {
    // Simple keyword-based intent recognition
    this.intentKeywords = {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      help: ['help', 'assist', 'support', 'guide', 'how to'],
      question: ['what', 'how', 'why', 'when', 'where', 'explain', 'tell me'],
      gratitude: ['thank', 'thanks', 'appreciate', 'grateful'],
      farewell: ['bye', 'goodbye', 'see you', 'farewell', 'exit'],
      learning: ['learn', 'teach', 'show', 'tutorial', 'guide'],
      confusion: ['confused', 'don\'t understand', 'unclear', 'difficult', 'hard'],
      confirmation: ['yes', 'correct', 'right', 'that\'s right', 'confirm', 'proceed', 'go ahead'],
      correction: ['no', 'wrong', 'incorrect', 'change', 'modify', 'edit', 'update'],
      start_flow: ['start', 'begin', 'ready', 'let\'s go', 'proceed', 'continue'],
      skip: ['skip', 'next', 'pass', 'not applicable', 'n/a']
    };
  }

  async processMessage(message, context = {}) {
    try {
      const startTime = Date.now();
      
      // Check if user is in an onboarding flow
      if (context.onboardingProgress) {
        return await this.processOnboardingMessage(message, context);
      }
      
      // Basic text preprocessing
      const processedText = this.preprocessText(message);
      
      // Intent classification
      const intent = this.classifyIntent(processedText);
      
      // Sentiment analysis
      const sentiment = this.analyzeSentiment(processedText);
      
      // Entity extraction
      const entities = this.extractEntities(processedText);
      
      // Generate response
      const response = await this.generateResponse(processedText, intent, sentiment, entities, context);
      
      const processingTime = Date.now() - startTime;
      
      return {
        id: uuidv4(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          intent,
          confidence: intent.confidence,
          entities,
          sentiment,
          processingTime,
          context
        }
      };
    } catch (error) {
      logger.error('AI processing error:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        inputMessage: message,
        context: context
      });
      
      // Return a simple fallback response
      return {
        id: uuidv4(),
        content: "Hello! I'm your AI assistant for onboarding. How can I help you today?",
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          intent: { name: 'fallback', confidence: 0 },
          confidence: 0,
          entities: [],
          sentiment: { score: 0, label: 'neutral' },
          processingTime: 0,
          context
        }
      };
    }
  }

  async processOnboardingMessage(message, context) {
    try {
      const { onboardingProgress, flowConfig } = context;
      const currentStep = flowConfig.steps.find(step => step.stepId === onboardingProgress.currentStep);
      
      if (!currentStep) {
        return this.createResponse("I'm sorry, I couldn't find the current step. Let me help you restart the process.");
      }

      const intent = this.classifyIntent(message.toLowerCase());
      
      // Handle confirmation responses
      if (intent.name === 'confirmation' && currentStep.isCheckpoint) {
        return await this.handleStepConfirmation(onboardingProgress, currentStep, flowConfig);
      }
      
      // Handle correction responses
      if (intent.name === 'correction' && currentStep.isCheckpoint) {
        return this.createResponse("I understand you'd like to make changes. Please tell me which information needs to be corrected.");
      }
      
      // Handle data collection
      if (currentStep.stepType === 'data_collection') {
        return await this.handleDataCollection(message, onboardingProgress, currentStep, flowConfig);
      }
      
      // Handle completion
      if (currentStep.stepType === 'completion') {
        return this.createResponse(currentStep.confirmationMessage || flowConfig.completionMessage);
      }
      
      return this.createResponse("I'm not sure how to help with that. Could you please provide the information I asked for?");
      
    } catch (error) {
      logger.error('Onboarding message processing error:', error);
      return this.createResponse("I encountered an error processing your response. Please try again.");
    }
  }

  async handleDataCollection(message, onboardingProgress, currentStep, flowConfig) {
    const currentStepProgress = onboardingProgress.getCurrentStepProgress();
    
    if (!currentStepProgress) {
      // Initialize step progress
      onboardingProgress.stepProgress.push({
        stepId: currentStep.stepId,
        stepName: currentStep.stepName,
        status: 'in_progress',
        startedAt: new Date(),
        fieldData: []
      });
    }
    
    // Find the next field to collect
    const nextField = this.getNextFieldToCollect(currentStep, onboardingProgress);
    
    if (!nextField) {
      // All fields collected, show confirmation
      return await this.showStepConfirmation(onboardingProgress, currentStep, flowConfig);
    }
    
    // Extract field value from message
    const fieldValue = this.extractFieldValue(message, nextField);
    
    if (fieldValue !== null) {
      // Update field data
      await onboardingProgress.updateFieldData(currentStep.stepId, nextField.fieldId, fieldValue);
      
      // Check if this was the last field
      const remainingFields = this.getRemainingFields(currentStep, onboardingProgress);
      if (remainingFields.length === 0) {
        return await this.showStepConfirmation(onboardingProgress, currentStep, flowConfig);
      } else {
        // Ask for next field
        const nextFieldToAsk = remainingFields[0];
        return this.createResponse(nextFieldToAsk.prompt);
      }
    } else {
      // Could not extract value, ask for clarification
      return this.createResponse(`I couldn't understand that. ${nextField.prompt}`);
    }
  }

  async showStepConfirmation(onboardingProgress, currentStep, flowConfig) {
    const currentStepProgress = onboardingProgress.getCurrentStepProgress();
    const confirmationData = this.buildConfirmationData(currentStep, currentStepProgress);
    
    const confirmationMessage = currentStep.confirmationMessage.replace('{confirmation_data}', confirmationData);
    
    return this.createResponse(confirmationMessage);
  }

  async handleStepConfirmation(onboardingProgress, currentStep, flowConfig) {
    // Confirm the step data
    const currentStepProgress = onboardingProgress.getCurrentStepProgress();
    const confirmationData = this.buildConfirmationData(currentStep, currentStepProgress);
    
    await onboardingProgress.confirmStepData(currentStep.stepId, confirmationData);
    
    // Move to next step
    if (currentStep.nextStep) {
      await onboardingProgress.moveToNextStep(currentStep.nextStep);
      const nextStep = flowConfig.steps.find(step => step.stepId === currentStep.nextStep);
      
      if (nextStep && nextStep.stepType === 'data_collection') {
        const firstField = nextStep.fields[0];
        return this.createResponse(firstField.prompt);
      } else if (nextStep && nextStep.stepType === 'completion') {
        return this.createResponse(nextStep.confirmationMessage || flowConfig.completionMessage);
      }
    }
    
    return this.createResponse("Thank you for confirming. Let me process this information.");
  }

  getNextFieldToCollect(currentStep, onboardingProgress) {
    const currentStepProgress = onboardingProgress.getCurrentStepProgress();
    if (!currentStepProgress) return currentStep.fields[0];
    
    const collectedFields = currentStepProgress.fieldData.map(field => field.fieldId);
    return currentStep.fields.find(field => !collectedFields.includes(field.fieldId));
  }

  getRemainingFields(currentStep, onboardingProgress) {
    const currentStepProgress = onboardingProgress.getCurrentStepProgress();
    if (!currentStepProgress) return currentStep.fields;
    
    const collectedFields = currentStepProgress.fieldData.map(field => field.fieldId);
    return currentStep.fields.filter(field => !collectedFields.includes(field.fieldId));
  }

  extractFieldValue(message, field) {
    const lowerMessage = message.toLowerCase();
    
    switch (field.fieldType) {
      case 'text':
      case 'textarea':
        return message.trim();
      
      case 'email':
        const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        return emailMatch ? emailMatch[0] : null;
      
      case 'phone':
        const phoneMatch = message.match(/\b\d{10}\b|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
        return phoneMatch ? phoneMatch[0] : null;
      
      case 'date':
        // Simple date extraction - can be enhanced
        const dateMatch = message.match(/\b\d{1,2}(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i);
        if (dateMatch) return dateMatch[0];
        
        const numericDateMatch = message.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/);
        return numericDateMatch ? numericDateMatch[0] : null;
      
      case 'number':
        const numberMatch = message.match(/\b\d+(?:,\d{3})*(?:\.\d{2})?\b/);
        return numberMatch ? numberMatch[0] : null;
      
      case 'select':
        if (field.validation && field.validation.options) {
          const selectedOption = field.validation.options.find(option => 
            lowerMessage.includes(option.toLowerCase())
          );
          return selectedOption || null;
        }
        return null;
      
      default:
        return message.trim();
    }
  }

  buildConfirmationData(currentStep, stepProgress) {
    if (!stepProgress || !stepProgress.fieldData) return '';
    
    return stepProgress.fieldData.map(fieldData => {
      const field = currentStep.fields.find(f => f.fieldId === fieldData.fieldId);
      if (!field) return '';
      
      const confirmationPrompt = field.confirmationPrompt || `${field.fieldName}: {value}`;
      return confirmationPrompt.replace('{value}', fieldData.value);
    }).join('\n');
  }

  createResponse(content) {
    return {
      id: uuidv4(),
      content,
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        intent: { name: 'onboarding', confidence: 1 },
        confidence: 1,
        entities: [],
        sentiment: { score: 0, label: 'neutral' },
        processingTime: 0
      }
    };
  }

  preprocessText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  classifyIntent(text) {
    const lowerText = text.toLowerCase();
    let bestMatch = { name: 'unknown', confidence: 0 };
    
    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      const confidence = matches.length / keywords.length;
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { name: intent, confidence };
      }
    }
    
    return bestMatch;
  }

  analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'sad', 'frustrated', 'annoyed'];
    
    let score = 0;
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 1;
    });
    
    let label = 'neutral';
    if (score > 0) label = 'positive';
    else if (score < 0) label = 'negative';
    
    return {
      score,
      label,
      comparative: score / text.split(' ').length
    };
  }

  extractEntities(text) {
    const entities = [];
    
    // Simple entity extraction based on patterns
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      url: /https?:\/\/[^\s]+/g,
      number: /\b\d+\b/g
    };
    
    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            type,
            value: match,
            confidence: 0.8
          });
        });
      }
    });
    
    return entities;
  }

  async generateResponse(text, intent, sentiment, entities, context) {
    const { name: intentName, confidence } = intent;
    
    // Context-aware response generation
    if (context.onboardingStep) {
      return this.generateOnboardingResponse(text, intentName, context);
    }
    
    // General conversation responses
    switch (intentName) {
      case 'greeting':
        return this.getGreetingResponse(context);
      
      case 'help':
        return this.getHelpResponse(context);
      
      case 'question':
        return this.getQuestionResponse(text, context);
      
      case 'gratitude':
        return this.getGratitudeResponse();
      
      case 'farewell':
        return this.getFarewellResponse();
      
      case 'learning':
        return this.getLearningResponse(context);
      
      case 'confusion':
        return this.getConfusionResponse(context);
      
      default:
        return this.getDefaultResponse(text, context);
    }
  }

  getGreetingResponse(context) {
    const greetings = [
      "Hello! I'm your onboarding assistant. How can I help you today?",
      "Hi there! Welcome! I'm here to guide you through your onboarding process.",
      "Greetings! I'm excited to help you get started. What would you like to know?",
      "Hello! I'm your AI assistant for onboarding. Let's make this process smooth for you!"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  getHelpResponse(context) {
    return "I'm here to help you with your onboarding process! I can assist you with:\n\n" +
           "• Answering questions about the company\n" +
           "• Guiding you through onboarding steps\n" +
           "• Explaining policies and procedures\n" +
           "• Connecting you with the right resources\n\n" +
           "What specific help do you need?";
  }

  getQuestionResponse(text, context) {
    // Simple question answering based on keywords
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('company') || lowerText.includes('organization')) {
      return "Our company is focused on innovation and growth. We value collaboration, creativity, and continuous learning. Is there something specific about the company you'd like to know?";
    }
    
    if (lowerText.includes('benefits') || lowerText.includes('perks')) {
      return "We offer comprehensive benefits including health insurance, retirement plans, flexible working hours, and professional development opportunities. Would you like more details about any specific benefit?";
    }
    
    if (lowerText.includes('policy') || lowerText.includes('policies')) {
      return "We have various policies covering work hours, remote work, code of conduct, and more. Which policy would you like to learn about?";
    }
    
    return "That's a great question! I'd be happy to help you find the answer. Could you provide a bit more detail about what you're looking for?";
  }

  getGratitudeResponse() {
    const responses = [
      "You're very welcome! I'm glad I could help.",
      "Happy to assist! Is there anything else you need?",
      "You're welcome! Feel free to ask if you have more questions.",
      "My pleasure! I'm here whenever you need help."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getFarewellResponse() {
    const responses = [
      "Goodbye! Have a great day!",
      "See you later! Don't hesitate to reach out if you need help.",
      "Take care! I'll be here when you need me.",
      "Farewell! Good luck with your onboarding journey!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getLearningResponse(context) {
    return "I'd love to help you learn! I can guide you through:\n\n" +
           "• Company culture and values\n" +
           "• Your role and responsibilities\n" +
           "• Tools and systems you'll use\n" +
           "• Team structure and processes\n\n" +
           "What would you like to learn about first?";
  }

  getConfusionResponse(context) {
    return "I understand this can be overwhelming! Let me help clarify things for you.\n\n" +
           "• Take it one step at a time\n" +
           "• Ask specific questions\n" +
           "• I can break down complex topics\n" +
           "• We can go at your own pace\n\n" +
           "What's confusing you right now? I'll do my best to explain it clearly.";
  }

  getDefaultResponse(text, context) {
    return "I'm not sure I fully understand what you're asking. Could you rephrase your question or provide more details? I'm here to help with your onboarding process!";
  }

  generateOnboardingResponse(text, intent, context) {
    const { onboardingStep, userProfile } = context;
    
    // Generate context-aware responses based on onboarding step
    switch (onboardingStep) {
      case 'welcome':
        return "Welcome to our team! I'm excited to help you get started. Let's begin with some basic information about yourself.";
      
      case 'profile':
        return "Let's set up your profile. This will help your colleagues get to know you better. What would you like to share about yourself?";
      
      case 'preferences':
        return "Now let's configure your preferences. This will help personalize your experience. What are your communication preferences?";
      
      case 'training':
        return "Great! Now let's go through some important training materials. I'll guide you through each section step by step.";
      
      case 'quiz':
        return "Let's test your understanding with a quick quiz. Don't worry, this is just to help reinforce what you've learned.";
      
      case 'completion':
        return "Congratulations! You've completed the onboarding process. You're all set to start your journey with us!";
      
      default:
        return this.getDefaultResponse(text, context);
    }
  }

  // Method to add new intent keywords
  addIntentKeywords(intent, keywords) {
    if (!this.intentKeywords[intent]) {
      this.intentKeywords[intent] = [];
    }
    this.intentKeywords[intent].push(...keywords);
    logger.info(`Added keywords for intent "${intent}": ${keywords.join(', ')}`);
  }

  // Method to get conversation suggestions
  getConversationSuggestions(context) {
    const suggestions = [
      "Tell me about the company culture",
      "What are my main responsibilities?",
      "How do I access company resources?",
      "Who should I contact for help?",
      "What tools will I be using?"
    ];
    
    return suggestions;
  }
}

export default new AIService();


