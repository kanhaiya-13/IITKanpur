'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UserIcon,
  CogIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface OnboardingStep {
  id: string
  title: string
  description: string
  type: string
  content: {
    text?: string
    questions?: Array<{
      id: string
      question: string
      type: string
      options?: string[]
      required: boolean
    }>
  }
  order: number
}

export default function OnboardingPage() {
  const { user, updateProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stepData, setStepData] = useState<Record<string, any>>({})
  const [onboardingFlow, setOnboardingFlow] = useState<OnboardingStep[]>([])

  useEffect(() => {
    if (user) {
      fetchOnboardingFlow()
    }
  }, [user])

  const fetchOnboardingFlow = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/flows`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.flows.length > 0) {
          setOnboardingFlow(data.flows[0].steps)
          setCurrentStep(user?.onboarding?.currentStep || 0)
        }
      }
    } catch (error) {
      console.error('Failed to fetch onboarding flow:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStepComplete = async (stepId: string, data: any) => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/complete-step`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stepId, data }),
      })

      if (response.ok) {
        setStepData(prev => ({ ...prev, [stepId]: data }))
        setCurrentStep(prev => prev + 1)
        toast.success('Step completed successfully!')
      } else {
        throw new Error('Failed to complete step')
      }
    } catch (error) {
      toast.error('Failed to complete step')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Onboarding completed successfully!')
        window.location.href = '/dashboard'
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      toast.error('Failed to complete onboarding')
    } finally {
      setSubmitting(false)
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <SparklesIcon className="h-8 w-8" />
      case 'profile':
        return <UserIcon className="h-8 w-8" />
      case 'preferences':
        return <CogIcon className="h-8 w-8" />
      case 'training':
        return <AcademicCapIcon className="h-8 w-8" />
      case 'quiz':
        return <ClipboardDocumentCheckIcon className="h-8 w-8" />
      case 'completion':
        return <CheckCircleIcon className="h-8 w-8" />
      default:
        return <CheckCircleIcon className="h-8 w-8" />
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

  if (!user || user.onboarding.isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Complete!</h1>
          <p className="text-gray-600 mb-4">You have successfully completed the onboarding process.</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const currentStepData = onboardingFlow[currentStep]
  const progress = ((currentStep + 1) / onboardingFlow.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gradient">
                Onboarding
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Step {currentStep + 1} of {onboardingFlow.length}
              </span>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Skip for now
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {onboardingFlow.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < onboardingFlow.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < onboardingFlow.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mx-auto mb-4">
                <div className="text-primary-600">
                  {getStepIcon(currentStepData?.type)}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentStepData?.title}
              </h1>
              <p className="text-gray-600">
                {currentStepData?.description}
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {currentStepData?.type === 'welcome' && (
                <div className="text-center">
                  <p className="text-lg text-gray-700 mb-6">
                    Welcome to our team! We're excited to have you on board. 
                    This onboarding process will help you get familiar with our company, 
                    culture, and your new role.
                  </p>
                  <button
                    onClick={() => handleStepComplete(currentStepData.id, {})}
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Starting...' : 'Get Started'}
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </button>
                </div>
              )}

              {currentStepData?.type === 'profile' && (
                <div className="space-y-6">
                  <p className="text-gray-700">
                    Let's set up your profile to help your colleagues get to know you better.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        className="input-field h-24"
                        placeholder="Tell us about yourself..."
                        value={stepData[currentStepData.id]?.bio || ''}
                        onChange={(e) => setStepData(prev => ({
                          ...prev,
                          [currentStepData.id]: { ...prev[currentStepData.id], bio: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Your location"
                        value={stepData[currentStepData.id]?.location || ''}
                        onChange={(e) => setStepData(prev => ({
                          ...prev,
                          [currentStepData.id]: { ...prev[currentStepData.id], location: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleStepComplete(currentStepData.id, stepData[currentStepData.id])}
                      disabled={submitting}
                      className="btn-primary"
                    >
                      {submitting ? 'Saving...' : 'Continue'}
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {currentStepData?.type === 'preferences' && (
                <div className="space-y-6">
                  <p className="text-gray-700">
                    Configure your preferences to personalize your experience.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        className="input-field"
                        value={stepData[currentStepData.id]?.language || 'en'}
                        onChange={(e) => setStepData(prev => ({
                          ...prev,
                          [currentStepData.id]: { ...prev[currentStepData.id], language: e.target.value }
                        }))}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        className="input-field"
                        value={stepData[currentStepData.id]?.timezone || 'UTC'}
                        onChange={(e) => setStepData(prev => ({
                          ...prev,
                          [currentStepData.id]: { ...prev[currentStepData.id], timezone: e.target.value }
                        }))}
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="GMT">Greenwich Mean Time</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleStepComplete(currentStepData.id, stepData[currentStepData.id])}
                      disabled={submitting}
                      className="btn-primary"
                    >
                      {submitting ? 'Saving...' : 'Continue'}
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {currentStepData?.type === 'completion' && (
                <div className="text-center">
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Congratulations!
                  </h2>
                  <p className="text-gray-700 mb-6">
                    You have successfully completed the onboarding process. 
                    You're now ready to start your journey with us!
                  </p>
                  <button
                    onClick={handleCompleteOnboarding}
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Completing...' : 'Complete Onboarding'}
                    <CheckCircleIcon className="h-5 w-5 ml-2" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep > 0 && currentStepData?.type !== 'completion' && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Previous
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


