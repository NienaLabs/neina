'use client';

import { useEffect, useRef } from 'react';
import { ILocalAudioTrack, IRemoteAudioTrack } from 'agora-rtc-react';

interface AudioVisualizerProps {
  track: ILocalAudioTrack | IRemoteAudioTrack | undefined;
  width?: number;
  height?: number;
  barColor?: string;
  gap?: number;
}

export const AudioVisualizer = ({
  track,
  width = 100, // Reduced width for better layout in cards
  height = 30, // Reduced height
  barColor = '#60a5fa',
  gap = 2,
}: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!track || !canvasRef.current) return;

    // Get the MediaStreamTrack from the Agora audio track
    const mediaStreamTrack = track.getMediaStreamTrack();
    
    if (!mediaStreamTrack) return;

    // Set up Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 64; // Reduced for fewer bars
    source.connect(analyser);
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !analyserRef.current) return;

      animationRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      // Draw minimal bars
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        ctx.fillStyle = barColor;
        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth, barHeight, 2);
        ctx.fill();

        x += barWidth + gap;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [track, width, height, barColor, gap]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      className="opacity-80"
    />
  );
};
