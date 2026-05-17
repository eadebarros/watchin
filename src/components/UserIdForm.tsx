"use client";

import { useState } from "react";

interface Props {
  onSubmit: (userId: string) => void;
  loading: boolean;
}

export function UserIdForm({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ur12345678"
          disabled={loading}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors font-mono disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold px-5 py-3 rounded-lg transition-colors shrink-0"
        >
          {loading ? "..." : "Analisar"}
        </button>
      </div>
      <p className="text-zinc-600 text-xs text-center">
        Encontre seu User ID em{" "}
        <span className="text-zinc-400">imdb.com/user/</span>
        <span className="text-amber-500/80">ur12345678</span>
        {" "}· Ratings devem ser públicos
      </p>
    </form>
  );
}
