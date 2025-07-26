"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PhoneControlButton } from '@/components/PhoneControlButton';
import { ChatMessages } from '@/components/ChatMessages';
import { ErrorBanner, StatusIndicator } from '@/components/ErrorBanner';
import { DebugPanel } from '@/components/DebugPanel';
import { MicrophoneControl } from '@/components/MicrophoneControl';
import { UserInfoDialog } from '@/components/UserInfoDialog';
import { usePhoneAIStore } from '@/lib/store';
import { conversationManager } from '@/lib/conversation-manager';
import { hasUserInfoCookie, setUserInfoCookie, UserInfo } from '@/lib/user-info';
import { Bot, Smartphone } from 'lucide-react';

export default function Home() {
  const {
    messages,
    isRecording,
    isPlaying,
    isLoading,
    isSpeaking,
    isProcessing,
    isCallActive,
    isWaitingToUpload,
    silenceProgress,
    isMicrophoneEnabled,
    error,
    startNewConversation,
    endConversation,
    setError,
  } = usePhoneAIStore();

  // 优化的调试日志 - 只在值变化时输出
  const prevIsCallActiveRef = useRef(isCallActive);
  const prevIsWaitingToUploadRef = useRef(isWaitingToUpload);

  useEffect(() => {
    if (prevIsCallActiveRef.current !== isCallActive) {
      // console.log(isCallActive, "isCallActive??");
      prevIsCallActiveRef.current = isCallActive;
    }
  }, [isCallActive]);

  useEffect(() => {
    if (prevIsWaitingToUploadRef.current !== isWaitingToUpload) {
      // console.log(isWaitingToUpload, "isWaitingToUpload???");
      prevIsWaitingToUploadRef.current = isWaitingToUpload;
    }
  }, [isWaitingToUpload]);

  const [showUserInfoDialog, setShowUserInfoDialog] = useState(false);
  const [interviewResult, setInterviewResult] = useState<object | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleStartCall = async () => {
    // Check if user info exists
    if (!hasUserInfoCookie()) {
      setShowUserInfoDialog(true);
      return;
    }

    try {
      startNewConversation();
      await conversationManager.startVoiceConversation();
    } catch (error) {
      console.error('Failed to start call:', error);
      setError('启动通话失败，请检查麦克风权限');
      endConversation();
    }
  };

  const handleUserInfoSubmit = async (userInfo: UserInfo) => {
    setUserInfoCookie(userInfo);
    setShowUserInfoDialog(false);
    
    // Now start the actual call
    try {
      startNewConversation();
      await conversationManager.startVoiceConversation();
    } catch (error) {
      console.error('Failed to start call:', error);
      setError('启动通话失败，请检查麦克风权限');
      endConversation();
    }
  };

  const handleEndInterview = async () => {
    try {
      const result = await conversationManager.endInterviewWithResult();
      setInterviewResult(result);
      setShowResult(true);
    } catch (error) {
      console.error('Failed to end interview:', error);
      setError('结束采访失败');
    }
  };

  const handleEndCall = () => {
    conversationManager.stopVoiceConversation();
    endConversation();
  };

  const handleStartRecording = async () => {
    if (isCallActive) {
      try {
        await conversationManager.startVoiceConversation();
      } catch (error) {
        console.error('Failed to start recording:', error);
        setError('启动录音失败');
      }
    }
  };

  const handleStopRecording = () => {
    conversationManager.stopVoiceConversation();
  };

  const handleToggleMicrophone = () => {
    conversationManager.toggleMicrophone();
  };

  const dismissError = () => {
    setError(null);
  };

  // Note: continueListening is now handled automatically in conversation-manager after TTS completes

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* User Info Dialog */}
      <UserInfoDialog
        isOpen={showUserInfoDialog}
        onSubmit={handleUserInfoSubmit}
        onClose={() => setShowUserInfoDialog(false)}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-full">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <Smartphone className="w-6 h-6 text-gray-400 mx-2" />
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-3 rounded-full">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI采访系统
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            与AI进行语音采访，语音停顿4秒后自动上传，AI说出&quot;结束&quot;时自动生成采访总结
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Status and Error Messages */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            {error && <ErrorBanner error={error} onDismiss={dismissError} />}
            <StatusIndicator
              isRecording={isRecording}
              isPlaying={isPlaying}
              isLoading={isLoading}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              isWaitingToUpload={isWaitingToUpload}
              silenceProgress={silenceProgress}
            />
          </div>

          {/* Chat Messages */}
          <div className="h-96 flex flex-col">
            <ChatMessages
              messages={messages}
              isLoading={isProcessing}
            />
          </div>

          {/* Controls */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-center items-center space-x-4">
              <PhoneControlButton
                isCallActive={isCallActive}
                isRecording={isRecording}
                isProcessing={isProcessing || isLoading}
                onStartCall={handleStartCall}
                onEndCall={handleEndCall}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
              />
              
              {/* Microphone Control - only show during active call */}
              {/* {isCallActive && (
                <MicrophoneControl
                  isEnabled={isMicrophoneEnabled}
                  onToggle={handleToggleMicrophone}
                  disabled={isProcessing || isLoading}
                />
              )} */}
              
            </div>
          </div>
        </div>

        {/* Result Display Modal */}
        {showResult && interviewResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowResult(false)} />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-6 max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">采访结果</h2>
                <button
                  onClick={() => setShowResult(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {JSON.stringify(interviewResult, null, 2)}
                </pre>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowResult(false)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Debug Panel */}
      {/* <DebugPanel /> */}
    </div>
  );
}
