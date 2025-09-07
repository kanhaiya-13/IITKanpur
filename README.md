# Conversational Agent Framework for Onboarding

A comprehensive AI-powered onboarding system that provides personalized, interactive guidance for new users through conversational interfaces.

## 🚀 Features

- **Conversational AI**: Natural language processing with intent recognition and sentiment analysis
- **Real-time Chat**: WebSocket-based real-time messaging with typing indicators
- **Onboarding Flows**: Customizable step-by-step onboarding processes
- **User Management**: Complete authentication and profile management
- **Analytics**: Conversation tracking and user engagement metrics
- **Modern UI**: Responsive design with Tailwind CSS and Framer Motion animations
- **Real-time Updates**: Live status indicators and instant message delivery

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Natural** for NLP processing
- **Winston** for logging

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.IO Client** for real-time features
- **React Hook Form** for form management
- **Zustand** for state management

## 📁 Project Structure

```
conversational-agent-onboarding/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Conversation.js
│   │   └── OnboardingFlow.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── conversations.js
│   │   ├── users.js
│   │   └── onboarding.js
│   ├── services/
│   │   └── aiService.js
│   ├── socket/
│   │   └── socketHandlers.js
│   ├── utils/
│   │   └── logger.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── chat/
│   │   │   └── [sessionId]/
│   │   ├── dashboard/
│   │   ├── onboarding/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── SocketContext.tsx
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd conversational-agent-onboarding
   ```

2. **Run the setup script**
   ```bash
   # Windows
   setup.bat
   
   # Linux/Mac
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Start MongoDB**
   ```bash
   mongod
   ```

4. **Start the application**
   ```bash
   # Windows
   start.bat
   
   # Linux/Mac
   chmod +x start.sh
   ./start.sh
   
   # Or manually:
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Conversation Endpoints

- `GET /api/conversations` - Get user's conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:sessionId` - Get specific conversation
- `POST /api/conversations/:sessionId/messages` - Send message
- `GET /api/conversations/:sessionId/messages` - Get conversation messages

### Onboarding Endpoints

- `GET /api/onboarding/flows` - Get available onboarding flows
- `GET /api/onboarding/progress` - Get user's onboarding progress
- `POST /api/onboarding/start` - Start onboarding process
- `POST /api/onboarding/complete-step` - Complete onboarding step
- `POST /api/onboarding/complete` - Complete entire onboarding

### User Management Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (Admin)
- `PUT /api/users/:id/status` - Update user status (Admin)

## 🔧 Configuration

### Backend Configuration

The backend can be configured through environment variables:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS

### Frontend Configuration

Frontend configuration is in `next.config.js`:

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SOCKET_URL`: WebSocket server URL

## 🎯 Usage

### For Users

1. **Register/Login**: Create an account or sign in
2. **Onboarding**: Complete the guided onboarding process
3. **Chat**: Start conversations with the AI assistant
4. **Profile**: Update your profile and preferences

### For Administrators

1. **User Management**: View and manage user accounts
2. **Onboarding Flows**: Create and customize onboarding processes
3. **Analytics**: Monitor user engagement and completion rates
4. **Conversation Monitoring**: Review conversation logs and feedback

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization
- Helmet.js security headers

## 📊 Analytics & Monitoring

The system includes comprehensive analytics:

- User onboarding completion rates
- Conversation engagement metrics
- Message sentiment analysis
- Response time tracking
- User satisfaction feedback

## 🚀 Deployment

### Production Build

1. **Build Frontend**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Multi-language support
- Advanced AI models integration
- Mobile app development
- Advanced analytics dashboard
- Integration with external HR systems
- Voice-based interactions
- Video onboarding sessions

---

**Developed by IIT Kanpur** 🎓
