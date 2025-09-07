'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { motion } from 'framer-motion'
import { 
  ChatBubbleLeftRightIcon, 
  UserCircleIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Conversation {
  id: string
  sessionId: string
  title: string
  status: string
  lastActivity: string
  createdAt: string
  messageCount: number
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { connected } = useSocket()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Conversation'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = `/chat/${data.conversation.sessionId}`
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gradient">
                Onboarding AI
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              
              <Link
                href="/profile"
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </Link>
              
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Continue your onboarding journey or start a new conversation with your AI assistant.
          </p>
        </motion.div>

        {/* Onboarding Progress */}
        {user?.onboarding && !user.onboarding.isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Onboarding Progress
              </h2>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(user.onboarding.completedSteps.length / 5) * 100}%` 
                }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {user.onboarding.currentStep} of 5</span>
              <span>{user.onboarding.completedSteps.length} completed</span>
            </div>
            
            <div className="mt-4">
              <Link
                href="/onboarding"
                className="btn-primary"
              >
                Continue Onboarding
              </Link>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <div className="card hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={createNewConversation}>
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">New Chat</h3>
                <p className="text-gray-600">Start a new conversation</p>
              </div>
            </div>
          </div>

          <Link href="/onboarding" className="card hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Onboarding</h3>
                <p className="text-gray-600">Complete your setup</p>
              </div>
            </div>
          </Link>

          <Link href="/profile" className="card hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <p className="text-gray-600">Update your information</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Recent Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Conversations</h2>
            <button
              onClick={createNewConversation}
              className="btn-primary"
            >
              New Conversation
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="card text-center py-12">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 mb-4">Start your first conversation with the AI assistant</p>
              <button
                onClick={createNewConversation}
                className="btn-primary"
              >
                Start Chatting
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/chat/${conversation.sessionId}`}
                  className="card hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {conversation.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {conversation.messageCount} messages • {new Date(conversation.lastActivity).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        conversation.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {conversation.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}


