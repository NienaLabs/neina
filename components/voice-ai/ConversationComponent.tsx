'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useIsConnected,
  useJoin,
  usePublish,
  RemoteUser,
  UID,
} from 'agora-rtc-react';
import { toast } from 'sonner';
import { MicrophoneButton } from './MicrophoneButton'; // microphone button component
import { AudioVisualizer } from './AudioVisualizer';


export default function ConversationComponent({
  agoraLocalUserInfo,
  onTokenWillExpire,
  onEndConversation,
}: ConversationComponentProps) {
  // Access the client from the provider context
   const [joinedUID, setJoinedUID] = useState<UID>(0); // New: After joining the channel we'll store the uid for renewing the token
   const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const agentUID = process.env.NEXT_PUBLIC_AGENT_UID;

   const client = useRTCClient();

  // Track connection status
  const isConnected = useIsConnected();

  // Manage microphone state
  const [isEnabled, setIsEnabled] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isEnabled);

  // Track remote users (like our AI agent)
  const remoteUsers = useRemoteUsers();

  // Join the channel when component mounts
   // Update the useJoin hook to use the token and channel name from the props
  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraLocalUserInfo.channel, // Using the channel name received from the token response
      token: agoraLocalUserInfo.token, // Using the token we received
      uid: parseInt(agoraLocalUserInfo.uid), // Using uid 0 to join the channel, so Agora's system will create and return a uid for us
    },
    true
  );
   useEffect(() => {
    if (joinSuccess && client) {
      const uid = client.uid;
      setJoinedUID(uid as UID);
      console.log('Join successful, using UID:', uid);
    }
  }, [joinSuccess, client]);


  // Publish our microphone track to the channel
  usePublish([localMicrophoneTrack]);

  // Set up event handlers for client events
 useClientEvent(client, 'user-joined', (user) => {
    console.log('Remote user joined:', user.uid);
    if (user.uid.toString() === agentUID) {
      setIsAgentConnected(true);
      setIsConnecting(false);
    }
  });
   useClientEvent(client, 'user-left', (user) => {
    console.log('Remote user left:', user.uid);
    if (user.uid.toString() === agentUID) {
      setIsAgentConnected(false);
      setIsConnecting(false);
    }
  });

  // Debug: Monitor when a user publishes an audio track
  useClientEvent(client, 'user-published', async (user, mediaType) => {
    console.log('User published:', user.uid, 'Media Type:', mediaType);
    if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack;
        console.log('Remote audio track found:', remoteAudioTrack);
        // Ensure we subscribe (Agora React SDK usually handles this via RemoteUser, but good to verify)
        if (!remoteAudioTrack) {
            console.warn("User published audio but track is missing in object:", user);
        }
    }
  });
  // Toggle microphone on/off
  const toggleMicrophone = async () => {
    if (localMicrophoneTrack) {
      await localMicrophoneTrack.setEnabled(!isEnabled);
      setIsEnabled(!isEnabled);
    }
  };
  // New: Add listener for connection state changes
  useClientEvent(client, 'connection-state-change', (curState, prevState) => {
    console.log(`Connection state changed from ${prevState} to ${curState}`);
  });

  // Add token renewal handler to avoid disconnections
  const handleTokenWillExpire = useCallback(async () => {
    if (!onTokenWillExpire || !joinedUID) return;
    try {
      // Request a new token from our API
      const newToken = await onTokenWillExpire(joinedUID.toString());
      await client?.renewToken(newToken);
      console.log('Successfully renewed Agora token');
    } catch (error) {
      console.error('Failed to renew Agora token:', error);
    }
  }, [client, onTokenWillExpire, joinedUID]);

  // New: Add listener for token privilege will expire event
  useClientEvent(client, 'token-privilege-will-expire', handleTokenWillExpire);

  useEffect(() => {
    const isAgentInRemoteUsers = remoteUsers.some(
      (user) => user.uid.toString() === agentUID
    );
    setIsAgentConnected(isAgentInRemoteUsers);
  }, [remoteUsers, agentUID]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      client?.leave(); // Leave the channel when the component unmounts
    };
  }, [client]);
   const handleStopConversation = async () => {
    if (!isAgentConnected || !agoraLocalUserInfo.agentId) return;
    setIsConnecting(true);

    try {
      const stopRequest: StopConversationRequest = {
        agent_id: agoraLocalUserInfo.agentId,
      };

      const response = await fetch('/api/stop-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stopRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to stop conversation: ${response.statusText}`);
      }

      // Wait for the agent to actually leave before resetting state
      // The user-left event handler will handle setting isAgentConnected to false
    } catch (error) {
      if (error instanceof Error) {
        console.warn('Error stopping conversation:', error.message);
      }
      setIsConnecting(false);
    }
  };

  // Function to start conversation with the AI agent
  const handleStartConversation = async () => {
    if (!joinedUID) return;
    setIsConnecting(true);

    try {
      const startRequest: ClientStartRequest = {
        requester_id: joinedUID.toString(),
        channel_name: agoraLocalUserInfo.channel,
        input_modalities: ['text'],
        output_modalities: ['text', 'audio'],
      };

      const response = await fetch('/api/invite-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(startRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || `Failed to start conversation: ${response.statusText}`;
        toast.error(message);
        throw new Error(message);
      }

      // Update agent ID when new agent is connected
      const data = await response.json();
      if (data.agent_id) {
        agoraLocalUserInfo.agentId = data.agent_id;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn('Error starting conversation:', error.message);
      }
      // Reset connecting state if there's an error
      setIsConnecting(false);
    }
  };


  return (
    <div className="flex flex-col gap-6 p-4 h-full relative">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isAgentConnected ? (
          <button
            onClick={handleStopConversation}
            disabled={isConnecting}
            className="px-4 py-2 bg-red-500/80 text-white rounded-full border border-red-400/30 backdrop-blur-sm 
            hover:bg-red-600/90 transition-all shadow-lg 
            disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isConnecting ? 'Disconnecting...' : 'Stop Agent'}
          </button>
        ) : (
          <button
            onClick={handleStartConversation}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-500/80 text-white rounded-full border border-blue-400/30 backdrop-blur-sm 
            hover:bg-blue-600/90 transition-all shadow-lg 
            disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isConnecting ? 'Connecting...' : 'Connect Agent'}
          </button>
        )}
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          onClick={onEndConversation}
          role="button"
          title="End conversation"
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* Remote Users Section with Audio Visualizer */}
    <div className="flex-1">
      {remoteUsers.map((user) => (
        <div key={user.uid} className="mb-8 p-4 bg-gray-800/30 rounded-lg">
          <p className="text-center text-sm text-gray-400 mb-2">
            {user.uid.toString() === agentUID
              ? 'AI Agent'
              : `User: ${user.uid}`}
          </p>

          {/* The AudioVisualizer receives the remote user's audio track */}
          <AudioVisualizer track={user.audioTrack} />

          {/* The RemoteUser component handles playing the audio */}
          <RemoteUser user={user} />
        </div>
      ))}

      {remoteUsers.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {isConnected
            ? 'Waiting for AI agent to join...'
            : 'Connecting to channel...'}
        </div>
      )}
    </div>

    {/* Microphone Control */}
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
       {/* Debug: Local Mic Level */}
      {isEnabled && localMicrophoneTrack && (
        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm">
            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Mic Input</span>
             <AudioVisualizer track={localMicrophoneTrack} />
        </div>
      )}

      <MicrophoneButton
        isEnabled={isEnabled}
        setIsEnabled={setIsEnabled}
        localMicrophoneTrack={localMicrophoneTrack}
      />
    </div>
  </div>
  );
}
