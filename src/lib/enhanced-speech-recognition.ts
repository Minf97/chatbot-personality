import { SpeechRecognitionService, SpeechRecognitionOptions, SpeechRecognitionResult } from './speech-recognition';
import { usePhoneAIStore } from './store';

export class EnhancedSpeechRecognitionService {
  private speechService: SpeechRecognitionService;
  private silenceTimer: NodeJS.Timeout | null = null;
  private currentTranscript: string = '';
  private isWaitingForSilence = false;
  private static instance: EnhancedSpeechRecognitionService;
  
  // Configuration
  private readonly SILENCE_TIMEOUT = 4000; // 4 seconds
  private readonly MIN_TRANSCRIPT_LENGTH = 2; // Minimum characters to process

  constructor() {
    this.speechService = SpeechRecognitionService.getInstance();
  }

  public static getInstance(): EnhancedSpeechRecognitionService {
    if (!EnhancedSpeechRecognitionService.instance) {
      EnhancedSpeechRecognitionService.instance = new EnhancedSpeechRecognitionService();
    }
    return EnhancedSpeechRecognitionService.instance;
  }

  public isSupported(): boolean {
    return this.speechService.isSupported();
  }

  public async startListening(
    onFinalResult: (transcript: string) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void,
    options: SpeechRecognitionOptions = {}
  ): Promise<void> {
    const store = usePhoneAIStore.getState();
    
    // Clear any existing timer
    this.clearSilenceTimer();
    this.currentTranscript = '';
    this.isWaitingForSilence = false;

    const enhancedOptions = {
      ...options,
      continuous: true, // Keep listening continuously
      interimResults: true, // Get interim results to detect silence
    };

    return this.speechService.startListening(
      (result: SpeechRecognitionResult) => {
        console.log('Speech result:', {
          transcript: result.transcript,
          isFinal: result.isFinal,
          confidence: result.confidence
        });

        // Update current transcript
        if (result.transcript.trim()) {
          this.currentTranscript = result.transcript.trim();
        }

        // Handle speech detection
        if (result.transcript.trim() && result.transcript.length >= this.MIN_TRANSCRIPT_LENGTH) {
          // Reset the silence timer whenever we get speech
          this.resetSilenceTimer(() => {
            this.processFinalTranscript(onFinalResult);
          });

          // Update waiting state
          if (!this.isWaitingForSilence && this.currentTranscript) {
            this.isWaitingForSilence = true;
            store.setWaitingToUpload(true);
            console.log('Started waiting for silence, transcript:', this.currentTranscript);
          }
        }
      },
      (error: string) => {
        this.clearSilenceTimer();
        store.setWaitingToUpload(false);
        this.isWaitingForSilence = false;
        onError(error);
      },
      () => {
        onStart?.();
      },
      () => {
        this.clearSilenceTimer();
        store.setWaitingToUpload(false);
        this.isWaitingForSilence = false;
        onEnd?.();
      },
      enhancedOptions
    );
  }

  private resetSilenceTimer(callback: () => void): void {
    // Clear existing timer
    this.clearSilenceTimer();
    
    // Start new timer
    this.silenceTimer = setTimeout(() => {
      console.log('Silence timeout reached, processing transcript:', this.currentTranscript);
      callback();
    }, this.SILENCE_TIMEOUT);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private processFinalTranscript(onFinalResult: (transcript: string) => void): void {
    const store = usePhoneAIStore.getState();
    
    if (this.currentTranscript && this.currentTranscript.length >= this.MIN_TRANSCRIPT_LENGTH) {
      console.log('Processing final transcript:', this.currentTranscript);
      
      // Clear waiting state
      store.setWaitingToUpload(false);
      this.isWaitingForSilence = false;
      
      // Process the transcript
      const finalTranscript = this.currentTranscript;
      this.currentTranscript = '';
      
      onFinalResult(finalTranscript);
    } else {
      // No valid transcript, just clear waiting state
      store.setWaitingToUpload(false);
      this.isWaitingForSilence = false;
    }
  }

  public stopListening(): void {
    this.clearSilenceTimer();
    this.speechService.stopListening();
    
    const store = usePhoneAIStore.getState();
    store.setWaitingToUpload(false);
    this.isWaitingForSilence = false;
    this.currentTranscript = '';
  }

  public abortListening(): void {
    this.clearSilenceTimer();
    this.speechService.abortListening();
    
    const store = usePhoneAIStore.getState();
    store.setWaitingToUpload(false);
    this.isWaitingForSilence = false;
    this.currentTranscript = '';
  }

  public getIsListening(): boolean {
    return this.speechService.getIsListening();
  }

  public getIsWaitingForSilence(): boolean {
    return this.isWaitingForSilence;
  }

  public getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  public getSupportedLanguages(): string[] {
    return this.speechService.getSupportedLanguages();
  }
}

export const enhancedSpeechRecognitionService = EnhancedSpeechRecognitionService.getInstance();