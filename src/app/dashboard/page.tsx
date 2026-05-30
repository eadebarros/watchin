"use client";

import { useEffect, useState } from "react";
import { CsvUpload } from "@/components/CsvUpload";
import { MovieCard } from "@/components/MovieCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import { BadgeCard } from "@/components/BadgeCard";
import type { EnrichedRating, RecommendationResult, Recommendation } from "@/lib/ai";
import type { TmdbMovie } from "@/lib/tmdb";
import type { Badge } from "@prisma/client";
import { BADGE_DEFS } from "@/lib/badges";

type Step = "idle" | "importing" | "fetching-recs" | "done" | "error";

interface ImportResult {
  imported: number;
  newBadges: string[];
  badges: Badge[];
  ratings: (EnrichedRating & { tmdb?: TmdbMovie })[];
}

export default function Dashboard() {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [result, setResult] = useState<
    (RecommendationResult & { recommendations: (Recommendation & { tmdb?: TmdbMovie })[] }) | null
  >(null);
  const [user, setUser] = useState<{ name?: string; username?: string; image?: string } | null>(null);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then(setUser).catch(() => null);
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    setImportResult(null);
    setResult(null);
    setStep("importing");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao importar");

      setImportResult(data);
      setStep("fetching-recs");

      const recsRes = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings: data.ratings }),
      });
      const recsData = await recsRes.json();
      if (!recsRes.ok) throw new Error(recsData.error ?? "Erro ao gerar recomendações");

      setResult(recsData);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setStep("error");
    }
  };

  const isLoading = step === "importing" || step === "fetching-recs";
  const earnedTypes = new Set(importResult?.badges.map((b) => b.type) ?? []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-amber-500">watchin</h1>
          <div className="flex items-center gap-3">
            {user?.username && (
              <a href={`/u/${user.username}`} className="text-zinc-400 text-sm hover:text-white transition-colors">
                /u/{user.username}
              </a>
            )}
            {user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-zinc-600 text-sm hover:text-zinc-400 transition-colors">
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* Import section */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <CsvUpload onFile={handleFile} loading={isLoading} />

          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-sm">
                {step === "importing" ? "Salvando seus ratings..." : "Gemini está analisando seus gostos..."}
              </span>
            </div>
          )}

          {step === "error" && error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm max-w-md text-center">
              {error}
            </div>
          )}
        </div>

        {/* New badges notification */}
        {importResult && importResult.newBadges.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 text-center">
            <p className="text-amber-400 font-semibold mb-1">
              🎉 {importResult.newBadges.length} novo{importResult.newBadges.length > 1 ? "s" : ""} badge{importResult.newBadges.length > 1 ? "s" : ""} desbloqueado{importResult.newBadges.length > 1 ? "s" : ""}!
            </p>
            <p className="text-zinc-400 text-sm">{importResult.newBadges.map(t => BADGE_DEFS.find(b => b.type === t)?.label).join(" · ")}</p>
          </div>
        )}

        {/* Badges grid */}
        {importResult && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Seus badges</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {BADGE_DEFS.map((def) => (
                <BadgeCard key={def.type} type={def.type}
                  earnedAt={importResult.badges.find(b => b.type === def.type)?.earnedAt}
                  locked={!earnedTypes.has(def.type)} />
              ))}
            </div>
          </section>
        )}

        {/* Ratings grid */}
        {importResult && importResult.ratings.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">
              Seus ratings
              <span className="ml-2 text-zinc-500 text-base font-normal">({importResult.imported} filmes)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {importResult.ratings.map((r) => (
                <MovieCard key={r.imdbId || r.title} rating={r} />
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {result && (
          <section>
            <div className="bg-gradient-to-r from-amber-500/10 to-zinc-900 border border-amber-500/20 rounded-xl p-6 mb-8">
              <p className="text-sm text-amber-500 font-medium mb-2 uppercase tracking-wider">Seu perfil cinematográfico</p>
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
          <div className="text-center text-zinc-700 mt-4">
            <p className="text-6xl mb-4">🎬</p>
            <p>Importe seu CSV para ver seus badges e recomendações</p>
          </div>
        )}

        <footer className="mt-16 text-center text-zinc-700 text-xs">
          <p>watchin · IMDb · TMDB · Gemini AI</p>
        </footer>
      </div>
    </main>
  );
}
