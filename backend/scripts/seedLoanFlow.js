import OnboardingFlowConfig from '../models/OnboardingFlowConfig.js';
import logger from '../utils/logger.js';

const loanApplicationFlow = {
  flowId: 'loan_application',
  flowName: 'Loan Application',
  flowDescription: 'Complete loan application process with personal and financial details',
  welcomeMessage: "Hello! I'm here to help you apply for your loan. I'll just ask you a few quick questions, and we'll be done in a few minutes. Ready to begin?",
  completionMessage: "Perfect! Your loan application is now submitted. We'll review it and get back to you shortly with the next steps. Thank you for your time!",
  steps: [
    {
      stepId: 'personal_details',
      stepName: 'Personal Details',
      stepType: 'data_collection',
      fields: [
        {
          fieldId: 'full_name',
          fieldName: 'Full Name',
          fieldType: 'text',
          required: true,
          prompt: "Great! Can I have your full name as per your official documents?",
          confirmationPrompt: "Name: {value}"
        },
        {
          fieldId: 'date_of_birth',
          fieldName: 'Date of Birth',
          fieldType: 'date',
          required: true,
          prompt: "And your date of birth?",
          confirmationPrompt: "DOB: {value}"
        },
        {
          fieldId: 'gender',
          fieldName: 'Gender',
          fieldType: 'select',
          required: true,
          validation: {
            options: ['Male', 'Female', 'Other']
          },
          prompt: "Gender?",
          confirmationPrompt: "Gender: {value}"
        },
        {
          fieldId: 'mobile_number',
          fieldName: 'Mobile Number',
          fieldType: 'phone',
          required: true,
          prompt: "Which mobile number should we use to contact you?",
          confirmationPrompt: "Mobile: {value}"
        },
        {
          fieldId: 'email_address',
          fieldName: 'Email Address',
          fieldType: 'email',
          required: true,
          prompt: "And your email address?",
          confirmationPrompt: "Email: {value}"
        }
      ],
      isCheckpoint: true,
      confirmationMessage: "Just to confirm, here's what I have:\n{confirmation_data}\nIs that correct?",
      nextStep: 'other_details'
    },
    {
      stepId: 'other_details',
      stepName: 'Other Details',
      stepType: 'data_collection',
      fields: [
        {
          fieldId: 'current_address',
          fieldName: 'Current Address',
          fieldType: 'textarea',
          required: true,
          prompt: "What's your current residential address?",
          confirmationPrompt: "Current Address: {value}"
        },
        {
          fieldId: 'address_type',
          fieldName: 'Address Type',
          fieldType: 'select',
          required: true,
          validation: {
            options: ['Owned', 'Rented', 'Provided by employer']
          },
          prompt: "Is this owned, rented, or provided by your employer?",
          confirmationPrompt: "({value})"
        },
        {
          fieldId: 'stay_duration',
          fieldName: 'Stay Duration',
          fieldType: 'text',
          required: true,
          prompt: "How long have you been staying here?",
          confirmationPrompt: "{value}"
        },
        {
          fieldId: 'permanent_address',
          fieldName: 'Permanent Address',
          fieldType: 'textarea',
          required: false,
          prompt: "Do you have a different permanent address?",
          confirmationPrompt: "Permanent Address: {value}"
        },
        {
          fieldId: 'monthly_income',
          fieldName: 'Monthly Income',
          fieldType: 'number',
          required: true,
          prompt: "What's your monthly net income after deductions?",
          confirmationPrompt: "Monthly net income: {value} ₹"
        },
        {
          fieldId: 'bank_name',
          fieldName: 'Bank Name',
          fieldType: 'text',
          required: true,
          prompt: "Which bank account should we use for loan disbursement?",
          confirmationPrompt: "Bank: {value}"
        },
        {
          fieldId: 'account_number',
          fieldName: 'Account Number',
          fieldType: 'text',
          required: true,
          prompt: "Can you confirm the account number and IFSC code?",
          confirmationPrompt: "Account No: {value}"
        },
        {
          fieldId: 'ifsc_code',
          fieldName: 'IFSC Code',
          fieldType: 'text',
          required: true,
          prompt: "And the IFSC code?",
          confirmationPrompt: "IFSC Code: {value}"
        }
      ],
      isCheckpoint: true,
      confirmationMessage: "Just to confirm, here's what I have:\n{confirmation_data}\nShall I go ahead with these details?",
      nextStep: 'completion'
    },
    {
      stepId: 'completion',
      stepName: 'Application Complete',
      stepType: 'completion',
      fields: [],
      confirmationMessage: "Perfect! Your loan application is now submitted. We'll review it and get back to you shortly with the next steps. Thank you for your time!"
    }
  ],
  isActive: true
};

async function seedLoanFlow() {
  try {
    // Check if flow already exists
    const existingFlow = await OnboardingFlowConfig.findOne({ flowId: 'loan_application' });
    
    if (existingFlow) {
      logger.info('Loan application flow already exists, updating...');
      await OnboardingFlowConfig.findOneAndUpdate(
        { flowId: 'loan_application' },
        loanApplicationFlow,
        { upsert: true, new: true }
      );
    } else {
      logger.info('Creating loan application flow...');
      await OnboardingFlowConfig.create(loanApplicationFlow);
    }
    
    logger.info('✅ Loan application flow seeded successfully!');
    
    // Also create a simple onboarding flow for comparison
    const simpleOnboardingFlow = {
      flowId: 'simple_onboarding',
      flowName: 'Simple Onboarding',
      flowDescription: 'Basic employee onboarding process',
      welcomeMessage: "Welcome to our company! I'll help you get started with your onboarding process.",
      completionMessage: "Congratulations! You've completed your onboarding. Welcome to the team!",
      steps: [
        {
          stepId: 'welcome',
          stepName: 'Welcome',
          stepType: 'data_collection',
          fields: [
            {
              fieldId: 'employee_id',
              fieldName: 'Employee ID',
              fieldType: 'text',
              required: true,
              prompt: "What's your employee ID?",
              confirmationPrompt: "Employee ID: {value}"
            }
          ],
          nextStep: 'profile_setup'
        },
        {
          stepId: 'profile_setup',
          stepName: 'Profile Setup',
          stepType: 'data_collection',
          fields: [
            {
              fieldId: 'department',
              fieldName: 'Department',
              fieldType: 'text',
              required: true,
              prompt: "Which department are you joining?",
              confirmationPrompt: "Department: {value}"
            }
          ],
          nextStep: 'completion'
        },
        {
          stepId: 'completion',
          stepName: 'Onboarding Complete',
          stepType: 'completion',
          fields: []
        }
      ],
      isActive: true
    };

    const existingSimpleFlow = await OnboardingFlowConfig.findOne({ flowId: 'simple_onboarding' });
    if (!existingSimpleFlow) {
      await OnboardingFlowConfig.create(simpleOnboardingFlow);
      logger.info('✅ Simple onboarding flow created!');
    }

  } catch (error) {
    logger.error('Error seeding loan flow:', error);
    throw error;
  }
}

export default seedLoanFlow;
