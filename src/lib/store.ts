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
      
      // State setters - optimized to prevent unnecessary re-renders
      setRecording: (isRecording) => set((state) => 
        state.isRecording === isRecording ? state : { isRecording }
      ),
      setPlaying: (isPlaying) => set((state) => 
        state.isPlaying === isPlaying ? state : { isPlaying }
      ),
      setLoading: (isLoading) => set((state) => 
        state.isLoading === isLoading ? state : { isLoading }
      ),
      setSpeaking: (isSpeaking) => set((state) => 
        state.isSpeaking === isSpeaking ? state : { isSpeaking }
      ),
      setProcessing: (isProcessing) => set((state) => 
        state.isProcessing === isProcessing ? state : { isProcessing }
      ),
      setWaitingToUpload: (isWaitingToUpload) => set((state) => 
        state.isWaitingToUpload === isWaitingToUpload ? state : { isWaitingToUpload }
      ),
      setSilenceProgress: (silenceProgress) => set((state) => 
        state.silenceProgress === silenceProgress ? state : { silenceProgress }
      ),
      setMicrophoneEnabled: (isMicrophoneEnabled) => set((state) => 
        state.isMicrophoneEnabled === isMicrophoneEnabled ? state : { isMicrophoneEnabled }
      ),
      setPendingAIMessage: (pendingAIMessage) => set((state) => 
        state.pendingAIMessage === pendingAIMessage ? state : { pendingAIMessage }
      ),
      setCallActive: (isCallActive) => set((state) => 
        state.isCallActive === isCallActive ? state : { isCallActive }
      ),
      setError: (error) => set((state) => 
        state.error === error ? state : { error }
      ),
      setLanguage: (language) => set((state) => 
        state.language === language ? state : { language }
      ),
      setVoiceId: (voiceId) => set((state) => 
        state.voiceId === voiceId ? state : { voiceId }
      ),
      
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