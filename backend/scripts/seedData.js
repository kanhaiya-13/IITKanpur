import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import OnboardingFlow from '../models/OnboardingFlow.js';
import seedLoanFlow from './seedLoanFlow.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/conversational-agent');
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Create admin user
    const adminUser = new User({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      profile: {
        department: 'IT',
        position: 'System Administrator',
        bio: 'System administrator for the onboarding platform'
      },
      onboarding: {
        isCompleted: true,
        currentStep: 5,
        completedSteps: [
          { stepId: 'welcome', completedAt: new Date(), data: {} },
          { stepId: 'profile', completedAt: new Date(), data: {} },
          { stepId: 'preferences', completedAt: new Date(), data: {} },
          { stepId: 'training', completedAt: new Date(), data: {} },
          { stepId: 'completion', completedAt: new Date(), data: {} }
        ]
      }
    });

    // Create test user
    const testUser = new User({
      email: 'user@example.com',
      password: 'user123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      profile: {
        department: 'Engineering',
        position: 'Software Developer',
        bio: 'New team member ready to learn'
      },
      onboarding: {
        isCompleted: false,
        currentStep: 1,
        completedSteps: [
          { stepId: 'welcome', completedAt: new Date(), data: {} }
        ]
      }
    });

    await adminUser.save();
    await testUser.save();
    
    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

const seedOnboardingFlows = async () => {
  try {
    const onboardingFlow = new OnboardingFlow({
      name: 'Standard Employee Onboarding',
      description: 'Comprehensive onboarding process for new employees',
      version: '1.0.0',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to the Team',
          description: 'Get started with your onboarding journey',
          type: 'welcome',
          content: {
            text: 'Welcome to our team! We\'re excited to have you on board. This onboarding process will help you get familiar with our company, culture, and your new role.'
          },
          order: 1,
          estimatedTime: 5,
          isOptional: false
        },
        {
          id: 'profile',
          title: 'Complete Your Profile',
          description: 'Set up your profile information',
          type: 'profile',
          content: {
            text: 'Let\'s set up your profile to help your colleagues get to know you better.',
            questions: [
              {
                id: 'bio',
                question: 'Tell us about yourself',
                type: 'text',
                required: false
              },
              {
                id: 'location',
                question: 'Where are you located?',
                type: 'text',
                required: false
              }
            ]
          },
          order: 2,
          estimatedTime: 10,
          isOptional: false
        },
        {
          id: 'preferences',
          title: 'Set Your Preferences',
          description: 'Configure your personal preferences',
          type: 'preferences',
          content: {
            text: 'Configure your preferences to personalize your experience.',
            questions: [
              {
                id: 'language',
                question: 'Preferred language',
                type: 'multiple-choice',
                options: ['English', 'Spanish', 'French', 'German'],
                required: true
              },
              {
                id: 'timezone',
                question: 'Your timezone',
                type: 'multiple-choice',
                options: ['UTC', 'EST', 'PST', 'GMT'],
                required: true
              }
            ]
          },
          order: 3,
          estimatedTime: 5,
          isOptional: false
        },
        {
          id: 'training',
          title: 'Company Training',
          description: 'Learn about company policies and procedures',
          type: 'training',
          content: {
            text: 'Complete the required training modules to understand our company culture and policies.',
            resources: [
              {
                title: 'Company Handbook',
                url: '/resources/handbook.pdf',
                type: 'pdf'
              },
              {
                title: 'Code of Conduct',
                url: '/resources/code-of-conduct.pdf',
                type: 'pdf'
              }
            ]
          },
          order: 4,
          estimatedTime: 30,
          isOptional: false
        },
        {
          id: 'completion',
          title: 'Onboarding Complete',
          description: 'Congratulations on completing onboarding',
          type: 'completion',
          content: {
            text: 'Congratulations! You have successfully completed the onboarding process. You\'re now ready to start your journey with us!'
          },
          order: 5,
          estimatedTime: 2,
          isOptional: false
        }
      ],
      settings: {
        allowSkip: true,
        maxAttempts: 3,
        timeLimit: 120,
        completionReward: 'Welcome package',
        welcomeMessage: 'Welcome to our team! Let\'s get you started.',
        completionMessage: 'Congratulations! You\'ve completed onboarding.'
      },
      targetAudience: {
        roles: ['user'],
        departments: ['Engineering', 'Marketing', 'Sales', 'HR'],
        experienceLevel: 'all'
      },
      isActive: true
    });

    await onboardingFlow.save();
    console.log('Onboarding flows seeded successfully');
  } catch (error) {
    console.error('Error seeding onboarding flows:', error);
  }
};

const seedData = async () => {
  await connectDB();
  
  // Clear existing data
  await User.deleteMany({});
  await OnboardingFlow.deleteMany({});
  
  // Seed new data
  await seedUsers();
  await seedOnboardingFlows();
  await seedLoanFlow();
  
  console.log('Database seeded successfully!');
  process.exit(0);
};

seedData();


