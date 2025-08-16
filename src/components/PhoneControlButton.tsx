"use client";

import React from "react";
import { Power, PowerOff, Loader2, Radio, Wifi } from "lucide-react";

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
    <div className="flex flex-col items-center space-y-6">
      {/* Main Call Button */}
      <div className="relative">
        <button
          onClick={handleMainButtonClick}
          disabled={disabled || isProcessing}
          className={`
            relative w-24 h-24 rounded-full flex items-center justify-center
            transition-transform duration-200
            ${disabled || isProcessing ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
            ${isCallActive ? 'bg-red-500' : 'bg-[--accent-olive]'}
            border border-[--border-soft]
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isCallActive ? (
            <PowerOff className="w-10 h-10 text-white" />
          ) : (
            <Power className="w-10 h-10 text-white" />
          )}
        </button>
      </div>

      {/* Call Status */}
      <div className="text-center">
        <p className="text-lg font-bold font-mono tracking-widest text-[--text-muted]">
          {isProcessing
            ? 'INITIALIZING'
            : isCallActive
            ? 'NEURAL LINK ACTIVE'
            : 'ACTIVATE NEURAL LINK'}
        </p>
        <div className="flex justify-center space-x-2 mt-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-[--accent-olive]' : isProcessing ? 'bg-[--accent-amber]' : 'bg-gray-600'}`}
              style={{ opacity: 0.9 }}
            />
          ))}
        </div>
      </div>

      {/* Microphone Button (only visible during active call) */}
      {isCallActive && (
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={handleMicButtonClick}
            disabled={disabled || isProcessing}
            className={`
              relative w-16 h-16 rounded-xl flex items-center justify-center
              transition-transform duration-200
              ${disabled || isProcessing ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
              ${isRecording ? 'bg-[--accent-olive]' : 'bg-[--surface-2]'}
              border border-[--border-soft]
              shadow-[0_6px_20px_rgba(0,0,0,0.35)]
            `}
          >
            {isRecording ? (
              <Radio className="w-6 h-6 text-white" />
            ) : (
              <Wifi className="w-6 h-6 text-[--text-muted]" />
            )}
          </button>

          {/* Recording Status */}
          <div className="text-center">
            <p className="text-sm font-mono text-[--text-muted]">
              {isRecording ? 'AUDIO STREAM ACTIVE' : 'READY TO TRANSMIT'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
