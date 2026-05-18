"use client";

import { useRef, useState } from "react";

interface SpeakOptions {
  text: unknown;
  audioDataUrl?: string | null;
  rate?: number;
  pitch?: number;
  lang?: string;
}

function normalizeSpeakText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSpeakText(item)).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function sanitizeSpeakText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitBySentence(text: string): string[] {
  const parts: string[] = [];
  let buffer = "";

  for (const char of text) {
    buffer += char;
    if (/[.!?…]|[。！？]/u.test(char)) {
      const trimmed = buffer.trim();
      if (trimmed) parts.push(trimmed);
      buffer = "";
    }
  }

  const last = buffer.trim();
  if (last) parts.push(last);

  return parts.length > 0 ? parts : [text];
}

function splitLongChunk(chunk: string, maxLength: number): string[] {
  if (chunk.length <= maxLength) return [chunk];

  const words = chunk.split(" ");
  const result: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) result.push(current);

    if (word.length > maxLength) {
      for (let i = 0; i < word.length; i += maxLength) {
        result.push(word.slice(i, i + maxLength));
      }
      current = "";
      continue;
    }

    current = word;
  }

  if (current) result.push(current);
  return result;
}

function buildSpeechChunks(text: string, maxLength = 170): string[] {
  const sentenceChunks = splitBySentence(text);
  const chunks: string[] = [];

  for (const sentence of sentenceChunks) {
    if (sentence.length <= maxLength) {
      chunks.push(sentence);
      continue;
    }
    chunks.push(...splitLongChunk(sentence, maxLength));
  }

  return chunks;
}

function pickPreferredVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const normalizedLang = lang.toLowerCase();

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLang) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(normalizedLang.split("-")[0])) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ko")) ??
    voices[0] ??
    null
  );
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakRunRef = useRef(0);

  const stopSpeaking = () => {
    speakRunRef.current += 1;
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    audioRef.current = null;
    setIsSpeaking(false);
  };

  const speak = async ({ text, audioDataUrl, rate = 0.95, pitch = 1.02, lang = "ko-KR" }: SpeakOptions) => {
    const normalizedText = sanitizeSpeakText(normalizeSpeakText(text));
    if (!normalizedText) {
      return;
    }

    stopSpeaking();
    setError(null);

    const runId = speakRunRef.current;

    if (audioDataUrl) {
      try {
        const audio = new Audio(audioDataUrl);
        audioRef.current = audio;
        setIsSpeaking(true);
        audio.onended = () => {
          if (runId === speakRunRef.current) {
            setIsSpeaking(false);
          }
        };
        audio.onerror = () => {
          if (runId === speakRunRef.current) {
            setError("Kanana 음성을 재생하지 못했습니다. 브라우저 음성으로 전환하세요.");
            setIsSpeaking(false);
          }
        };
        await audio.play();
        return;
      } catch {
        if (runId === speakRunRef.current) {
          setError("Kanana 음성 재생에 실패했습니다. 브라우저 음성으로 시도합니다.");
        }
      }
    }

    if (!("speechSynthesis" in window)) {
      setError("이 브라우저는 음성 읽기를 지원하지 않습니다.");
      return;
    }

    const chunks = buildSpeechChunks(normalizedText);
    if (chunks.length === 0) {
      return;
    }

    const speakNext = (index: number) => {
      if (runId !== speakRunRef.current) {
        return;
      }

      const chunk = chunks[index];
      if (!chunk) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      const preferredVoice = pickPreferredVoice(lang);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.onend = () => {
        speakNext(index + 1);
      };
      utterance.onerror = () => {
        if (runId === speakRunRef.current) {
          setError("브라우저 음성 읽기에 실패했습니다.");
          setIsSpeaking(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    setIsSpeaking(true);
    speakNext(0);
  };

  return {
    isSpeaking,
    error,
    speak,
    stopSpeaking,
  };
}
