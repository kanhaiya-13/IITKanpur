import { body, param, query, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name cannot be empty'),
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('profile.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Conversation validation rules
const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('role')
    .isIn(['user', 'assistant', 'system'])
    .withMessage('Invalid message role'),
  handleValidationErrors
];

const validateConversation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
  handleValidationErrors
];

// Onboarding validation rules
const validateOnboardingStep = [
  body('stepId')
    .notEmpty()
    .withMessage('Step ID is required'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Step data must be an object'),
  handleValidationErrors
];

const validateOnboardingFlow = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Flow name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('steps')
    .isArray({ min: 1 })
    .withMessage('At least one step is required'),
  body('steps.*.id')
    .notEmpty()
    .withMessage('Step ID is required'),
  body('steps.*.title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Step title must be between 1 and 100 characters'),
  body('steps.*.type')
    .isIn(['welcome', 'profile', 'preferences', 'training', 'quiz', 'completion'])
    .withMessage('Invalid step type'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validateSessionId = [
  param('sessionId')
    .isUUID()
    .withMessage('Invalid session ID format'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

export {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateMessage,
  validateConversation,
  validateOnboardingStep,
  validateOnboardingFlow,
  validateObjectId,
  validateSessionId,
  validatePagination,
  handleValidationErrors
};


