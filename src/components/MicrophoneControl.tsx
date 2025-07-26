import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface MicrophoneControlProps {
  isEnabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const MicrophoneControl: React.FC<MicrophoneControlProps> = ({
  isEnabled,
  onToggle,
  disabled = false,
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          isEnabled
            ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 focus:ring-green-500 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
            : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {isEnabled ? (
        <Mic className="w-4 h-4 mr-2" />
      ) : (
        <MicOff className="w-4 h-4 mr-2" />
      )}
      {isEnabled ? '麦克风开启' : '麦克风关闭'}
    </button>
  );
};