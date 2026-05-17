import { NextRequest, NextResponse } from "next/server";
import { getRecommendations, type EnrichedRating } from "@/lib/claude";
import { searchMovieByTitle } from "@/lib/tmdb";

export async function POST(request: NextRequest) {
  try {
    const { ratings }: { ratings: EnrichedRating[] } = await request.json();

    if (!ratings || ratings.length === 0) {
      return NextResponse.json({ error: "Ratings são obrigatórios" }, { status: 400 });
    }

    const result = await getRecommendations(ratings);

    const enrichedRecs = await Promise.all(
      result.recommendations.map(async (rec) => {
        try {
          const tmdb = await searchMovieByTitle(rec.title, rec.year);
          return { ...rec, tmdb: tmdb ?? undefined };
        } catch {
          return rec;
        }
      })
    );

    return NextResponse.json({ ...result, recommendations: enrichedRecs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar recomendações";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
