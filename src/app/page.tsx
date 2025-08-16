"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PhoneControlButton } from '@/components/PhoneControlButton';
import { ChatMessages } from '@/components/ChatMessages';
import { ErrorBanner, StatusIndicator } from '@/components/ErrorBanner';
import { UserInfoDialog } from '@/components/UserInfoDialog';
import { usePhoneAIStore } from '@/lib/store';
import { conversationManager } from '@/lib/conversation-manager';
import { hasUserInfoCookie, setUserInfoCookie, UserInfo } from '@/lib/user-info';

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
  const [isClient, setIsClient] = useState(false);

  // Fix hydration issues with dynamic content
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const dismissError = () => {
    setError(null);
  };

  // Poster style: disable floating particles to keep UI clean
  const particles: never[] = [];

  // Note: continueListening is now handled automatically in conversation-manager after TTS completes

  return (
    <div className="min-h-screen relative spacecraft-console">
      {/* Console Grid Background */}
      <div className="console-grid"></div>
      
      {/* Ambient Lighting Effects */}
      <div className="ambient-glow"></div>

      {/* User Info Dialog */}
      <UserInfoDialog
        isOpen={showUserInfoDialog}
        onSubmit={handleUserInfoSubmit}
        onClose={() => setShowUserInfoDialog(false)}
      />
      
      <div className="console-container max-w-7xl mx-auto px-6 py-6 relative z-10">
        {/* Command Header */}
        <div className="command-header mb-6">
          <div className="header-panel">
            <div className="status-line">
              <span className="system-id">AGORA-NEURAL-INTERFACE-V2.1</span>
              <span className="timestamp" suppressHydrationWarning>[{isClient ? new Date().toISOString().slice(0, 19) : ''}]</span>
            </div>
            <h1 className="console-title">
              NEURAL INTERVIEW PROTOCOL
            </h1>
            <div className="command-prompt">
              &gt; INITIALIZING DEEP COGNITIVE INTERFACE...
            </div>
            <div className="status-indicators">
              <span className="status-badge status-green">NEURAL-LINK: READY</span>
              <span className="status-badge status-blue">ENCRYPTION: AES-256</span>
              <span className="status-badge status-amber">AI-CORE: STANDBY</span>
            </div>
          </div>
        </div>

        {/* Main Console Layout */}
        <div className="console-layout">
          {/* Left Panel - System Diagnostics */}
          <div className="left-panel">
            <div className="panel-header">
              <span className="panel-title">SYSTEM DIAGNOSTICS</span>
            </div>
            <div className="diagnostic-grid">
              <div className="diagnostic-item">
                <div className="diagnostic-label">NEURAL BUFFER</div>
                <div className="diagnostic-bar">
                  <div className="bar-fill" style={{ width: isCallActive ? '85%' : '12%' }}></div>
                </div>
                <div className="diagnostic-value">{isCallActive ? '85%' : '12%'}</div>
              </div>
              <div className="diagnostic-item">
                <div className="diagnostic-label">AUDIO STREAM</div>
                <div className="diagnostic-bar">
                  <div className="bar-fill" style={{ width: isRecording ? '95%' : '0%' }}></div>
                </div>
                <div className="diagnostic-value">{isRecording ? 'ACTIVE' : 'IDLE'}</div>
              </div>
              <div className="diagnostic-item">
                <div className="diagnostic-label">AI PROCESSING</div>
                <div className="diagnostic-bar">
                  <div className={`bar-fill ${isProcessing ? 'processing' : ''}`} style={{ width: isProcessing ? '100%' : isCallActive ? '45%' : '0%' }}></div>
                </div>
                <div className="diagnostic-value">{isProcessing ? 'PROC' : isCallActive ? 'RDY' : 'OFF'}</div>
              </div>
              <div className="diagnostic-item">
                <div className="diagnostic-label">SYNC STATUS</div>
                <div className="diagnostic-bar">
                  <div className="bar-fill" style={{ width: isSpeaking ? '100%' : '25%' }}></div>
                </div>
                <div className="diagnostic-value">{isSpeaking ? 'TX' : 'SYNC'}</div>
              </div>
            </div>
            
            {/* Error Panel */}
            {error && (
              <div className="error-panel">
                <div className="error-header">SYSTEM ALERT</div>
                <ErrorBanner error={error} onDismiss={dismissError} />
              </div>
            )}
            
            {/* Status Indicator */}
            <div className="status-panel">
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
          </div>

          {/* Center Panel - Communication Interface */}
          <div className="center-panel">
            <div className="panel-header">
              <span className="panel-title">NEURAL COMMUNICATION INTERFACE</span>
              <div className="connection-status">
                <div className={`connection-dot ${isCallActive ? 'connected' : 'disconnected'}`}></div>
                <span>{isCallActive ? 'CONNECTED' : 'DISCONNECTED'}</span>
              </div>
            </div>
            <div className="chat-container">
              <ChatMessages
                messages={messages}
                isLoading={isProcessing}
              />
            </div>
          </div>

          {/* Right Panel - Control Interface */}
          <div className="right-panel">
            <div className="panel-header">
              <span className="panel-title">NEURAL LINK CONTROL</span>
            </div>
            
            <div className="control-section">
              <PhoneControlButton
                isCallActive={isCallActive}
                isRecording={isRecording}
                isProcessing={isProcessing || isLoading}
                onStartCall={handleStartCall}
                onEndCall={handleEndCall}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
              />
            </div>
            
            {/* System Monitors */}
            <div className="monitor-grid">
              <div className="monitor-item">
                <div className="monitor-label">AUDIO CORE</div>
                <div className={`monitor-status ${isRecording ? 'active' : 'standby'}`}>
                  {isRecording ? 'RECORDING' : 'STANDBY'}
                </div>
                <div className="monitor-indicator">
                  <div className={`indicator-dot ${isRecording ? 'pulse-green' : 'dim'}`}></div>
                </div>
              </div>
              
              <div className="monitor-item">
                <div className="monitor-label">AI ENGINE</div>
                <div className={`monitor-status ${isProcessing ? 'processing' : isCallActive ? 'online' : 'offline'}`}>
                  {isProcessing ? 'THINKING' : isCallActive ? 'ONLINE' : 'OFFLINE'}
                </div>
                <div className="monitor-indicator">
                  <div className={`indicator-dot ${isProcessing ? 'pulse-yellow' : isCallActive ? 'pulse-blue' : 'dim'}`}></div>
                </div>
              </div>
              
              <div className="monitor-item">
                <div className="monitor-label">DATA SYNC</div>
                <div className={`monitor-status ${isSpeaking ? 'transmitting' : 'ready'}`}>
                  {isSpeaking ? 'TRANSMIT' : 'READY'}
                </div>
                <div className="monitor-indicator">
                  <div className={`indicator-dot ${isSpeaking ? 'pulse-purple' : 'dim'}`}></div>
                </div>
              </div>
            </div>
            
            {/* Power and Connection Bars */}
            <div className="power-section">
              <div className="power-label">NEURAL LINK POWER</div>
              <div className="power-bars">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`power-bar ${i < (isCallActive ? 7 : 2) ? 'active' : 'inactive'}`}
                  ></div>
                ))}
              </div>
              <div className="power-percentage">{isCallActive ? '87%' : '25%'}</div>
            </div>
          </div>
        </div>

          {/* Result Display Modal - Console Style */}
          {showResult && interviewResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowResult(false)} />
              
              {/* Console Modal */}
              <div className="relative console-modal w-full max-w-6xl mx-4 max-h-[85vh] overflow-hidden">
                <div className="modal-header">
                  <div className="modal-title-bar">
                    <span className="modal-system-id">ANALYSIS-CORE-V1.0</span>
                    <span className="modal-timestamp">[REPORT-GENERATED]</span>
                    <button
                      onClick={() => setShowResult(false)}
                      className="modal-close-btn"
                    >
                      [X]
                    </button>
                  </div>
                  <h2 className="modal-main-title">NEURAL INTERVIEW ANALYSIS REPORT</h2>
                  <div className="modal-subtitle">&gt; COGNITIVE PATTERN ANALYSIS COMPLETE</div>
                </div>
                
                <div className="modal-content">
                  <div className="data-terminal">
                    <div className="terminal-header">
                      <span className="terminal-prompt">[DATA-STREAM] $&gt;</span>
                      <span className="terminal-status">OUTPUT_FORMAT: JSON</span>
                    </div>
                    <div className="terminal-body">
                      <pre className="terminal-text">
                        {JSON.stringify(interviewResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <div className="footer-status">
                    <span className="status-badge status-green">ANALYSIS: COMPLETE</span>
                    <span className="status-badge status-blue">DATA: VERIFIED</span>
                  </div>
                  <button
                    onClick={() => setShowResult(false)}
                    className="footer-close-btn"
                  >
                    [CLOSE TERMINAL]
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
