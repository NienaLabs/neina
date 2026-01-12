'use client';

import { Mic, MicOff } from 'lucide-react';
import { ILocalAudioTrack } from 'agora-rtc-react';

interface MicrophoneButtonProps {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  localMicrophoneTrack: ILocalAudioTrack | null;
}

export const MicrophoneButton = ({
  isEnabled,
  setIsEnabled,
  localMicrophoneTrack,
}: MicrophoneButtonProps) => {
  const toggleMicrophone = async () => {
    if (localMicrophoneTrack) {
      await localMicrophoneTrack.setEnabled(!isEnabled);
      setIsEnabled(!isEnabled);
    }
  };

  return (
    <button
      onClick={toggleMicrophone}
      className={`p-4 rounded-full transition-all duration-300 shadow-lg ${
        isEnabled
          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30'
          : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
      }`}
    >
      {isEnabled ? (
        <Mic className="w-6 h-6" />
      ) : (
        <MicOff className="w-6 h-6" />
      )}
    </button>
  );
};
