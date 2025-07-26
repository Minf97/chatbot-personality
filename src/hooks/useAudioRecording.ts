import { useState, useCallback, useRef } from 'react';
import { audioRecordingService } from '@/lib/audio-recording';

interface UseAudioRecordingOptions {
  onRecordingComplete?: (audioBlob: Blob) => void;
  onRecordingError?: (error: Error) => void;
  onRecordingStart?: () => void;
  onRecordingStopped?: () => void;
}

export const useAudioRecording = (options: UseAudioRecordingOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      const permission = await audioRecordingService.requestMicrophonePermission();
      setHasPermission(permission);
      
      if (!permission) {
        setError('Microphone permission is required for voice recording');
      }
      
      return permission;
    } catch {
      const errorMessage = 'Failed to request microphone permission';
      setError(errorMessage);
      setHasPermission(false);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Clean up previous audio URL
      if (audioUrl) {
        audioRecordingService.revokeAudioUrl(audioUrl);
        setAudioUrl(null);
      }

      // Check permission first
      if (hasPermission === null) {
        const permission = await requestPermission();
        if (!permission) return;
      } else if (hasPermission === false) {
        setError('Microphone permission is required');
        return;
      }

      await audioRecordingService.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      startTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      options.onRecordingStart?.();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setError(errorMessage);
      setIsRecording(false);
      options.onRecordingError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [hasPermission, audioUrl, options, requestPermission]);

  const stopRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      startTimeRef.current = null;

      const audioBlob = await audioRecordingService.stopRecording();
      setIsRecording(false);
      
      // Create audio URL for playback
      const url = audioRecordingService.createAudioUrl(audioBlob);
      setAudioUrl(url);

      options.onRecordingStopped?.();
      options.onRecordingComplete?.(audioBlob);
      
      return audioBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      setError(errorMessage);
      setIsRecording(false);
      options.onRecordingError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [options]);

  const cancelRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      startTimeRef.current = null;
      setRecordingDuration(0);

      await audioRecordingService.cancelRecording();
      setIsRecording(false);
      
      // Clean up audio URL
      if (audioUrl) {
        audioRecordingService.revokeAudioUrl(audioUrl);
        setAudioUrl(null);
      }

      options.onRecordingStopped?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel recording';
      setError(errorMessage);
      options.onRecordingError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [audioUrl, options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAudio = useCallback(() => {
    if (audioUrl) {
      audioRecordingService.revokeAudioUrl(audioUrl);
      setAudioUrl(null);
    }
    setRecordingDuration(0);
  }, [audioUrl]);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    hasPermission,
    error,
    audioUrl,
    recordingDuration,
    formattedDuration: formatDuration(recordingDuration),
    requestPermission,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
    clearAudio,
  };
};