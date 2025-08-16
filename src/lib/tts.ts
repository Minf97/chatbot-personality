import axios from 'axios';

export class TTSService {
  private static instance: TTSService;

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  public async textToSpeech(text: string): Promise<Blob> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for speech synthesis');
    }

    try {
      // console.log('TTS Service: Sending request for text:', text.substring(0, 50) + '...');
      
      const response = await axios.post('/api/tts', {
        text: text.trim()
      }, {
        responseType: 'blob',
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // console.log('TTS Service: Received response:', {
      //   status: response.status,
      //   dataType: typeof response.data,
      //   dataSize: response.data?.size || 0,
      //   hasData: !!response.data
      // });

      // More comprehensive check for valid audio data
      if (!response.data) {
        throw new Error('No audio data received from TTS service');
      }

      // Check if it's a valid Blob
      if (!(response.data instanceof Blob)) {
        console.error('TTS Service: Response data is not a Blob:', typeof response.data);
        throw new Error('Invalid audio data format from TTS service');
      }

      // Check blob size - but allow smaller files as they might still be valid
      if (response.data.size === 0) {
        throw new Error('Empty audio response from TTS service');
      }

      // console.log('TTS Service: Audio blob created successfully:', {
      //   size: response.data.size,
      //   type: response.data.type
      // });

      return response.data;
    } catch (error) {
      console.error('TTS Service Error Details:', {
        error,
        isAxiosError: axios.isAxiosError(error),
        message: error instanceof Error ? error.message : 'Unknown error'
      });

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const serverData = error.response?.data as unknown;
        const serverMessage = typeof serverData === 'string'
          ? serverData
          : serverData && typeof serverData === 'object' && 'error' in serverData
            ? String((serverData as { error?: unknown }).error)
            : serverData && typeof serverData === 'object' && 'message' in serverData
              ? String((serverData as { message?: unknown }).message)
              : '';

        if (status === 400) {
          throw new Error(serverMessage || 'Invalid text for speech synthesis');
        }
        if (status === 401) {
          throw new Error('TTS authentication failed - please check API key');
        }
        if (status === 500) {
          if (serverMessage && serverMessage.toLowerCase().includes('credentials')) {
            throw new Error('Minimax TTS 未配置：请在 .env.local 中设置 MINIMAX_API_KEY、MINIMAX_GROUP_ID 并重启服务');
          }
          throw new Error(serverMessage ? `TTS service temporarily unavailable: ${serverMessage}` : 'TTS service temporarily unavailable');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('TTS request timed out');
        }
        if (!error.response) {
          throw new Error('Network error - please check your connection');
        }
      }
      
      throw error instanceof Error ? error : new Error('Failed to convert text to speech');
    }
  }

  public async playAudio(audioBlob: Blob): Promise<void> {
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Invalid audio data');
    }

    // console.log('TTS Service: Starting audio playback:', {
    //   size: audioBlob.size,
    //   type: audioBlob.type
    // });

    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      const cleanup = () => {
        URL.revokeObjectURL(audioUrl);
      };

      // Set a timeout for audio playback
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Audio playback timed out'));
      }, 60000); // 60 seconds timeout

      const handleSuccess = () => {
        clearTimeout(timeoutId);
        cleanup();
        // console.log('TTS Service: Audio playback completed successfully');
        resolve();
      };

      const handleError = (error?: string) => {
        clearTimeout(timeoutId);
        cleanup();
        const errorMessage = error || 'Audio playback failed';
        console.error('TTS Service: Audio playback error:', errorMessage);
        reject(new Error(errorMessage));
      };

      // Set up event listeners
      audio.onended = handleSuccess;
      audio.onerror = () => handleError('Audio playback failed');
      
      audio.onloadstart = () => {
        // console.log('TTS Service: Audio loading started');
      };

      audio.oncanplaythrough = () => {
        // console.log('TTS Service: Audio can play through');
      };

      // Start playback
      audio.play().catch((playError) => {
        handleError(`Audio play failed: ${playError.message}`);
      });
    });
  }

  public async textToSpeechAndPlay(text: string): Promise<void> {
    const audioBlob = await this.textToSpeech(text);
    await this.playAudio(audioBlob);
  }

  public createAudioUrl(audioBlob: Blob): string {
    return URL.createObjectURL(audioBlob);
  }

  public revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const ttsService = TTSService.getInstance();