'use client';

import { useState, useMemo,Suspense } from 'react';
import dynamic from 'next/dynamic';

// Agora requires access to the browser's WebRTC API,
// - which throws an error if it's loaded via SSR
// Create a component that has SSR disabled,
// - and use it to load the AgoraRTC components on the client side
const AgoraProvider = dynamic(
  async () => {
    // Dynamically import Agora's components
    const { AgoraRTCProvider, default: AgoraRTC } = await import(
      'agora-rtc-react'
    );
    return {
      default: ({ children }: { children: React.ReactNode }) => {
        // Create the Agora RTC client once using useMemo
        const client = useMemo(
          () => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }),
          []
        );
        
        // The provider makes the client available to all child components
        return <AgoraRTCProvider client={client}>{children}</AgoraRTCProvider>;
      },
    };
  },
  { ssr: false } // Important: disable SSR for this component
);

export default function LandingPage() {
  const ConversationComponent = dynamic(() => import('./ConversationComponent'), {
  ssr: false,
  });
// Manage conversation state
  const [showConversation, setShowConversation] = useState(false);
  // Manage loading state, while the agent token is generated
  const [isLoading, setIsLoading] = useState(false);
  // Manage error state
  const [error, setError] = useState<string | null>(null);
  // Store the token data for the conversation
  const [agoraLocalUserInfo, setAgoraLocalUserInfo] =
    useState<AgoraLocalUserInfo | null>(null);
  const [agentJoinError, setAgentJoinError] = useState(false); // add agent join error state

  const handleTokenWillExpire = async (uid: string) => {
    try {
      // Request a new token using the channel name and uid
      const response = await fetch(
        `/api/generate-agora-token?channel=${agoraLocalUserInfo?.channel}&uid=${uid}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to generate new token');
      }

      return data.token;
    } catch (error) {
      console.error('Error renewing token:', error);
      throw error;
    }
  };

  const handleStartConversation = async () => {
    setIsLoading(true);
    setError(null);
    setAgentJoinError(false);

    try {
      // Step 1: Get the Agora token (updated)
      console.log('Fetching Agora token...');
      const agoraResponse = await fetch('/api/generate-agora-token');
      const responseData = await agoraResponse.json();
      console.log('Agora API response:', responseData);

      if (!agoraResponse.ok) {
        throw new Error(
          `Failed to generate Agora token: ${JSON.stringify(responseData)}`
        );
      }

      // Step 2: Invite the AI agent to join the channel
      const startRequest: ClientStartRequest = {
        requester_id: responseData.uid,
        channel_name: responseData.channel,
        input_modalities: ['text'],
        output_modalities: ['text', 'audio'],
      };

      try {
        const response = await fetch('/api/invite-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(startRequest),
        });

        if (!response.ok) {
          setAgentJoinError(true);
        } else {
          const agentData: AgentResponse = await response.json();
          // Store agent ID along with token data
          setAgoraLocalUserInfo({
            ...responseData,
            agentId: agentData.agent_id,
          });
        }
      } catch (err) {
        console.error('Failed to start conversation with agent:', err);
        setAgentJoinError(true);
      }

      // Show the conversation UI even if agent join fails
      // The user can retry connecting the agent from within the conversation
      setShowConversation(true);
    } catch (err) {
      setError('Failed to start conversation. Please try again.');
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };



 return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Agora AI Conversation
        </h1>

        <p className="text-lg mb-6 text-center">
          When was the last time you had an intelligent conversation?
        </p>

        {!showConversation ? (
          <>
            <div className="flex justify-center mb-8">
              <button
                onClick={handleStartConversation}
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Starting...' : 'Start Conversation'}
              </button>
            </div>
            {error && <p className="text-center text-red-400 mt-4">{error}</p>}
          </>
        ) : agoraLocalUserInfo ? (
          <>
            {agentJoinError && (
              <div className="mb-4 p-3 bg-red-600/20 rounded-lg text-red-400 text-center">
                Failed to connect with AI agent. The conversation may not work
                as expected.
              </div>
            )}
            <Suspense
              fallback={
                <div className="text-center">Loading conversation...</div>
              }
            >
              <AgoraProvider>
                <ConversationComponent
                  agoraLocalUserInfo={agoraLocalUserInfo}
                  onTokenWillExpire={handleTokenWillExpire}
                  onEndConversation={() => setShowConversation(false)}
                />
              </AgoraProvider>
            </Suspense>
          </>
        ) : (
          <p className="text-center">Failed to load conversation data.</p>
        )}
      </div>
    </div>
  );
}
