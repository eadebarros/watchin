import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseImdbCsv } from "@/lib/imdb";
import { computeEarnedBadges } from "@/lib/badges";
import { searchMovieByImdbId, searchMovieByTitle, type TmdbMovie } from "@/lib/tmdb";
import type { ImdbRating } from "@/lib/imdb";

type EnrichedParsed = ImdbRating & { tmdb?: TmdbMovie };

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo CSV é obrigatório" }, { status: 400 });
    }

    const csvText = await file.text();
    const parsed = parseImdbCsv(csvText);

    if (parsed.length === 0) {
      return NextResponse.json({ error: "Nenhum rating encontrado no CSV." }, { status: 400 });
    }

    // Upsert ratings (paralelo com limite)
    const BATCH = 10;
    const enrichedRatings: EnrichedParsed[] = [];
    for (let i = 0; i < parsed.length; i += BATCH) {
      const batch = parsed.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(async (r) => {
          try {
            const tmdb = r.imdbId
              ? await searchMovieByImdbId(r.imdbId)
              : await searchMovieByTitle(r.title, r.year);
            return { ...r, tmdb: tmdb ?? undefined };
          } catch {
            return { ...r };
          }
        })
      );
      enrichedRatings.push(...results);
    }

    await db.$transaction(
      enrichedRatings.map((r) =>
        db.rating.upsert({
          where: { userId_imdbId: { userId: session.user.id, imdbId: r.imdbId || r.title } },
          create: {
            userId: session.user.id,
            imdbId: r.imdbId || r.title,
            title: r.title,
            yourRating: r.yourRating,
            year: r.year,
            genres: r.tmdb?.genres?.map((g) => g.name) ?? r.genres ?? [],
            directors:
              r.tmdb?.credits?.crew?.filter((c) => c.job === "Director").map((c) => c.name) ??
              r.directors ?? [],
            runtime: r.tmdb?.runtime ?? r.runtime ?? null,
          },
          update: {
            yourRating: r.yourRating,
            genres: r.tmdb?.genres?.map((g) => g.name) ?? r.genres ?? [],
            directors:
              r.tmdb?.credits?.crew?.filter((c) => c.job === "Director").map((c) => c.name) ??
              r.directors ?? [],
            runtime: r.tmdb?.runtime ?? r.runtime ?? null,
          },
        })
      )
    );

    // Contar importações para badges de uso
    const importCount = await db.rating.count({ where: { userId: session.user.id } });
    const allRatings = await db.rating.findMany({ where: { userId: session.user.id } });

    // Badges baseados no total histórico, não só no import atual
    const userImportEvents = Math.ceil(importCount / 25); // proxy simples
    const newBadgeTypes = computeEarnedBadges(allRatings, userImportEvents);

    const existing = await db.badge.findMany({
      where: { userId: session.user.id },
      select: { type: true },
    });
    const existingTypes = new Set(existing.map((b) => b.type));
    const toCreate = newBadgeTypes.filter((t) => !existingTypes.has(t));

    if (toCreate.length > 0) {
      await db.badge.createMany({
        data: toCreate.map((type) => ({ userId: session.user.id, type })),
      });
    }

    const badges = await db.badge.findMany({ where: { userId: session.user.id } });

    return NextResponse.json({
      imported: enrichedRatings.length,
      newBadges: toCreate,
      badges,
      ratings: enrichedRatings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao importar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
