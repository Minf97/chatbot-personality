import { chatService } from './chat';
import { ttsService } from './tts';
import { enhancedSpeechRecognitionService } from './enhanced-speech-recognition';
import { errorHandler } from './error-handler';
import { performanceMonitor } from './performance-monitor';
import { KimiMessage, ChatMessage } from '@/types';
import { usePhoneAIStore } from './store';

export class ConversationManager {
  private static instance: ConversationManager;
  private isProcessingConversation = false;
  private currentAudioController: AbortController | null = null;

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
        
        // Store the response as pending (don't display yet)
        store.setPendingAIMessage(cleanResponse);

        // Convert response to speech and play
        await this.speakResponse(cleanResponse);

        // If </end> marker was found, end the interview and generate summary
        if (hasEndMarker) {
          console.log('Interview end marker detected, generating summary...');
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

  private async speakResponse(text: string): Promise<void> {
    const store = usePhoneAIStore.getState();
    
    try {
      store.setSpeaking(true);
      store.setPlaying(true);

      // Create abort controller for audio playback
      this.currentAudioController = new AbortController();

      const audioBlob = await performanceMonitor.monitorAudioProcessing(
        () => ttsService.textToSpeech(text),
        'text-to-speech'
      );
      
      // Check if we should still play (not aborted)
      if (!this.currentAudioController.signal.aborted) {
        // Add the AI message to display when audio starts playing
        const aiMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: text,
        };
        store.addMessage(aiMessage);
        
        // Clear pending message since we're now displaying it
        store.setPendingAIMessage(null);
        
        await performanceMonitor.monitorAudioProcessing(
          () => ttsService.playAudio(audioBlob),
          'audio-playback'
        );
      }

    } catch (error) {
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      errorHandler.handleError(error, 'Text-to-Speech');
      store.setError(userFriendlyError);
      
      // If TTS fails, still display the message
      if (store.pendingAIMessage) {
        const aiMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
          role: 'assistant', 
          content: store.pendingAIMessage,
        };
        store.addMessage(aiMessage);
        store.setPendingAIMessage(null);
      }
    } finally {
      store.setSpeaking(false);
      store.setPlaying(false);
      this.currentAudioController = null;
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

      // Generate and add AI response
      const response = await this.generateAIResponse(text);
      
      if (response) {
        store.addMessage({
          role: 'assistant',
          content: response,
        });

        // Optionally speak the response
        if (store.isCallActive) {
          await this.speakResponse(response);
        }
      }

    } catch (error) {
      const userFriendlyError = errorHandler.getUserFriendlyMessage(error);
      errorHandler.handleError(error, 'Text Message Processing');
      store.setError(userFriendlyError);
    } finally {
      store.setProcessing(false);
      this.isProcessingConversation = false;
    }
  }

  public isProcessing(): boolean {
    return this.isProcessingConversation;
  }

  public async continueListening(): Promise<void> {
    const store = usePhoneAIStore.getState();
    
    if (store.isCallActive && !store.isRecording && !this.isProcessingConversation) {
      // Wait a moment before restarting listening
      setTimeout(() => {
        if (store.isCallActive && !store.isRecording) {
          this.startVoiceConversation();
        }
      }, 1000);
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
      
      // Filter out system messages and prepare for summary
      const interviewMessages = store.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('Sending messages for summary:', interviewMessages.length);

      // Generate summary
      const response = await fetch('/api/interview-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: interviewMessages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate interview summary');
      }

      const summaryData = await response.json();
      
      // Add summary as a special message to the store
      store.addMessage({
        role: 'assistant',
        content: `📋 **采访总结**\n\n${summaryData.summary}`,
      });

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