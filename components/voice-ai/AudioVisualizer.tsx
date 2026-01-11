'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ILocalAudioTrack, IRemoteAudioTrack } from 'agora-rtc-react';

interface AudioVisualizerProps {
  track: ILocalAudioTrack | IRemoteAudioTrack | undefined;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ track }) => {
  const [isVisualizing, setIsVisualizing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  const animate = () => {
    if (!analyserRef.current) {
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Define frequency ranges for different bars to create a more appealing visualization
    const frequencyRanges = [
      [24, 31], // Highest (bar 0, 8)
      [16, 23], // Mid-high (bar 1, 7)
      [8, 15], // Mid (bar 2, 6)
      [4, 7], // Low-mid (bar 3, 5)
      [0, 3], // Lowest (bar 4 - center)
    ];

    barsRef.current.forEach((bar, index) => {
      if (!bar) {
        return;
      }

      // Use symmetrical ranges for the 9 bars
      const rangeIndex = index < 5 ? index : 8 - index;
      const [start, end] = frequencyRanges[rangeIndex];

      // Calculate average energy in this frequency range
      let sum = 0;
      for (let i = start; i <= end; i++) {
        sum += dataArray[i];
      }
      let average = sum / (end - start + 1);

      // Apply different multipliers to create a more appealing shape
      const multipliers = [0.7, 0.8, 0.85, 0.9, 0.95];
      const multiplierIndex = index < 5 ? index : 8 - index;
      average *= multipliers[multiplierIndex];

      // Scale and limit the height
      const height = Math.min((average / 255) * 100, 100);
      bar.style.height = `${height}px`;
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!track) {
      return;
    }

    const startVisualizer = async () => {
      try {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 64; // Keep this small for performance

        // Get the audio track from Agora
        const mediaStreamTrack = track.getMediaStreamTrack();
        const stream = new MediaStream([mediaStreamTrack]);

        // Connect it to our analyzer
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        setIsVisualizing(true);
        animate();
      } catch (error) {
        console.error('Error starting visualizer:', error);
      }
    };

    startVisualizer();

    // Clean up when component unmounts or track changes
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [track]);

  return (
    <div className="w-full h-40 rounded-lg overflow-hidden flex items-center justify-center relative">
      <div className="flex items-center space-x-2 h-[100px] relative z-10">
        {/* Create 9 bars for the visualizer */}
        {[...Array(9)].map((_, index) => (
          <div
            key={index}
            ref={(el) => {
              barsRef.current[index] = el;
            }}
            className="w-3 bg-linear-to-t from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-75"
            style={{
              height: '2px',
              minHeight: '2px',
              background: 'linear-gradient(to top, #3b82f6, #8b5cf6, #ec4899)',
            }}
          />
        ))}
      </div>
    </div>
  );
};