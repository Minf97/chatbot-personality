"use client";

import React from 'react';
import { AlertTriangle, X, Zap, Wifi, Loader2, Cpu } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss }) => {
  return (
    <div className="bg-[--surface-1] border border-red-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="ml-3 flex-1">
          <div className="text-xs text-red-300 font-mono mb-1">[SYSTEM_ERROR]</div>
          <p className="text-sm text-red-100 font-mono">
            {error}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            type="button"
            onClick={onDismiss}
            className="accent-btn--quiet w-8 h-8 rounded-lg flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatusIndicatorProps {
  isRecording?: boolean;
  isPlaying?: boolean;
  isLoading?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  isWaitingToUpload?: boolean;
  silenceProgress?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isRecording,
  isPlaying,
  isLoading,
  isSpeaking,
  isProcessing,
  isWaitingToUpload,
  silenceProgress = 0,
}) => {
  if (!isRecording && !isPlaying && !isLoading && !isSpeaking && !isProcessing && !isWaitingToUpload) {
    return null;
  }

  // Determine the status message, color, and icon
  let statusMessage = '';
  let statusColor = '';
  let StatusIcon = Zap;
  
  if (isWaitingToUpload) {
    statusMessage = 'SILENCE DETECTED - PREPARING UPLOAD...';
    statusColor = 'orange';
    StatusIcon = Wifi;
  } else if (isRecording) {
    statusMessage = 'AUDIO STREAM ACTIVE - RECORDING...';
    statusColor = 'red';
    StatusIcon = Zap;
  } else if (isProcessing) {
    statusMessage = 'PROCESSING NEURAL INPUT...';
    statusColor = 'blue';
    StatusIcon = Cpu;
  } else if (isSpeaking) {
    statusMessage = 'AI CORE RESPONDING...';
    statusColor = 'green';
    StatusIcon = Cpu;
  } else if (isPlaying) {
    statusMessage = 'AUDIO OUTPUT ACTIVE...';
    statusColor = 'green';
    StatusIcon = Wifi;
  } else if (isLoading) {
    statusMessage = 'SYSTEM LOADING...';
    statusColor = 'blue';
    StatusIcon = Loader2;
  }

  const getStatusColors = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'from-cyan-900/40 to-blue-900/40',
          border: 'border-cyan-500/50',
          text: 'text-cyan-100',
          icon: 'text-cyan-400',
          dot: 'bg-cyan-400'
        };
      case 'red':
        return {
          bg: 'from-red-900/40 to-red-800/40',
          border: 'border-red-500/50',
          text: 'text-red-100',
          icon: 'text-red-400',
          dot: 'bg-red-400'
        };
      case 'green':
        return {
          bg: 'from-green-900/40 to-emerald-900/40',
          border: 'border-green-500/50',
          text: 'text-green-100',
          icon: 'text-green-400',
          dot: 'bg-green-400'
        };
      case 'orange':
        return {
          bg: 'from-orange-900/40 to-amber-900/40',
          border: 'border-orange-500/50',
          text: 'text-orange-100',
          icon: 'text-orange-400',
          dot: 'bg-orange-400'
        };
      default:
        return {
          bg: 'from-gray-900/40 to-slate-900/40',
          border: 'border-gray-500/50',
          text: 'text-gray-100',
          icon: 'text-gray-400',
          dot: 'bg-gray-400'
        };
    }
  };

  const colors = getStatusColors(statusColor);

  return (
    <div className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-4 mb-4 backdrop-blur-sm`}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center border ${colors.border}`}>
            {isWaitingToUpload ? (
              <div className="relative">
                <CircularProgress 
                  progress={silenceProgress} 
                  size={24}
                  strokeWidth={2}
                  showText={false}
                />
                <Wifi className={`absolute inset-0 w-4 h-4 m-auto ${colors.icon}`} />
              </div>
            ) : (
              <StatusIcon className={`w-5 h-5 ${colors.icon} ${isLoading ? 'animate-spin' : 'animate-pulse'}`} />
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <div className={`text-xs font-mono mb-1 ${colors.icon}`}>
            [SYSTEM_STATUS]
          </div>
          <p className={`text-sm font-mono ${colors.text}`}>
            {statusMessage}
          </p>
        </div>
        
        {isWaitingToUpload && (
          <div className="text-right">
            <div className={`text-xs font-mono ${colors.icon}`}>PROGRESS</div>
            <div className={`text-lg font-bold ${colors.text}`}>
              {Math.round(silenceProgress)}%
            </div>
          </div>
        )}
        
        {/* Status lights */}
        <div className="flex flex-col space-y-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 ${colors.dot} rounded-full transition-all duration-300`}
              style={{
                animationDelay: `${i * 0.2}s`,
                animation: 'pulse 1.5s infinite',
                opacity: i <= 2 ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};