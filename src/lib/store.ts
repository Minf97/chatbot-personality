import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChatMessage, ConversationState } from '@/types';

export interface PhoneAIState extends ConversationState {
  // Conversation state
  conversationId: string | null;
  isCallActive: boolean;
  
  // Audio states  
  isSpeaking: boolean;
  isProcessing: boolean;
  isWaitingToUpload: boolean;
  silenceProgress: number; // 0-100 for circular progress
  isMicrophoneEnabled: boolean; // Control microphone during interview
  
  // Pending messages for delayed display
  pendingAIMessage: string | null;
  
  // Streaming message state
  streamingMessage: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    isComplete: boolean;
  } | null;
  
  // Settings
  language: string;
  voiceId: string;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  
  // Streaming actions
  startStreamingMessage: (role: 'user' | 'assistant') => string; // Returns message ID
  appendToStreamingMessage: (text: string) => void;
  completeStreamingMessage: () => void;
  
  setRecording: (isRecording: boolean) => void;
  setPlaying: (isPlaying: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  setWaitingToUpload: (isWaiting: boolean) => void;
  setSilenceProgress: (progress: number) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
  
  setPendingAIMessage: (message: string | null) => void;
  
  setCallActive: (isActive: boolean) => void;
  setError: (error: string | null) => void;
  
  setLanguage: (language: string) => void;
  setVoiceId: (voiceId: string) => void;
  
  startNewConversation: () => void;
  endConversation: () => void;
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const usePhoneAIStore = create<PhoneAIState>()(
  devtools(
    (set) => ({
      // Initial state
      messages: [],
      isRecording: false,
      isPlaying: false,
      isLoading: false,
      isSpeaking: false,
      isProcessing: false,
      isWaitingToUpload: false,
      silenceProgress: 0,
      isMicrophoneEnabled: true,
      pendingAIMessage: null,
      streamingMessage: null,
      error: null,
      
      conversationId: null,
      isCallActive: false,
      
      language: 'zh-CN',
      voiceId: 'male-qn-qingse',
      
      // Message actions
      addMessage: (messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: generateId(),
          timestamp: Date.now(),
        };
        
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },
      
      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },
      
      removeMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        }));
      },
      
      clearMessages: () => {
        set({ messages: [] });
      },
      
      // Streaming message actions
      startStreamingMessage: (role) => {
        const id = generateId();
        set({
          streamingMessage: {
            id,
            role,
            content: '',
            isComplete: false
          }
        });
        return id;
      },
      
      appendToStreamingMessage: (text) => {
        set((state) => {
          if (!state.streamingMessage) return state;
          return {
            streamingMessage: {
              ...state.streamingMessage,
              content: state.streamingMessage.content + text
            }
          };
        });
      },
      
      completeStreamingMessage: () => {
        set((state) => {
          if (!state.streamingMessage) return state;
          
          const message: ChatMessage = {
            id: state.streamingMessage.id,
            role: state.streamingMessage.role,
            content: state.streamingMessage.content,
            timestamp: Date.now(),
          };
          
          return {
            messages: [...state.messages, message],
            streamingMessage: null
          };
        });
      },
      
      // State setters
      setRecording: (isRecording) => set({ isRecording }),
      setPlaying: (isPlaying) => set({ isPlaying }),
      setLoading: (isLoading) => set({ isLoading }),
      setSpeaking: (isSpeaking) => set({ isSpeaking }),
      setProcessing: (isProcessing) => set({ isProcessing }),
      setWaitingToUpload: (isWaitingToUpload) => set({ isWaitingToUpload }),
      setSilenceProgress: (silenceProgress) => set({ silenceProgress }),
      setMicrophoneEnabled: (isMicrophoneEnabled) => set({ isMicrophoneEnabled }),
      setPendingAIMessage: (pendingAIMessage) => set({ pendingAIMessage }),
      setCallActive: (isCallActive) => set({ isCallActive }),
      setError: (error) => set({ error }),
      setLanguage: (language) => set({ language }),
      setVoiceId: (voiceId) => set({ voiceId }),
      
      // Conversation management
      startNewConversation: () => {
        set({
          conversationId: generateId(),
          isCallActive: true,
          messages: [],
          streamingMessage: null,
          error: null,
        });
      },
      
      endConversation: () => {
        set({
          conversationId: null,
          isCallActive: false,
          isRecording: false,
          isPlaying: false,
          isLoading: false,
          isSpeaking: false,
          isProcessing: false,
          isWaitingToUpload: false,
          silenceProgress: 0,
          isMicrophoneEnabled: true,
          pendingAIMessage: null,
          streamingMessage: null,
          error: null,
        });
      },
    }),
    {
      name: 'phone-ai-store',
    }
  )
);