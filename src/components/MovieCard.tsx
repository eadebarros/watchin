"use client";

import Image from "next/image";
import { posterUrl } from "@/lib/tmdb";
import type { EnrichedRating } from "@/lib/ai";

interface Props {
  rating: EnrichedRating;
}

export function MovieCard({ rating }: Props) {
  const { tmdb, title, yourRating, year, url } = rating;
  const poster = tmdb?.poster_path ? posterUrl(tmdb.poster_path) : null;
  const genres = tmdb?.genres?.slice(0, 2).map((g) => g.name) ?? [];

  const ratingColor =
    yourRating >= 8
      ? "text-emerald-400"
      : yourRating >= 6
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40"
    >
      <div className="relative w-full aspect-[2/3] bg-zinc-800">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-4xl">
            🎬
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/80 rounded-md px-2 py-1">
          <span className={`font-bold text-sm ${ratingColor}`}>{yourRating}</span>
          <span className="text-zinc-500 text-xs">/10</span>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="text-white text-sm font-medium leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
          {title}
        </p>
        <p className="text-zinc-500 text-xs">{tmdb?.release_date?.slice(0, 4) ?? year}</p>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {genres.map((g) => (
              <span key={g} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
