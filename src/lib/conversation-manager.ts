import { chatService } from './chat';
import { ttsService } from './tts';
import { enhancedSpeechRecognitionService } from './enhanced-speech-recognition';
import { errorHandler } from './error-handler';
import { performanceMonitor } from './performance-monitor';
import { getUserInfoCookie } from './user-info';
import { KimiMessage } from '@/types';
import { usePhoneAIStore } from './store';

// 每个字符渲染的间隔时间（毫秒），调整为适合中文阅读和语音匹配的速度
const STREAM_TYPING_INTERVAL = 50;

export class ConversationManager {
  private static instance: ConversationManager;
  private isProcessingConversation = false;
  private currentAudioController: AbortController | null = null;
  private streamingTextTimer: NodeJS.Timeout | null = null;

  public static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }

  public async startVoiceConversation(): Promise<void> {
    const store = usePhoneAIStore.getState();
    
    if (!enhancedSpeechRecognitionService.isSupported()) {
      const errorMessage = errorHandler.getUserFriendlyMessage(new Error('Speech recognition not supported'));
      store.setError(errorMessage);
      return;
    }

    // Check if microphone is enabled
    if (!store.isMicrophoneEnabled) {
      console.log('Microphone is disabled, skipping voice conversation start');
      return;
    }

    // Check if already listening to prevent duplicate calls
    if (enhancedSpeechRecognitionService.getIsListening()) {
      console.log('Already listening, skipping duplicate start');
      return;
    }

    try {
      store.setRecording(true);
      store.setError(null);
      
      await performanceMonitor.monitorSpeechProcessing(
        () => enhancedSpeechRecognitionService.startListening(
          (transcript) => {
            // Handle final speech result with 4-second delay
            console.log('Received final transcript after 4-second delay:', transcript);
            this.handleUserSpeech(transcript);
          },
          (error) => {
            const userFriendlyError = errorHandler.getUserFriendlyMessage(new Error(error));
            errorHandler.handleError(new Error(error), 'Enhanced Speech Recognition');
            store.setError(userFriendlyError);
            store.setRecording(false);
            store.setWaitingToUpload(false);
          },
          () => {
            store.setRecording(true);
            console.log('Enhanced speech recognition started');
          },
          () => {
            store.setRecording(false);
            store.setWaitingToUpload(false);
            console.log('Enhanced speech recognition ended');
          },
          {
            language: store.language,
            continuous: true,
            interimResults: true,
          }
        ),
        'recognition'
      );
    } catch (error) {
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      errorHandler.handleError(error, 'Voice Conversation Start');
      store.setError(userFriendlyError);
      store.setRecording(false);
      store.setWaitingToUpload(false);
    }
  }

  public stopVoiceConversation(): void {
    enhancedSpeechRecognitionService.stopListening();
    this.stopCurrentAudio();
    this.stopStreamingText();
    const store = usePhoneAIStore.getState();
    store.setRecording(false);
    store.setProcessing(false);
    store.setSpeaking(false);
    store.setWaitingToUpload(false);
  }

  private async handleUserSpeech(transcript: string): Promise<void> {
    if (this.isProcessingConversation) {
      return; // Prevent overlapping conversations
    }

    this.isProcessingConversation = true;
    const store = usePhoneAIStore.getState();

    try {
      // Add user message to store
      store.addMessage({
        role: 'user',
        content: transcript,
      });

      store.setProcessing(true);
      store.setRecording(false);

      // Generate AI response
      const response = await this.generateAIResponse(transcript);
      
      if (response) {
        // Check if response contains </end> marker
        const hasEndMarker = response.includes('</end>');
        
        // Remove the </end> marker from the display text
        const cleanResponse = response.replace('</end>', '').trim();
        
        // Start streaming the text response
        await this.streamTextAndSpeak(cleanResponse);

        // If </end> marker was found, end the interview and generate summary
        if (hasEndMarker) {
          console.log('Interview end marker detected, stopping recording and generating summary...');
          
          // 🔧 重要修复：AI结束采访时立即停止录音功能
          console.log('🛑 Interview ended by AI - stopping all recording activities');
          enhancedSpeechRecognitionService.stopListening();
          store.setRecording(false);
          store.setWaitingToUpload(false);
          store.setSilenceProgress(0);
          
          setTimeout(() => {
            this.endInterviewAndSummarize();
          }, 1000); // Small delay to ensure TTS completes
        }
      }

    } catch (error) {
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      errorHandler.handleError(error, 'User Speech Processing');
      store.setError(userFriendlyError);
    } finally {
      store.setProcessing(false);
      store.setSpeaking(false);
      this.isProcessingConversation = false;
    }
  }

  private async generateAIResponse(userInput: string): Promise<string | null> {
    const store = usePhoneAIStore.getState();
    
    try {
      // Convert messages to KimiMessage format
      const conversationHistory: KimiMessage[] = store.messages
        .slice(-10) // Keep last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Add current user input
      conversationHistory.push({
        role: 'user',
        content: userInput,
      });

      const response = await performanceMonitor.monitorAPICall(
        () => chatService.sendMessage(conversationHistory),
        'kimi-chat',
        '/api/chat'
      );
      
      return response;

    } catch (error) {
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      errorHandler.handleError(error, 'AI Response Generation');
      store.setError(userFriendlyError);
      return null;
    }
  }

  // 新的流式渲染和语音播放方法
  private async streamTextAndSpeak(text: string): Promise<void> {
    if (!text || text.trim().length === 0) return;
    
    const store = usePhoneAIStore.getState();
    this.stopStreamingText(); // 停止任何正在进行的流式渲染
    
    // 🔧 检查是否包含结束标记
    const hasEndMarker = text.includes('</end>');
    
    // 🔧 重要修复：TTS开始前停止语音识别，防止录入AI声音
    console.log('🔇 Stopping speech recognition before TTS');
    enhancedSpeechRecognitionService.stopListening();
    
    try {
      store.setSpeaking(true);
      store.setPlaying(true);

      // 开始流式渲染
      store.startStreamingMessage('assistant');
      
      // 同时请求TTS音频
      const audioPromise = performanceMonitor.monitorAudioProcessing(
        () => ttsService.textToSpeech(text),
        'text-to-speech'
      );

      // 启动文本流式渲染
      const streamTextPromise = this.streamText(text);
      
      // 等待音频生成完成（不等待文本流式渲染完成）
      this.currentAudioController = new AbortController();
      const audioBlob = await audioPromise;
      
      // 音频准备好后立即播放，与文本流式渲染并行
      if (this.currentAudioController && !this.currentAudioController.signal.aborted) {
        // 播放音频（不等待streamText完成）
        await performanceMonitor.monitorAudioProcessing(
          () => ttsService.playAudio(audioBlob),
          'audio-playback'
        );
        console.log('🎵 TTS playback completed');
      }
      
      // 确保文本流式渲染已完成
      await streamTextPromise;
      
      // 完成流式渲染，添加到消息列表
      store.completeStreamingMessage();

    } catch (error) {
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      errorHandler.handleError(error, 'Text-to-Speech');
      store.setError(userFriendlyError);
      
      // 确保即使发生错误也完成流式消息
      if (store.streamingMessage) {
        store.completeStreamingMessage();
      }
    } finally {
      // 确保状态始终被重置
      store.setSpeaking(false);
      store.setPlaying(false);
      this.currentAudioController = null;
      // 停止任何残留的流式文本渲染
      this.stopStreamingText();
      
      // 🔧 重要修复：如果包含结束标记，不要重新启动录音
      if (hasEndMarker) {
        console.log('🛑 End marker detected in TTS - not restarting listening');
      } else {
        // 🔧 重要修复：TTS完成后，等待更长时间再重新开始监听，确保完全清理
        console.log('🎵 TTS and streaming completed, waiting 800ms before restarting listening...');
        setTimeout(() => {
          if (!this.isProcessingConversation) {
            this.continueListening();
          }
        }, 800);
      }
    }
  }

  // 流式渲染文本的辅助方法
  private streamText(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const store = usePhoneAIStore.getState();
      let index = 0;
      
      // 清除任何现有的计时器
      if (this.streamingTextTimer) {
        clearInterval(this.streamingTextTimer);
      }
      
      // 动态计算打字速度，根据文本长度优化显示体验
      // 文本越长，打字速度越快，但有最小和最大限制
      const textLength = text.length;
      let typingInterval = STREAM_TYPING_INTERVAL;
      
      if (textLength > 200) {
        // 对于长文本，加快速度，但不超过最小值
        typingInterval = Math.max(20, STREAM_TYPING_INTERVAL - (textLength / 20));
      }
      
      console.log(`Text length: ${textLength}, typing interval: ${typingInterval}ms`);
      
      // 中文标点符号列表，这些符号后会有短暂停顿
      const pauseCharacters = ['。', '，', '；', '！', '？', '.', ',', ';', '!', '?'];
      
      // 设置计时器，一次渲染一个字符
      this.streamingTextTimer = setInterval(() => {
        if (index < text.length) {
          const currentChar = text[index];
          store.appendToStreamingMessage(currentChar);
          index++;
          
          // 如果当前字符是标点符号，增加停顿
          if (pauseCharacters.includes(currentChar)) {
            // 暂时清除计时器，增加停顿
            if (this.streamingTextTimer) {
              clearInterval(this.streamingTextTimer);
              
              // 根据标点符号类型决定停顿时间
              const pauseTime = 
                ['。', '！', '？', '.', '!', '?'].includes(currentChar) 
                  ? 300  // 句号等停顿长一些
                  : 150; // 逗号等停顿短一些
                
              // 停顿后重新开始
              setTimeout(() => {
                this.streamingTextTimer = setInterval(() => {
                  if (index < text.length) {
                    store.appendToStreamingMessage(text[index]);
                    index++;
                  } else {
                    if (this.streamingTextTimer) {
                      clearInterval(this.streamingTextTimer);
                      this.streamingTextTimer = null;
                    }
                    resolve();
                  }
                }, typingInterval);
              }, pauseTime);
            }
          }
        } else {
          // 完成渲染
          if (this.streamingTextTimer) {
            clearInterval(this.streamingTextTimer);
            this.streamingTextTimer = null;
          }
          resolve();
        }
      }, typingInterval);
    });
  }

  // 停止流式文本渲染
  private stopStreamingText(): void {
    if (this.streamingTextTimer) {
      clearInterval(this.streamingTextTimer);
      this.streamingTextTimer = null;
    }
    
    // 如果有未完成的流式消息，完成它
    const store = usePhoneAIStore.getState();
    if (store.streamingMessage && !store.streamingMessage.isComplete) {
      store.completeStreamingMessage();
    }
  }

  private stopCurrentAudio(): void {
    if (this.currentAudioController) {
      this.currentAudioController.abort();
      this.currentAudioController = null;
    }
  }

  public async sendTextMessage(text: string): Promise<void> {
    if (this.isProcessingConversation) {
      return;
    }

    this.isProcessingConversation = true;
    const store = usePhoneAIStore.getState();

    try {
      // Add user message
      store.addMessage({
        role: 'user',
        content: text,
      });

      store.setProcessing(true);

      // Generate AI response
      const response = await this.generateAIResponse(text);
      
      if (response) {
        // 使用流式渲染方式处理响应
        await this.streamTextAndSpeak(response);
      }

    } catch (error) {
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      errorHandler.handleError(error, 'Text Message Processing');
      store.setError(userFriendlyError);
    } finally {
      store.setProcessing(false);
      store.setSpeaking(false);
      this.isProcessingConversation = false;
    }
  }

  public isProcessing(): boolean {
    return this.isProcessingConversation;
  }

  public async continueListening(): Promise<void> {
    const store = usePhoneAIStore.getState();
    
    console.log('🔄 continueListening called - checking conditions:', {
      isCallActive: store.isCallActive,
      isRecording: store.isRecording,
      isProcessingConversation: this.isProcessingConversation,
      isMicrophoneEnabled: store.isMicrophoneEnabled,
      isListening: enhancedSpeechRecognitionService.getIsListening()
    });
    
    // 🔧 重要修复：增加更严格的检查，防止重复调用
    if (!store.isCallActive || 
        store.isRecording || 
        this.isProcessingConversation || 
        !store.isMicrophoneEnabled ||
        enhancedSpeechRecognitionService.getIsListening()) {
      console.log('⚠️ Conditions not met for continueListening, skipping');
      return;
    }
    
    // Wait a moment before restarting listening
    setTimeout(() => {
      const currentStore = usePhoneAIStore.getState();
      // 🔧 重复检查确保状态仍然有效
      if (currentStore.isCallActive && 
          !currentStore.isRecording && 
          currentStore.isMicrophoneEnabled &&
          !enhancedSpeechRecognitionService.getIsListening() &&
          !this.isProcessingConversation) {
        console.log('🎙️ Starting voice conversation after delay');
        this.startVoiceConversation();
      } else {
        console.log('⚠️ Conditions changed during delay, not starting voice conversation');
      }
    }, 1000);
  }

  public toggleMicrophone(): void {
    const store = usePhoneAIStore.getState();
    const newState = !store.isMicrophoneEnabled;
    
    store.setMicrophoneEnabled(newState);
    
    if (!newState) {
      // If disabling microphone, stop current listening
      this.stopCurrentListening();
    } else if (store.isCallActive && !store.isRecording && !this.isProcessingConversation) {
      // If enabling microphone during active call, restart listening
      setTimeout(() => this.startVoiceConversation(), 500);
    }
  }

  private stopCurrentListening(): void {
    enhancedSpeechRecognitionService.stopListening();
    const store = usePhoneAIStore.getState();
    store.setRecording(false);
    store.setWaitingToUpload(false);
    store.setSilenceProgress(0);
  }

  public async endInterviewWithResult(): Promise<object> {
    const store = usePhoneAIStore.getState();
    
    try {
      console.log('Ending interview and generating summary...');
      
      // Stop voice conversation
      this.stopVoiceConversation();
      
      // Set processing state for summary generation
      store.setProcessing(true);
      
      // Get user info from cookies
      const userInfo = getUserInfoCookie();
      
      // Filter out system messages and prepare for summary
      const interviewMessages = store.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('Sending messages for summary:', interviewMessages.length);

      // Generate summary with user info
      const response = await fetch('/api/interview-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: interviewMessages,
          userInfo: userInfo
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate interview summary');
      }

      const summaryData = await response.json();
      
      // Prepare result object
      const result = {
        userInfo: userInfo,
        summary: summaryData.summary,
        messages: interviewMessages,
        messageCount: interviewMessages.length,
        timestamp: new Date().toISOString(),
        dbUploadStatus: 'pending'
      };
      
      // Upload data to database
      if (userInfo && summaryData.summary) {
        try {
          // 只上传到 agents 表，不需要 interviews 表
          console.log('Uploading summary to agents table');
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              table: 'agents',
              data: {
                email: userInfo.email,
                bg: summaryData.summary,
                name: userInfo.name,
                created_at: new Date().toISOString()
              }
            })
          });

          if (uploadResponse.ok) {
            console.log('Agent data uploaded to database successfully');
            result.dbUploadStatus = 'success';
          } else {
            console.error('Failed to upload agent data to database');
            result.dbUploadStatus = 'failed';
          }
        } catch (uploadError) {
          console.error('Error uploading to database:', uploadError);
          result.dbUploadStatus = 'error';
        }
      }
      
      // End the call
      store.endConversation();

      console.log('Interview ended successfully');
      return result;

    } catch (error) {
      console.error('Error ending interview:', error);
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      store.setError(`结束采访失败: ${userFriendlyError}`);
      throw error;
    } finally {
      store.setProcessing(false);
    }
  }

  private async endInterviewAndSummarize(): Promise<void> {
    const store = usePhoneAIStore.getState();
    
    try {
      console.log('Ending interview and generating summary...');
      
      // Stop voice conversation
      this.stopVoiceConversation();
      
      // Set processing state for summary generation
      store.setProcessing(true);
      
      // Get user info from cookies
      const userInfo = getUserInfoCookie();
      
      // Filter out system messages and prepare for summary
      const interviewMessages = store.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('Sending messages for summary:', interviewMessages.length);

      // Generate summary with user info
      const response = await fetch('/api/interview-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: interviewMessages,
          userInfo: userInfo
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate interview summary');
      }

      const summaryData = await response.json();
      
      // 使用流式渲染显示总结
      const summaryContent = `📋 **采访总结**\n\n${summaryData.summary}`;
      
      // 🔧 上传总结数据到数据库 - 使用指定的数据格式
      if (userInfo && summaryData.summary) {
        try {
          console.log('Uploading summary to database with format: { email: email, bg: summary, name: name }');
          const summaryUploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              table: 'agents', // 使用agents表
              data: {
                email: userInfo.email,
                bg: summaryData.summary,
                name: userInfo.name,
                created_at: new Date().toISOString()
              }
            })
          });

          if (summaryUploadResponse.ok) {
            console.log('Summary data uploaded to database successfully');
          } else {
            console.error('Failed to upload summary data to database');
          }
        } catch (summaryUploadError) {
          console.error('Error uploading summary to database:', summaryUploadError);
        }
      }
      
      store.startStreamingMessage('assistant');
      await this.streamText(summaryContent);
      store.completeStreamingMessage();

      // End the call
      store.endConversation();

      console.log('Interview summary generated successfully');

    } catch (error) {
      console.error('Error generating interview summary:', error);
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      store.setError(`生成采访总结失败: ${userFriendlyError}`);
    } finally {
      store.setProcessing(false);
    }
  }
}

export const conversationManager = ConversationManager.getInstance();