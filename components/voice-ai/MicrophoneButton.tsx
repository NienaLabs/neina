'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRTCClient, IMicrophoneAudioTrack } from 'agora-rtc-react';
import { Mic, MicOff } from 'lucide-react';

// Interface for audio bar data
interface AudioBar {
  height: number;
}

interface MicrophoneButtonProps {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  localMicrophoneTrack: IMicrophoneAudioTrack | null;
}

export function MicrophoneButton({
  isEnabled,
  setIsEnabled,
  localMicrophoneTrack,
}: MicrophoneButtonProps) {
  // State to store audio visualization data
  const [audioData, setAudioData] = useState<AudioBar[]>(
    Array(5).fill({ height: 0 })
  );

  // Get the Agora client from context
  const client = useRTCClient();

  // References for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Set up and clean up audio analyzer based on microphone state
  useEffect(() => {
    if (localMicrophoneTrack && isEnabled) {
      setupAudioAnalyser();
    } else {
      cleanupAudioAnalyser();
    }

    return () => cleanupAudioAnalyser();
  }, [localMicrophoneTrack, isEnabled]);

  // Initialize the audio analyzer
  const setupAudioAnalyser = async () => {
    if (!localMicrophoneTrack) return;

    try {
      // Create audio context and analyzer
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64; // Small FFT size for better performance
      analyserRef.current.smoothingTimeConstant = 0.5; // Add smoothing

      // Get the microphone stream from Agora
      const mediaStream = localMicrophoneTrack.getMediaStreamTrack();
      const source = audioContextRef.current.createMediaStreamSource(
        new MediaStream([mediaStream])
      );

      // Connect the source to the analyzer
      source.connect(analyserRef.current);

      // Start updating the visualization
      updateAudioData();
    } catch (error) {
      console.error('Error setting up audio analyser:', error);
    }
  };

  // Clean up audio resources
  const cleanupAudioAnalyser = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioData(Array(5).fill({ height: 0 }));
  };

  // Update the audio visualization data
  const updateAudioData = () => {
    if (!analyserRef.current) return;

    // Get frequency data from analyzer
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Split the frequency data into 5 segments
    const segmentSize = Math.floor(dataArray.length / 5);
    const newAudioData = Array(5)
      .fill(0)
      .map((_, index) => {
        // Get average value for this frequency segment
        const start = index * segmentSize;
        const end = start + segmentSize;
        const segment = dataArray.slice(start, end);
        const average = segment.reduce((a, b) => a + b, 0) / segment.length;

        // Scale and shape the response curve for better visualization
        const scaledHeight = Math.min(60, (average / 255) * 100 * 1.2);
        const height = Math.pow(scaledHeight / 60, 0.7) * 60;

        return {
          height: height,
        };
      });

    // Update state with new data
    setAudioData(newAudioData);

    // Schedule the next update
    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  };

  // Toggle microphone state
  const toggleMicrophone = async () => {
    if (localMicrophoneTrack) {
      const newState = !isEnabled;
      try {
        // Enable/disable the microphone track
        await localMicrophoneTrack.setEnabled(newState);

        // Handle publishing/unpublishing
        if (!newState) {
          await client.unpublish(localMicrophoneTrack);
        } else {
          await client.publish(localMicrophoneTrack);
        }

        // Update state
        setIsEnabled(newState);
        console.log('Microphone state updated successfully');
      } catch (error) {
        console.error('Failed to toggle microphone:', error);
        // Revert to previous state on error
        localMicrophoneTrack.setEnabled(isEnabled);
      }
    }
  };

  return (
    <button
      onClick={toggleMicrophone}
      className={`relative w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-colors ${
        isEnabled ? 'bg-white hover:bg-gray-50' : 'bg-red-500 hover:bg-red-600'
      }`}
    >
      {/* Audio visualization bars */}
      <div className="absolute inset-0 flex items-center justify-center gap-1">
        {audioData.map((bar, index) => (
          <div
            key={index}
            className="w-1 rounded-full transition-all duration-100"
            style={{
              height: `${bar.height}%`,
              backgroundColor: isEnabled ? '#22c55e' : '#94a3b8',
              transform: `scaleY(${Math.max(0.1, bar.height / 100)})`,
              transformOrigin: 'center',
            }}
          />
        ))}
      </div>

      {/* Microphone icon overlaid on top */}
      <div className={`relative z-10`}>
        {isEnabled ? (
          <Mic size={24} className="text-gray-800" />
        ) : (
          <MicOff size={24} className="text-white" />
        )}
      </div>
    </button>
  );
}