export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: unknown;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private static instance: SpeechRecognitionService;

  public static getInstance(): SpeechRecognitionService {
    if (!SpeechRecognitionService.instance) {
      SpeechRecognitionService.instance = new SpeechRecognitionService();
    }
    return SpeechRecognitionService.instance;
  }

  public isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  public initializeRecognition(options: SpeechRecognitionOptions = {}): SpeechRecognition | null {
    if (!this.isSupported()) {
      console.error('Speech recognition is not supported in this browser');
      return null;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionConstructor();

    // Configure recognition
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.lang = options.language ?? 'zh-CN';
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;

    return this.recognition;
  }

  public async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void,
    options: SpeechRecognitionOptions = {}
  ): Promise<void> {
    if (this.isListening) {
      console.log('Speech recognition already listening, ignoring duplicate call');
      return; // 静默返回而不是抛出错误
    }

    if (!this.recognition) {
      this.initializeRecognition(options);
    }

    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      this.recognition!.onstart = () => {
        this.isListening = true;
        onStart?.();
        resolve();
      };

      this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        const lastResult = results[results.length - 1];
        
        if (lastResult) {
          const transcript = lastResult[0].transcript;
          const confidence = lastResult[0].confidence;
          const isFinal = lastResult.isFinal;

          onResult({
            transcript: transcript.trim(),
            confidence,
            isFinal
          });
        }
      };

      this.recognition!.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        const errorMessage = `Speech recognition error: ${event.error}`;
        console.error(errorMessage, event);
        onError(errorMessage);
        reject(new Error(errorMessage));
      };

      this.recognition!.onend = () => {
        this.isListening = false;
        onEnd?.();
      };

      try {
        this.recognition!.start();
      } catch {
        this.isListening = false;
        const errorMessage = 'Failed to start speech recognition';
        onError(errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      // 清除所有事件监听器以防止残留事件
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onstart = null;
      this.recognition.onend = null;
      
      this.recognition.stop();
      this.isListening = false;
      
      console.log('🛑 Speech recognition stopped and event listeners cleared');
    }
  }

  public abortListening(): void {
    if (this.recognition && this.isListening) {
      // 清除所有事件监听器以防止残留事件
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onstart = null;
      this.recognition.onend = null;
      
      this.recognition.abort();
      this.isListening = false;
      
      console.log('🚫 Speech recognition aborted and event listeners cleared');
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getSupportedLanguages(): string[] {
    // Common languages supported by Web Speech API
    return [
      'zh-CN', // Chinese (Mandarin)
      'en-US', // English (US)
      'en-GB', // English (UK)
      'ja-JP', // Japanese
      'ko-KR', // Korean
      'fr-FR', // French
      'de-DE', // German
      'es-ES', // Spanish
      'pt-BR', // Portuguese (Brazil)
      'ru-RU', // Russian
    ];
  }
}

export const speechRecognitionService = SpeechRecognitionService.getInstance();