'use client';

import React, { useEffect, useCallback, useState } from "react";
import {
  DailyAudioTrack,
  DailyVideo,
  useDevices,
  useDaily,
  useLocalSessionId,
  useMeetingState,
  useNetwork,
  useScreenVideoTrack,
  useVideoTrack
} from "@daily-co/daily-react";
import { MicSelectBtn, CameraSelectBtn, ScreenShareButton } from '../device-select';
import { useLocalScreenshare } from "../../hooks/use-local-screenshare";
import { useReplicaIDs } from "../../hooks/use-replica-ids";
import { useCVICall } from "../../hooks/use-cvi-call";
import { AudioWave } from "../audio-wave";
import { InterviewTimer } from "@/components/interview-timer";

import styles from "./conversation.module.css";

interface ConversationProps {
  onLeave: () => Promise<void>;
  meetingUrl: string;
  role?: string;
  interviewId?: string;
  onTimeExpired?: () => void;
  onWarning?: (level: 'low' | 'critical') => void;
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

const NetworkIndicator = React.memo(() => {
  const network = useNetwork();
  const [quality, setQuality] = useState<'good' | 'low' | 'very-low'>('good');

  useEffect(() => {
    if (network?.threshold && network.threshold !== quality) {
      setQuality(network.threshold as any);
    }
  }, [network?.threshold, quality]);

  const getBarClass = useCallback((level: number) => {
    const isActive =
      (quality === 'good' && level <= 3) ||
      (quality === 'low' && level <= 2) ||
      (quality === 'very-low' && level <= 1);

    if (!isActive) return styles.networkBar;

    if (quality === 'good') return `${styles.networkBar} ${styles.networkBarActive}`;
    if (quality === 'low') return `${styles.networkBar} ${styles.networkBarWarning}`;
    return `${styles.networkBar} ${styles.networkBarCritical}`;
  }, [quality]);

  return (
    <div className={styles.networkIndicator}>
      <div className={styles.networkBars}>
        <div className={getBarClass(1)} style={{ height: '6px' }} />
        <div className={getBarClass(2)} style={{ height: '9px' }} />
        <div className={getBarClass(3)} style={{ height: '12px' }} />
      </div>
      <span className="ml-1 uppercase text-[10px] font-bold tracking-wider">Network</span>
    </div>
  );
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
        <div className={styles.waitingSpinner} />
        <p className="text-gray-400">{showTimeout ? "AI Interviewer is taking a moment to join..." : "Connecting to AI Interviewer..."}</p>

        {showTimeout && (
          <button
            onClick={handleLeave}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20 transition-all text-white text-sm"
          >
            Cancel and Retry
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

export const Conversation = React.memo(({ onLeave, meetingUrl, role, interviewId, onTimeExpired, onWarning }: ConversationProps) => {
  const { joinCall, leaveCall } = useCVICall();
  const dailyCall = useDaily();
  const meetingState = useMeetingState();
  const { hasMicError } = useDevices();
  const replicaIds = useReplicaIDs();
  const localId = useLocalSessionId();

  // Debug logging removed to prevent console spam and potential lag during network fluctuations

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
  // Time Expired Handler
  // ------------------------------
  const handleTimeExpiredInternal = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Timeout detected in Conversation component, leaving call locally...');
    }
    leaveCall(); // End media streams immediately
    if (onTimeExpired) onTimeExpired(); // Notify parent to transition UI
  }, [leaveCall, onTimeExpired]);

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
        {/* Top left overlay: Role and Live Indicator */}
        <div className={styles.overlayTop}>
          {role && <div className={styles.roleBadge}>Interviewing for {role}</div>}
          <NetworkIndicator />
        </div>

        {/* Top right overlay: Timer */}
        <div className={styles.timerContainer}>
          {interviewId && (
            <InterviewTimer
              interviewId={interviewId}
              dailyCall={dailyCall}
              onTimeExpired={handleTimeExpiredInternal}
              onWarning={onWarning}
            />
          )}
        </div>

        {/* Debug info - only show in dev and if explicitly needed */}
        {process.env.NODE_ENV === 'development' && false && (
          <div style={{
            position: 'absolute',
            bottom: '100px',
            left: '1.5rem',
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

        {/* Self view = User (Always on top with higher z-index) */}
        <div className={styles.selfViewContainer}>
          <PreviewVideos />
        </div>

        {/* Main video = Interviewer */}
        <MainVideo onLeave={handleLeave} />
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
