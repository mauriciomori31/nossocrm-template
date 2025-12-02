import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasRecognitionSupport: boolean;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('[SpeechRecognition] API detected, initializing...');

      interface WindowWithSpeechRecognition extends Window {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      }

      const win = window as WindowWithSpeechRecognition;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn('[SpeechRecognition] Constructor not available');
        return;
      }

      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';

      recognitionInstance.onstart = () => {
        console.log('[SpeechRecognition] Started listening');
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        console.log('[SpeechRecognition] Transcript:', currentTranscript);
        setTranscript(currentTranscript);
      };

      recognitionInstance.onend = () => {
        console.log('[SpeechRecognition] Ended');
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[SpeechRecognition] Error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
      console.log('[SpeechRecognition] Initialized successfully');
    } else {
      console.warn('[SpeechRecognition] API not supported in this browser');
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport: !!recognition,
  };
};
