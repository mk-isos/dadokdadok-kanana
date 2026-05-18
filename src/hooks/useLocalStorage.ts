"use client";

import { useState } from "react";

export function useLocalStorage(key: string, initialValue = "") {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      return window.localStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  const updateValue = (nextValue: string) => {
    setValue(nextValue);
    try {
      window.localStorage.setItem(key, nextValue);
    } catch {
      // 저장 실패 시에도 UI 상태는 유지
    }
  };

  return [value, updateValue] as const;
}
