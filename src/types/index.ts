export interface AudioChunk {
  data: Uint8Array;
  timestamp: number;
}

export interface VoiceSettings {
  voice_id: string;
  speed: number;
  vol: number;
  pitch: number;
}

export interface AudioSettings {
  sample_rate: number;
  bitrate: number;
  format: string;
  channel: number;
}

export interface TTSRequest {
  model: string;
  text: string;
  stream: boolean;
  voice_setting: VoiceSettings;
  audio_setting: AudioSettings;
}

export interface TTSResponse {
  data?: {
    audio?: string;
  };
  extra_info?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  audioUrl?: string;
}

export interface ConversationState {
  messages: ChatMessage[];
  isRecording: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface KimiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}