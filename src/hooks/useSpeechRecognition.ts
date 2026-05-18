"use client";

import { useMemo, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
  }
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const startListening = (lang = "ko-KR", onTranscript?: (text: string) => void) => {
    if (!isSupported) {
      setError("이 브라우저는 실시간 음성 인식을 지원하지 않습니다.");
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("음성 인식 객체를 초기화하지 못했습니다.");
      return;
    }

    setError(null);
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let merged = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results.item(i);
        if (!result || !result[0]) continue;
        merged += result[0].transcript;
      }
      const normalized = merged.trim();
      setTranscript(normalized);
      onTranscript?.(normalized);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`음성 인식 오류: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const resetTranscript = () => setTranscript("");

  return {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
