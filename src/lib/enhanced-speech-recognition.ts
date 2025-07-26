import { SpeechRecognitionService, SpeechRecognitionOptions, SpeechRecognitionResult } from './speech-recognition';
import { usePhoneAIStore } from './store';

export class EnhancedSpeechRecognitionService {
  private speechService: SpeechRecognitionService;
  private silenceTimer: NodeJS.Timeout | null = null;
  private progressTimer: NodeJS.Timeout | null = null;
  private currentTranscript: string = '';
  private isWaitingForSilence = false;
  private shouldContinueListening = false; // Track if we should restart after end
  private currentCallbacks: any = null; // Store callbacks for restart
  private currentOptions: SpeechRecognitionOptions = {};
  private static instance: EnhancedSpeechRecognitionService;
  
  // Configuration
  private readonly SILENCE_TIMEOUT = 4000; // 4 seconds
  private readonly MIN_TRANSCRIPT_LENGTH = 2; // Minimum characters to process
  private readonly PROGRESS_UPDATE_INTERVAL = 50; // Update progress every 50ms

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
    
    console.log('🎙️ Starting enhanced speech recognition - clearing all previous state');
    
    // 强力清理所有可能的残留状态
    this.forceCleanup();
    
    // Clear any existing timer
    this.clearSilenceTimer();
    this.clearProgressTimer();
    this.currentTranscript = '';
    this.isWaitingForSilence = false;
    this.shouldContinueListening = true; // Set flag to continue listening

    // Store callbacks and options for potential restarts
    this.currentCallbacks = { onFinalResult, onError, onStart, onEnd };
    this.currentOptions = options;

    const enhancedOptions = {
      ...options,
      continuous: true, // Keep listening continuously
      interimResults: true, // Get interim results to detect silence
    };

