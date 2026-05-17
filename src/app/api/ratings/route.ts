import { NextRequest, NextResponse } from "next/server";
import { fetchImdbRatings } from "@/lib/imdb";
import { searchMovieByImdbId, searchMovieByTitle } from "@/lib/tmdb";
import type { EnrichedRating } from "@/lib/ai";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")?.trim();

  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
  }

  if (!/^(ur\d+|p\.[a-z0-9]+)$/i.test(userId)) {
    return NextResponse.json(
      { error: "Formato inválido. Use seu User ID do IMDb (ex: ur12345678 ou p.abc123xyz)" },
      { status: 400 }
    );
  }

  try {
    const ratings = await fetchImdbRatings(userId);

    if (ratings.length === 0) {
      return NextResponse.json(
        { error: "Nenhum rating encontrado. Certifique-se de que seus ratings são públicos no IMDb." },
        { status: 404 }
      );
    }

    const enriched: EnrichedRating[] = await Promise.all(
      ratings.map(async (rating) => {
        try {
          const tmdb = rating.imdbId
            ? await searchMovieByImdbId(rating.imdbId)
            : await searchMovieByTitle(rating.title, rating.year);
          return { ...rating, tmdb: tmdb ?? undefined };
        } catch {
          return { ...rating };
        }
      })
    );

    return NextResponse.json({ ratings: enriched, total: enriched.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar ratings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
