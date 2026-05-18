"use client";

import { useState } from "react";

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor="kanana-api-key" className="text-sm font-semibold text-slate-700">
        Kanana API Key
      </label>
      <div className="flex gap-2">
        <input
          id="kanana-api-key"
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="sk-..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {show ? "숨기기" : "보이기"}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        API Key는 브라우저 localStorage에만 저장되며 서버에 영구 저장하지 않습니다.
      </p>
    </div>
  );
}
