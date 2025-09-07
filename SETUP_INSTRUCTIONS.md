# 🚀 Conversational Agent Framework - Setup Instructions

## ✅ **What's Been Built**

I've successfully created a **configurable conversational agent framework** that matches your exact requirements! Here's what's implemented:

### 🎯 **Core Features**
- **Configurable Onboarding Flows**: Create different question sets for different customer journeys
- **Step-by-Step Data Collection**: Guided process with validation
- **Checkpoint Confirmations**: Review collected data before proceeding
- **Natural Language Processing**: Voice/text interaction with entity extraction
- **Real-time Chat**: WebSocket-based communication
- **Document Upload Support**: Ready for file attachments

### 📋 **Loan Application Example**
The system includes a complete loan application flow exactly as specified:

**Step 1 - Personal Details:**
- Full Name, Date of Birth, Gender, Mobile, Email
- Checkpoint confirmation with all details

**Step 2 - Other Details:**
- Current Address, Address Type, Stay Duration
- Permanent Address, Monthly Income
- Bank Details (Name, Account Number, IFSC Code)
- Checkpoint confirmation with all details

**Step 3 - Completion:**
- Application submission confirmation

## 🛠 **Setup Instructions**

### 1. **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 2. **Environment Setup**

Create `backend/.env` file:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/conversational-agent

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. **Installation**

```bash
# Install all dependencies
npm run install:all

# Seed the database with sample data and loan flow
npm run seed
```

### 4. **Start the Application**

```bash
# Start both backend and frontend
npm run dev
```

### 5. **Access the Application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Login**: admin@example.com / admin123

## 🎮 **How to Test the Loan Application Flow**

1. **Login** to the application
2. **Go to Dashboard** → Click "Onboarding Flows"
3. **Select "Loan Application"** flow
4. **Start the flow** and follow the conversation:

```
Agent: Hello! I'm here to help you apply for your loan. I'll just ask you a few quick questions, and we'll be done in a few minutes. Ready to begin?

You: Yes, let's go.

Agent: Great! Can I have your full name as per your official documents?

You: Rohan Mehta.

Agent: And your date of birth?

You: 15th August 1992.

Agent: Gender?

You: Male.

Agent: Which mobile number should we use to contact you?

You: 9876543210.

Agent: And your email address?

You: rohan.mehta@gmail.com.

Agent: Just to confirm, here's what I have:
Name: Rohan Mehta
DOB: 15th August 1992
Gender: Male
Mobile: 9876543210
Email: rohan.mehta@gmail.com
Is that correct?

You: Yes, that's right.

Agent: What's your current residential address?

You: 24, Green Park, New Delhi – 110016.

Agent: Is this owned, rented, or provided by your employer?

You: Rented.

Agent: How long have you been staying here?

You: 3 years.

Agent: Do you have a different permanent address?

You: Yes, my permanent address is 56, Rajendra Nagar, Lucknow – 226004.

Agent: What's your monthly net income after deductions?

You: 85,000.

Agent: Which bank account should we use for loan disbursement?

You: HDFC Bank, Connaught Place branch.

Agent: Can you confirm the account number and IFSC code?

You: 123456789012, HDFC0001234.

Agent: Just to confirm, here's what I have:
Current Address: 24, Green Park, New Delhi – 110016 (Rented, 3 years)
Permanent Address: 56, Rajendra Nagar, Lucknow – 226004
Monthly net income: 85,000 ₹
Account No: 123456789012
Bank: HDFC Bank, Connaught Place branch.
IFSC Code: HDFC0001234
Shall I go ahead with these details?

You: Yes, please.

Agent: Perfect! Your loan application is now submitted. We'll review it and get back to you shortly with the next steps. Thank you for your time, Rohan!
```

## 🔧 **Technical Architecture**

### **Backend (Node.js + Express)**
- **Models**: User, Conversation, OnboardingFlowConfig, OnboardingProgress
- **Services**: AI Service with intent recognition, entity extraction, sentiment analysis
- **Routes**: Auth, Conversations, Onboarding Flows, Users
- **Real-time**: Socket.IO for live chat

### **Frontend (Next.js + React)**
- **Pages**: Dashboard, Chat, Onboarding Flows, Auth
- **Context**: Authentication, Socket connection
- **UI**: Tailwind CSS with responsive design

### **Database (MongoDB)**
- **Collections**: Users, Conversations, OnboardingFlowConfigs, OnboardingProgress
- **Indexes**: Optimized for performance

## 🎨 **Customization**

### **Creating New Flows**
You can create new onboarding flows by:

1. **Using the API**:
```javascript
POST /api/onboarding-flows/flows
{
  "flowId": "insurance_application",
  "flowName": "Insurance Application",
  "flowDescription": "Complete insurance application process",
  "welcomeMessage": "Welcome to our insurance application process!",
  "completionMessage": "Your insurance application has been submitted!",
  "steps": [
    {
      "stepId": "personal_info",
      "stepName": "Personal Information",
      "stepType": "data_collection",
      "fields": [
        {
          "fieldId": "name",
          "fieldName": "Full Name",
          "fieldType": "text",
          "prompt": "What's your full name?"
        }
      ]
    }
  ]
}
```

2. **Database Direct**: Add to `OnboardingFlowConfig` collection

### **Field Types Supported**
- `text`: Free text input
- `email`: Email validation
- `phone`: Phone number validation
- `date`: Date extraction
- `number`: Numeric input
- `select`: Multiple choice options
- `textarea`: Long text input
- `file`: Document upload

## 🚀 **Ready for Hackathon!**

The system is now **fully functional** and ready for your hackathon presentation! It demonstrates:

✅ **Configurable conversational agent framework**  
✅ **Natural language interaction**  
✅ **Step-by-step data collection**  
✅ **Checkpoint confirmations**  
✅ **Real-time chat interface**  
✅ **Loan application example**  
✅ **Extensible architecture**  

## 🆘 **Troubleshooting**

### **MongoDB Connection Issues**
- Ensure MongoDB is running: `mongod`
- Check connection string in `backend/.env`
- For cloud MongoDB, update `MONGODB_URI`

### **Port Conflicts**
- Backend runs on port 5000
- Frontend runs on port 3000
- Update ports in `.env` if needed

### **Dependencies Issues**
```bash
# Clean install
npm run clean
npm run install:all
```

## 📞 **Support**

The system is production-ready with:
- Error handling and logging
- Input validation
- Security middleware
- Rate limiting
- CORS configuration

**Happy coding! 🎉**
