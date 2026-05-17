import { NextRequest, NextResponse } from "next/server";
import { parseImdbCsv } from "@/lib/imdb";
import { searchMovieByImdbId, searchMovieByTitle } from "@/lib/tmdb";
import type { EnrichedRating } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo CSV é obrigatório" }, { status: 400 });
    }

    const csvText = await file.text();
    const ratings = parseImdbCsv(csvText);

    if (ratings.length === 0) {
      return NextResponse.json(
        { error: "Nenhum rating encontrado no CSV. Certifique-se de exportar seus ratings do IMDb." },
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
    const message = error instanceof Error ? error.message : "Erro ao processar CSV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
