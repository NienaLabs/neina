'use client';

import React, { useEffect, useCallback, useState } from "react";
import {
  DailyAudioTrack,
  DailyVideo,
  useDevices,
  useLocalSessionId,
  useMeetingState,
  useScreenVideoTrack,
  useVideoTrack
} from "@daily-co/daily-react";
import { MicSelectBtn, CameraSelectBtn, ScreenShareButton } from '../device-select';
import { useLocalScreenshare } from "../../hooks/use-local-screenshare";
import { useReplicaIDs } from "../../hooks/use-replica-ids";
import { useCVICall } from "../../hooks/use-cvi-call";
import { AudioWave } from "../audio-wave";

import styles from "./conversation.module.css";

interface ConversationProps {
  onLeave: () => Promise<void>;
  meetingUrl: string;
}

const VideoPreview = React.memo(({ id }: { id: string }) => {
  const videoState = useVideoTrack(id);
  const widthVideo = videoState.track?.getSettings()?.width;
  const heightVideo = videoState.track?.getSettings()?.height;
  const isVertical = widthVideo && heightVideo ? widthVideo < heightVideo : false;

  return (
    <div
      className={`${styles.previewVideoContainer} ${isVertical ? styles.previewVideoContainerVertical : ''} ${videoState.isOff ? styles.previewVideoContainerHidden : ''}`}
    >
      <DailyVideo
        automirror
        sessionId={id}
        type="video"
        className={`${styles.previewVideo} ${isVertical ? styles.previewVideoVertical : ''} ${videoState.isOff ? styles.previewVideoHidden : ''}`}
      />
      <div className={styles.audioWaveContainer}>
        <AudioWave id={id} />
      </div>
    </div>
  );
});

const PreviewVideos = React.memo(() => {
  const localId = useLocalSessionId();
  return <VideoPreview id={localId} />;
});

const MainVideo = React.memo(({ onLeave }: { onLeave: () => void }) => {
  const replicaIds = useReplicaIDs();
  const localId = useLocalSessionId();
  const videoState = useVideoTrack(replicaIds[0]);
  const screenVideoState = useScreenVideoTrack(localId);
  const isScreenSharing = !screenVideoState.isOff;
  const replicaId = replicaIds[0];
  const [showTimeout, setShowTimeout] = useState(false);

  // Show timeout message after 10 seconds if replica hasn't joined
  useEffect(() => {
    if (replicaId) {
      setShowTimeout(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!replicaId) {
        setShowTimeout(true);
      }
    }, 30000); // Increased to 30s to allow for cold starts


    return () => clearTimeout(timer);
  }, [replicaId]);

  const handleLeave = useCallback(() => {
    onLeave();
  }, [onLeave]);

  if (!replicaId) {
    return (
      <div className={styles.waitingContainer}>
        <p>{showTimeout ? "AI Interviewer is taking a moment to join..." : "Connecting..."}</p>

        {showTimeout && (
          <button
            onClick={handleLeave}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
          >
            Retrying...

          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.mainVideoContainer} ${isScreenSharing ? styles.mainVideoContainerScreenSharing : ''}`}>
      <DailyVideo
        automirror
        sessionId={isScreenSharing ? localId : replicaId}
        type={isScreenSharing ? "screenVideo" : "video"}
        className={`${styles.mainVideo} ${isScreenSharing ? styles.mainVideoScreenSharing : ''} ${videoState.isOff ? styles.mainVideoHidden : ''}`}
      />
      <DailyAudioTrack sessionId={replicaId} />
    </div>
  );
});

export const Conversation = React.memo(({ onLeave, meetingUrl }: ConversationProps) => {
  const { joinCall, leaveCall } = useCVICall();
  const meetingState = useMeetingState();
  const { hasMicError } = useDevices();
  const replicaIds = useReplicaIDs();
  const localId = useLocalSessionId();

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Meeting state:', meetingState);
      console.log('Replica IDs:', replicaIds);
      console.log('Local ID:', localId);
      console.log('Has mic error:', hasMicError);
    }
  }, [meetingState, replicaIds, localId, hasMicError]);

  // ------------------------------
  // Join Call Effect
  // ------------------------------
  useEffect(() => {
    if (meetingUrl) {
      joinCall({ url: meetingUrl });
    }

    return () => {
      leaveCall();
    };
  }, [joinCall, meetingUrl, leaveCall]);

  // ------------------------------
  // Handle Leave
  // ------------------------------
  const handleLeave = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Ending interview - calling backend API first...');
      }

      // First leave the Daily call to stop the media streams
      leaveCall();

      // Then call the onLeave handler to clean up the backend
      try {
        await onLeave();
      } catch (error) {
        console.error('Error in onLeave handler (non-fatal):', error);
        // Continue even if onLeave fails
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Call cleanup completed');
      }
    } catch (error) {
      console.error('Error during leave process:', error);
      // Ensure we always leave the call even if there's an error
      leaveCall();
    }
  }, [leaveCall, onLeave]);

  // ------------------------------
  // Error Handling
  // ------------------------------
  useEffect(() => {
    // Meeting state changes are handled by the UI, no need to log errors
    // The 'left-meeting' state is expected when user ends the call
  }, [meetingState]);

  return (
    <div className={styles.container}>
      <div className={styles.videoContainer}>
        {/* Debug info - remove later */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000
          }}>
            <div>State: {meetingState || 'none'}</div>
            <div>Replicas: {replicaIds?.length || 0}</div>
            <div>Local: {localId ? 'yes' : 'no'}</div>
          </div>
        )}

        {/* Show meeting error if present - but NOT just because we left */}
        {(meetingState === 'error') && (
          <div className={styles.errorContainer}>
            <p>Meeting has ended. The interview link may have expired.</p>
            <button
              onClick={handleLeave}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
            >
              Get New Link
            </button>
          </div>
        )}

        {hasMicError && (
          <div className={styles.errorContainer}>
            <p>Camera or microphone access denied. Please check your settings and try again.</p>
          </div>
        )}

        {/* Main video = Interviewer */}
        <MainVideo onLeave={handleLeave} />

        {/* Self view = User */}
        <div className={styles.selfViewContainer}>
          <PreviewVideos />
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerControls}>
          <MicSelectBtn />
          <CameraSelectBtn />
          <ScreenShareButton />
          <button type="button" className={styles.leaveButton} onClick={handleLeave}>
            <span className={styles.leaveButtonIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});
