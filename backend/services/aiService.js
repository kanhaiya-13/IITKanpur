import natural from 'natural';
import Sentiment from 'sentiment';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

class AIService {
  constructor() {
    this.sentiment = new Sentiment();
    this.classifier = new natural.BayesClassifier();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Initialize with basic training data
    this.initializeClassifier();
  }

  initializeClassifier() {
    // Basic intent classification training data
    const trainingData = [
      { text: 'hello', intent: 'greeting' },
      { text: 'hi there', intent: 'greeting' },
      { text: 'good morning', intent: 'greeting' },
      { text: 'help me', intent: 'help' },
      { text: 'i need help', intent: 'help' },
      { text: 'can you help', intent: 'help' },
      { text: 'what is this', intent: 'question' },
      { text: 'how does this work', intent: 'question' },
      { text: 'explain', intent: 'question' },
      { text: 'thank you', intent: 'gratitude' },
      { text: 'thanks', intent: 'gratitude' },
      { text: 'goodbye', intent: 'farewell' },
      { text: 'bye', intent: 'farewell' },
      { text: 'see you later', intent: 'farewell' },
      { text: 'i want to learn', intent: 'learning' },
      { text: 'teach me', intent: 'learning' },
      { text: 'show me how', intent: 'learning' },
      { text: 'i am confused', intent: 'confusion' },
      { text: 'i don\'t understand', intent: 'confusion' },
      { text: 'this is hard', intent: 'confusion' }
    ];

    trainingData.forEach(item => {
      this.classifier.addDocument(item.text, item.intent);
    });

    this.classifier.train();
  }

  async processMessage(message, context = {}) {
    try {
      const startTime = Date.now();
      
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
          confidence: this.classifier.getClassifications(processedText)[0]?.value || 0,
          entities,
          sentiment,
          processingTime,
          context
        }
      };
    } catch (error) {
      logger.error('AI processing error:', error);
      return {
        id: uuidv4(),
        content: "I'm sorry, I encountered an error processing your message. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          intent: 'error',
          confidence: 0,
          entities: [],
          sentiment: { score: 0, label: 'neutral' },
          processingTime: 0,
          context
        }
      };
    }
  }

  preprocessText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  classifyIntent(text) {
    const classifications = this.classifier.getClassifications(text);
    const topClassification = classifications[0];
    
    return {
      name: topClassification?.label || 'unknown',
      confidence: topClassification?.value || 0
    };
  }

  analyzeSentiment(text) {
    const result = this.sentiment.analyze(text);
    
    let label = 'neutral';
    if (result.score > 2) label = 'positive';
    else if (result.score < -2) label = 'negative';
    
    return {
      score: result.score,
      label,
      comparative: result.comparative
    };
  }

  extractEntities(text) {
    const entities = [];
    const tokens = this.tokenizer.tokenize(text);
    
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

  // Method to retrain classifier with new data
  addTrainingData(text, intent) {
    this.classifier.addDocument(text, intent);
    this.classifier.train();
    logger.info(`Added training data: "${text}" -> ${intent}`);
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


