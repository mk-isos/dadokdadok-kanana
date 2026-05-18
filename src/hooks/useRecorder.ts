"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function pickMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  for (const mime of RECORDER_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return "";
}

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isSupported = useMemo(() => {
    return typeof window !== "undefined" && !!window.MediaRecorder;
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl("");
  };

  const startRecording = async () => {
    if (!isSupported) {
      setError("이 브라우저는 녹음을 지원하지 않습니다.");
      return;
    }

    try {
      setError(null);
      clearAudio();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const selectedMimeType = pickMimeType();
      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      setMimeType(recorder.mimeType || selectedMimeType || "audio/webm");
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const chunkType = recorder.mimeType || selectedMimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: chunkType });
        const nextAudioUrl = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(nextAudioUrl);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError("마이크 권한을 확인해주세요.");
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
    setIsRecording(false);
  };

  return {
    isSupported,
    isRecording,
    audioBlob,
    audioUrl,
    mimeType,
    error,
    startRecording,
    stopRecording,
    clearAudio,
  };
}
