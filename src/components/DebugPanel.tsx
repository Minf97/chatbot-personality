import React from 'react';
import { usePhoneAIStore } from '@/lib/store';

export const DebugPanel: React.FC = () => {
  const store = usePhoneAIStore();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Recording: {store.isRecording ? '✅' : '❌'}</div>
        <div>Processing: {store.isProcessing ? '✅' : '❌'}</div>
        <div>Speaking: {store.isSpeaking ? '✅' : '❌'}</div>
        <div>Call Active: {store.isCallActive ? '✅' : '❌'}</div>
        <div>Messages: {store.messages.length}</div>
        {store.error && (
          <div className="text-red-300 mt-2">
            <div className="font-semibold">Error:</div>
            <div>{store.error}</div>
          </div>
        )}
      </div>
    </div>
  );
};