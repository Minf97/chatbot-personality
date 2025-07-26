import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md bg-red-50 dark:bg-red-900/20 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 dark:focus:ring-offset-red-900/20"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-3 w-3" />
            </button>
          </div>
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

  // Determine the status message and style
  let statusMessage = '';
  let statusColor = 'blue';
  
  if (isWaitingToUpload) {
    statusMessage = '请保持安静，等待语音上传...';
    statusColor = 'orange';
  } else if (isRecording) {
    statusMessage = '正在录音中...';
    statusColor = 'red';
  } else if (isProcessing) {
    statusMessage = '正在处理您的语音...';
    statusColor = 'blue';
  } else if (isSpeaking) {
    statusMessage = 'AI正在回复...';
    statusColor = 'green';
  } else if (isPlaying) {
    statusMessage = '正在播放音频...';
    statusColor = 'green';
  } else if (isLoading) {
    statusMessage = '正在加载...';
    statusColor = 'blue';
  }

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      dot: 'bg-blue-500'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      dot: 'bg-red-500'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      dot: 'bg-green-500'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-800 dark:text-orange-200',
      dot: 'bg-orange-500'
    }
  };

  const colors = colorClasses[statusColor as keyof typeof colorClasses];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-3 mb-4`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {isWaitingToUpload ? (
            <CircularProgress 
              progress={silenceProgress} 
              size={24}
              strokeWidth={3}
              showText={false}
            />
          ) : (
            <div className={`w-2 h-2 ${colors.dot} rounded-full animate-pulse`}></div>
          )}
        </div>
        <p className={`text-sm ${colors.text} flex-1`}>
          {statusMessage}
        </p>
        {isWaitingToUpload && (
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            {Math.round(silenceProgress)}%
          </div>
        )}
      </div>
    </div>
  );
};