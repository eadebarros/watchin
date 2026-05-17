"use client";

import Image from "next/image";
import { posterUrl } from "@/lib/tmdb";
import type { Recommendation } from "@/lib/ai";
import type { TmdbMovie } from "@/lib/tmdb";

interface Props {
  rec: Recommendation & { tmdb?: TmdbMovie };
  rank: number;
}

export function RecommendationCard({ rec, rank }: Props) {
  const poster = rec.tmdb?.poster_path ? posterUrl(rec.tmdb.poster_path, "w342") : null;

  return (
    <div className="flex gap-4 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-amber-500/30 transition-all hover:shadow-lg hover:shadow-amber-500/5">
      <div className="relative w-24 sm:w-32 shrink-0 bg-zinc-800">
        {poster ? (
          <Image
            src={poster}
            alt={rec.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-3xl">
            🎬
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 py-4 pr-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-zinc-500 text-xs font-mono">#{rank}</span>
            <h3 className="text-white font-semibold leading-tight">{rec.title}</h3>
            <p className="text-zinc-500 text-sm">
              {rec.year}
              {rec.director && ` · ${rec.director}`}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-center bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
            <span className="text-amber-400 font-bold text-lg leading-none">{rec.matchScore}</span>
            <span className="text-amber-500/60 text-xs">match</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {rec.genres.slice(0, 3).map((g) => (
            <span key={g} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              {g}
            </span>
          ))}
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed">{rec.reason}</p>
        {rec.tmdb?.overview && (
          <p className="text-zinc-600 text-xs leading-relaxed line-clamp-2">{rec.tmdb.overview}</p>
        )}
      </div>
    </div>
  );
}
