'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

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

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  currentSessionId: string | null
  messages: Message[]
  sendMessage: (content: string, sessionId: string) => void
  joinConversation: (sessionId: string) => void
  leaveConversation: (sessionId: string) => void
  isTyping: boolean
  typingUsers: string[]
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      if (token) {
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
          auth: {
            token: token
          }
        })

        newSocket.on('connect', () => {
          console.log('Connected to server')
          setConnected(true)
          toast.success('Connected to chat server')
        })

        newSocket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason)
          setConnected(false)
          if (reason === 'io server disconnect') {
            toast.error('Disconnected from server')
          }
        })

        newSocket.on('connect_error', (error) => {
          console.error('Connection error:', error)
          toast.error('Failed to connect to chat server')
        })

        newSocket.on('joined_conversation', (data) => {
          console.log('Joined conversation:', data.sessionId)
          setCurrentSessionId(data.sessionId)
        })

        newSocket.on('left_conversation', (data) => {
          console.log('Left conversation:', data.sessionId)
          if (currentSessionId === data.sessionId) {
            setCurrentSessionId(null)
          }
        })

        newSocket.on('message_received', (data) => {
          console.log('Message received:', data)
          setMessages(prev => [...prev, data.message])
        })

        newSocket.on('user_typing', (data) => {
          setTypingUsers(prev => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName]
            }
            return prev
          })
        })

        newSocket.on('user_stopped_typing', (data) => {
          setTypingUsers(prev => prev.filter(user => user !== data.userName))
        })

        newSocket.on('system_message', (message) => {
          setMessages(prev => [...prev, message])
          toast(message.content, {
            icon: 'ℹ️',
            duration: 5000,
          })
        })

        newSocket.on('error', (error) => {
          console.error('Socket error:', error)
          toast.error(error.message || 'An error occurred')
        })

        setSocket(newSocket)

        return () => {
          newSocket.close()
        }
      }
    }
  }, [user])

  const sendMessage = (content: string, sessionId: string) => {
    if (socket && connected) {
      socket.emit('send_message', {
        sessionId,
        content,
        role: 'user'
      })
    }
  }

  const joinConversation = (sessionId: string) => {
    if (socket && connected) {
      socket.emit('join_conversation', { sessionId })
    }
  }

  const leaveConversation = (sessionId: string) => {
    if (socket && connected) {
      socket.emit('leave_conversation', { sessionId })
    }
  }

  const value = {
    socket,
    connected,
    currentSessionId,
    messages,
    sendMessage,
    joinConversation,
    leaveConversation,
    isTyping,
    typingUsers,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}


