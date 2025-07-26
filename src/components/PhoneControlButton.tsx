import React from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';

interface PhoneControlButtonProps {
  isCallActive: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export const PhoneControlButton: React.FC<PhoneControlButtonProps> = ({
  isCallActive,
  isRecording,
  isProcessing,
  onStartCall,
  onEndCall,
  onStartRecording,
  onStopRecording,
  disabled = false,
}) => {
  const handleMainButtonClick = () => {
    if (!isCallActive) {
      onStartCall();
    } else {
      onEndCall();
    }
  };

  const handleMicButtonClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Main Call Button */}
      <button
        onClick={handleMainButtonClick}
        disabled={disabled || isProcessing}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-lg
          ${isCallActive 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-green-500 hover:bg-green-600'
          }
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          hover:scale-105 active:scale-95
        `}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isCallActive ? (
          <PhoneOff className="w-8 h-8 text-white" />
        ) : (
          <Phone className="w-8 h-8 text-white" />
        )}
        
        {/* Pulse animation for active call */}
        {isCallActive && !isProcessing && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
        )}
      </button>

      {/* Call Status */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isProcessing 
            ? '处理中...' 
            : isCallActive 
              ? '通话中' 
              : '点击开始通话'
          }
        </p>
      </div>

      {/* Microphone Button (only visible during active call) */}
      {isCallActive && (
        <button
          onClick={handleMicButtonClick}
          disabled={disabled || isProcessing}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-md
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gray-500 hover:bg-gray-600'
            }
            ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            hover:scale-105 active:scale-95
          `}
        >
          {isRecording ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
      )}

      {/* Recording Status */}
      {isCallActive && (
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isRecording ? '正在录音...' : '点击录音'}
          </p>
        </div>
      )}
    </div>
  );
};