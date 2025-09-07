'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useSocket } from '../../../contexts/SocketContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  UserCircleIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: string
  metadata?: {
    intent?: string
    confidence?: number
    entities?: Array<{
      type: string
      value: string
      confidence: number
    }>
    sentiment?: {
      score: number
      label: string
    }
    processingTime?: number
  }
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { 
    socket, 
    connected, 
    messages, 
    sendMessage, 
    joinConversation, 
    leaveConversation,
    typingUsers 
  } = useSocket()
  
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversation, setConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionId = params.sessionId as string

  useEffect(() => {
    if (sessionId && connected) {
      joinConversation(sessionId)
      fetchConversation()
    }

    return () => {
      if (sessionId) {
        leaveConversation(sessionId)
      }
    }
  }, [sessionId, connected])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversation(data.conversation)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !connected) return

    const message = inputMessage.trim()
    setInputMessage('')
    setIsTyping(true)

    try {
      sendMessage(message, sessionId)
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
    
    if (socket && connected) {
      if (e.target.value.length > 0) {
        socket.emit('typing_start', { sessionId })
      } else {
        socket.emit('typing_stop', { sessionId })
      }
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              
              <div className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-primary-600" />
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {conversation?.title || 'Chat'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`flex-shrink-0 ${
                        message.role === 'user' ? 'ml-3' : 'mr-3'
                      }`}>
                        {message.role === 'user' ? (
                          <UserCircleIcon className="h-8 w-8 text-primary-600" />
                        ) : (
                          <SparklesIcon className="h-8 w-8 text-gray-600" />
                        )}
                      </div>
                      
                      <div className={`px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <SparklesIcon className="h-8 w-8 text-gray-600" />
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">
                          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                        </span>
                        <div className="loading-dots">
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-white p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={!connected}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || !connected}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
              
              {!connected && (
                <p className="text-sm text-red-600 mt-2">
                  Disconnected from server. Trying to reconnect...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


