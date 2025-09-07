'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface OnboardingFlow {
  flowId: string;
  flowName: string;
  flowDescription: string;
  welcomeMessage: string;
}

export default function OnboardingFlowsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }

    fetchFlows();
  }, [user, token, router]);

  const fetchFlows = async () => {
    try {
      const response = await fetch('/api/onboarding-flows/flows', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flows');
      }

      const data = await response.json();
      setFlows(data.flows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flows');
    } finally {
      setLoading(false);
    }
  };

  const startFlow = async (flowId: string) => {
    try {
      const response = await fetch(`/api/onboarding-flows/start/${flowId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: `session_${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start flow');
      }

      const data = await response.json();
      
      // Navigate to chat with the session ID
      router.push(`/chat/${data.progress.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start flow');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading onboarding flows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchFlows}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Onboarding Flows
          </h1>
          <p className="text-gray-600">
            Choose an onboarding flow to get started
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {flows.map((flow) => (
            <div key={flow.flowId} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {flow.flowName}
              </h2>
              <p className="text-gray-600 mb-4">
                {flow.flowDescription}
              </p>
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-sm text-gray-700 italic">
                  "{flow.welcomeMessage}"
                </p>
              </div>
              <button
                onClick={() => startFlow(flow.flowId)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Start {flow.flowName}
              </button>
            </div>
          ))}
        </div>

        {flows.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No onboarding flows available
            </div>
            <p className="text-gray-400">
              Contact your administrator to set up onboarding flows
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