    return this.speechService.startListening(
      (result: SpeechRecognitionResult) => {
        console.log('🗣️ Speech result received:', {
          transcript: result.transcript,
          isFinal: result.isFinal,
          confidence: result.confidence,
          length: result.transcript.length,
          currentTranscript: this.currentTranscript,
          isWaitingForSilence: this.isWaitingForSilence
        });

        // 检查是否是旧的残留结果
        if (!this.shouldContinueListening) {
          console.log('⚠️ Ignoring speech result - not supposed to be listening');
          return;
        }

        // Update current transcript
        if (result.transcript.trim()) {
          const newTranscript = result.transcript.trim();
          console.log(`📝 Updating transcript: "${this.currentTranscript}" -> "${newTranscript}"`);
          this.currentTranscript = newTranscript;
        }

        // Handle speech detection - respond to both interim and final results
        if (result.transcript.trim() && result.transcript.length >= this.MIN_TRANSCRIPT_LENGTH) {
          // Reset the silence timer whenever we get speech (both interim and final)
          this.resetSilenceTimer(() => {
            this.processFinalTranscript(onFinalResult);
          });

          // Update waiting state
          if (!this.isWaitingForSilence && this.currentTranscript) {
            this.isWaitingForSilence = true;
            store.setWaitingToUpload(true);
            console.log('Started waiting for silence, transcript:', this.currentTranscript);
          }
          
          // Special handling for final results - should also trigger waiting state
          if (result.isFinal && !this.isWaitingForSilence) {
            this.isWaitingForSilence = true;
            store.setWaitingToUpload(true);
            console.log('Final result detected, starting silence wait:', this.currentTranscript);
          }
        }
      },
      (error: string) => {
        this.clearSilenceTimer();
        this.clearProgressTimer();
        store.setWaitingToUpload(false);
        store.setSilenceProgress(0);
        this.isWaitingForSilence = false;
        
        // 不要立即停止监听，尝试重启（除非是致命错误）
        if (error.includes('not-allowed') || error.includes('service-not-allowed')) {
          this.shouldContinueListening = false;
          onError(error);
        } else {
          // 对于其他错误（如network、aborted等），尝试重启
          console.log('Speech recognition error, will try to restart:', error);
          setTimeout(() => {
            if (this.shouldContinueListening && this.currentCallbacks) {
              console.log('Attempting to restart after error...');
              this.startInternalListening();
            }
          }, 1000); // 等待1秒后重启
          onError(error);
        }
      },
      () => {
        onStart?.();
      },
      () => {
        console.log('Enhanced speech recognition ended');
        // If we should continue listening and haven't been manually stopped, restart
        if (this.shouldContinueListening && !this.isWaitingForSilence) {
          console.log('Restarting speech recognition to maintain continuous listening');
          setTimeout(() => {
            if (this.shouldContinueListening && this.currentCallbacks) {
              this.startInternalListening();
            }
          }, 100);
        } else {
          onEnd?.();
        }
      },
      enhancedOptions
    );
  }

  private async startInternalListening(): Promise<void> {
    if (!this.currentCallbacks || !this.shouldContinueListening) return;
    
    const { onFinalResult, onError, onStart, onEnd } = this.currentCallbacks;
    const enhancedOptions = {
      ...this.currentOptions,
      continuous: true,
      interimResults: true,
    };

    try {
      await this.speechService.startListening(
        (result: SpeechRecognitionResult) => {
          console.log('Speech result:', {
            transcript: result.transcript,
            isFinal: result.isFinal,
            confidence: result.confidence
          });

          if (result.transcript.trim()) {
            this.currentTranscript = result.transcript.trim();
          }

          if (result.transcript.trim() && result.transcript.length >= this.MIN_TRANSCRIPT_LENGTH) {
            this.resetSilenceTimer(() => {
              this.processFinalTranscript(onFinalResult);
            });

            const store = usePhoneAIStore.getState();
            if (!this.isWaitingForSilence && this.currentTranscript) {
              this.isWaitingForSilence = true;
              store.setWaitingToUpload(true);
              console.log('Started waiting for silence, transcript:', this.currentTranscript);
            }
            
            if (result.isFinal && !this.isWaitingForSilence) {
              this.isWaitingForSilence = true;
              store.setWaitingToUpload(true);
              console.log('Final result detected, starting silence wait:', this.currentTranscript);
            }
          }
        },
        (error: string) => {
          const store = usePhoneAIStore.getState();
          this.clearSilenceTimer();
          this.clearProgressTimer();
          store.setWaitingToUpload(false);
          store.setSilenceProgress(0);
          this.isWaitingForSilence = false;
          
          // 不要立即停止监听，尝试重启（除非是致命错误）
          if (error.includes('not-allowed') || error.includes('service-not-allowed')) {
            this.shouldContinueListening = false;
            onError(error);
          } else {
            // 对于其他错误（如network、aborted等），尝试重启
            console.log('Speech recognition error (internal), will try to restart:', error);
            setTimeout(() => {
              if (this.shouldContinueListening) {
                console.log('Attempting to restart after internal error...');
                this.startInternalListening();
              }
            }, 1000); // 等待1秒后重启
            onError(error);
          }
        },
        onStart,
        () => {
          console.log('Enhanced speech recognition ended (internal)');
          if (this.shouldContinueListening && !this.isWaitingForSilence) {
            console.log('Restarting speech recognition to maintain continuous listening (internal)');
            setTimeout(() => {
              if (this.shouldContinueListening) {
                this.startInternalListening();
              }
            }, 100);
          } else {
            onEnd?.();
          }
        },
        enhancedOptions
      );
    } catch (error) {
      console.error('Error restarting speech recognition:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private resetSilenceTimer(callback: () => void): void {
    // Clear existing timers
    this.clearSilenceTimer();
    this.clearProgressTimer();
    
    const store = usePhoneAIStore.getState();
    const startTime = Date.now();
    
    console.log('Starting silence timer and progress tracking');
    
    // Start progress timer for UI updates
    this.progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / this.SILENCE_TIMEOUT) * 100, 100);
      store.setSilenceProgress(progress);
      
      if (progress >= 100) {
        this.clearProgressTimer();
      }
    }, this.PROGRESS_UPDATE_INTERVAL);
    
    // Start silence timer
    this.silenceTimer = setTimeout(() => {
      console.log('Silence timeout reached, processing transcript:', this.currentTranscript);
      this.clearProgressTimer();
      store.setSilenceProgress(0);
      callback();
    }, this.SILENCE_TIMEOUT);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private clearProgressTimer(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private processFinalTranscript(onFinalResult: (transcript: string) => void): void {
    const store = usePhoneAIStore.getState();
    
    if (this.currentTranscript && this.currentTranscript.length >= this.MIN_TRANSCRIPT_LENGTH) {
      console.log('Processing final transcript:', this.currentTranscript);
      
      // Clear waiting state and progress
      store.setWaitingToUpload(false);
      store.setSilenceProgress(0);
      this.isWaitingForSilence = false;
      
      // Process the transcript
      const finalTranscript = this.currentTranscript;
      this.currentTranscript = '';
      
      onFinalResult(finalTranscript);
    } else {
      // No valid transcript, just clear waiting state
      console.log('⚠️ Transcript too short or empty, clearing and ignoring:', this.currentTranscript);
      store.setWaitingToUpload(false);
      store.setSilenceProgress(0);
      this.isWaitingForSilence = false;
      this.currentTranscript = ''; // 重要：清除无效的transcript
    }
  }

  public stopListening(): void {
    this.shouldContinueListening = false; // Stop auto-restart
    this.currentCallbacks = null; // Clear callbacks
    this.clearSilenceTimer();
    this.clearProgressTimer();
    this.speechService.stopListening();
    
    const store = usePhoneAIStore.getState();
    store.setWaitingToUpload(false);
    store.setSilenceProgress(0);
    this.isWaitingForSilence = false;
    this.currentTranscript = '';
  }

  public abortListening(): void {
    this.shouldContinueListening = false; // Stop auto-restart
    this.currentCallbacks = null; // Clear callbacks
    this.clearSilenceTimer();
    this.clearProgressTimer();
    this.speechService.abortListening();
    
    const store = usePhoneAIStore.getState();
    store.setWaitingToUpload(false);
    store.setSilenceProgress(0);
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

  // 强力清理方法，确保完全重置状态
  private forceCleanup(): void {
    console.log('🧹 Force cleanup - clearing all speech recognition state');
    
    // 停止现有的语音识别
    if (this.speechService.getIsListening()) {
      this.speechService.abortListening();
    }
    
    // 清理所有定时器
    this.clearSilenceTimer();
    this.clearProgressTimer();
    
    // 重置所有内部状态
    this.currentTranscript = '';
    this.isWaitingForSilence = false;
    this.shouldContinueListening = false;
    this.currentCallbacks = null;
    this.currentOptions = {};
    
    // 重置store状态
    const store = usePhoneAIStore.getState();
    store.setWaitingToUpload(false);
    store.setSilenceProgress(0);
    
    console.log('✅ Force cleanup completed');
  }
}

export const enhancedSpeechRecognitionService = EnhancedSpeechRecognitionService.getInstance();