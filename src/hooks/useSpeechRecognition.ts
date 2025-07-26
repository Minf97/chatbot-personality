import { useState, useCallback, useRef, useEffect } from 'react';
import { speechRecognitionService, SpeechRecognitionOptions, SpeechRecognitionResult } from '@/lib/speech-recognition';

interface UseSpeechRecognitionOptions extends SpeechRecognitionOptions {
  onResult?: (result: SpeechRecognitionResult) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const finalTranscriptRef = useRef('');
  const optionsRef = useRef(options);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    setIsSupported(speechRecognitionService.isSupported());
  }, []);

  const handleResult = useCallback((result: SpeechRecognitionResult) => {
    const { transcript: newTranscript, isFinal } = result;
    
    if (isFinal) {
      finalTranscriptRef.current += newTranscript + ' ';
      setTranscript(finalTranscriptRef.current.trim());
      setInterimTranscript('');
      optionsRef.current.onFinalResult?.(newTranscript);
    } else {
      setInterimTranscript(newTranscript);
    }

    optionsRef.current.onResult?.(result);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsListening(false);
    optionsRef.current.onError?.(errorMessage);
  }, []);

  const handleStart = useCallback(() => {
    setIsListening(true);
    setError(null);
    optionsRef.current.onStart?.();
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
    optionsRef.current.onEnd?.();
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      const errorMessage = 'Speech recognition is not supported in this browser';
      setError(errorMessage);
      optionsRef.current.onError?.(errorMessage);
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    try {
      setError(null);
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');

      await speechRecognitionService.startListening(
        handleResult,
        handleError,
        handleStart,
        handleEnd,
        options
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start listening';
      handleError(errorMessage);
    }
  }, [isSupported, isListening, options, handleResult, handleError, handleStart, handleEnd]);

  const stopListening = useCallback(() => {
    if (isListening) {
      speechRecognitionService.stopListening();
    }
  }, [isListening]);

  const abortListening = useCallback(() => {
    if (isListening) {
      speechRecognitionService.abortListening();
      setIsListening(false);
      setInterimTranscript('');
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getSupportedLanguages = useCallback(() => {
    return speechRecognitionService.getSupportedLanguages();
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript: transcript,
    fullTranscript: transcript + (interimTranscript ? ` ${interimTranscript}` : ''),
    error,
    isSupported,
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
    clearError,
    getSupportedLanguages,
  };
};