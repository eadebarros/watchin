"use client";

import { useState } from "react";
import { UserIdForm } from "@/components/UserIdForm";
import { MovieCard } from "@/components/MovieCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import type { EnrichedRating, RecommendationResult, Recommendation } from "@/lib/ai";
import type { TmdbMovie } from "@/lib/tmdb";

type Step = "idle" | "fetching-ratings" | "fetching-recs" | "done" | "error";

export default function Home() {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<EnrichedRating[]>([]);
  const [result, setResult] = useState<
    (RecommendationResult & { recommendations: (Recommendation & { tmdb?: TmdbMovie })[] }) | null
  >(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handleSubmit = async (userId: string) => {
    setError(null);
    setRatings([]);
    setResult(null);
    setCurrentUserId(userId);
    setStep("fetching-ratings");

    try {
      const ratingsRes = await fetch(`/api/ratings?userId=${encodeURIComponent(userId)}`);
      const ratingsData = await ratingsRes.json();

      if (!ratingsRes.ok) {
        throw new Error(ratingsData.error ?? "Erro ao buscar ratings");
      }

      setRatings(ratingsData.ratings);
      setStep("fetching-recs");

      const recsRes = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings: ratingsData.ratings }),
      });
      const recsData = await recsRes.json();

      if (!recsRes.ok) {
        throw new Error(recsData.error ?? "Erro ao gerar recomendações");
      }

      setResult(recsData);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setStep("error");
    }
  };

  const isLoading = step === "fetching-ratings" || step === "fetching-recs";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            <span className="text-amber-500">watchin</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Analise seus ratings do IMDb e descubra seu próximo filme favorito
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col items-center gap-6 mb-16">
          <UserIdForm onSubmit={handleSubmit} loading={isLoading} />

          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-sm">
                {step === "fetching-ratings"
                  ? "Buscando seus ratings no IMDb..."
                  : "Claude está analisando seus gostos..."}
              </span>
            </div>
          )}

          {step === "error" && error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm max-w-md text-center">
              {error}
            </div>
          )}
        </div>

        {/* Ratings grid */}
        {ratings.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                Seus ratings recentes
                <span className="ml-2 text-zinc-500 text-base font-normal">
                  ({ratings.length} filmes)
                </span>
              </h2>
              {currentUserId && (
                <a
                  href={`https://www.imdb.com/user/${currentUserId}/ratings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 text-sm hover:text-amber-400 transition-colors"
                >
                  Ver no IMDb →
                </a>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ratings.map((rating) => (
                <MovieCard key={rating.imdbId || rating.title} rating={rating} />
              ))}
            </div>
          </section>
        )}

        {/* Profile + Recommendations */}
        {result && (
          <section>
            <div className="bg-gradient-to-r from-amber-500/10 to-zinc-900 border border-amber-500/20 rounded-xl p-6 mb-8">
              <p className="text-sm text-amber-500 font-medium mb-2 uppercase tracking-wider">
                Seu perfil cinematográfico
              </p>
              <p className="text-zinc-300 leading-relaxed">{result.profile}</p>
            </div>

            <h2 className="text-xl font-semibold mb-6">Recomendado para você</h2>
            <div className="flex flex-col gap-4">
              {result.recommendations.map((rec, i) => (
                <RecommendationCard key={rec.title} rec={rec} rank={i + 1} />
              ))}
            </div>
          </section>
        )}

        {step === "idle" && (
          <div className="text-center text-zinc-700 mt-8">
            <p className="text-6xl mb-4">🎬</p>
            <p>Digite seu IMDb User ID para começar</p>
          </div>
        )}

        <footer className="mt-16 text-center text-zinc-700 text-xs">
          <p>Dados via IMDb RSS · TMDB · Claude AI</p>
        </footer>
      </div>
    </main>
  );
}
