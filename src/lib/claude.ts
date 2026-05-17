import Anthropic from "@anthropic-ai/sdk";
import type { ImdbRating } from "./imdb";
import type { TmdbMovie } from "./tmdb";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface EnrichedRating extends ImdbRating {
  tmdb?: TmdbMovie;
}

export interface Recommendation {
  title: string;
  year: string;
  imdbId?: string;
  reason: string;
  matchScore: number;
  genres: string[];
  director?: string;
}

export interface RecommendationResult {
  profile: string;
  recommendations: Recommendation[];
}

export async function getRecommendations(
  ratings: EnrichedRating[]
): Promise<RecommendationResult> {
  const ratingsSummary = ratings
    .map((r) => {
      const genres = r.tmdb?.genres?.map((g) => g.name).join(", ") ?? "desconhecido";
      const director =
        r.tmdb?.credits?.crew?.find((c) => c.job === "Director")?.name ?? "desconhecido";
      return `- "${r.title}" (${r.year}): nota ${r.yourRating}/10 | Gêneros: ${genres} | Diretor: ${director}`;
    })
    .join("\n");

  const prompt = `Você é um crítico de cinema especialista e cinéfilo apaixonado. Analise os ratings de filmes abaixo e faça recomendações altamente personalizadas.

RATINGS DO USUÁRIO:
${ratingsSummary}

Com base nesses ratings:

1. Identifique padrões de gosto: gêneros favoritos, diretores preferidos, temas recorrentes nos filmes bem avaliados (8+), e o que o usuário claramente não curte (notas baixas).

2. Recomende EXATAMENTE 6 filmes que o usuário provavelmente vai adorar mas ainda não viu (não repita filmes da lista de ratings). Priorize filmes menos óbvios e com profundidade.

Responda EXCLUSIVAMENTE em JSON válido neste formato:
{
  "profile": "Parágrafo conciso descrevendo o perfil cinematográfico do usuário em português brasileiro, destacando seus gostos e padrões",
  "recommendations": [
    {
      "title": "Título do Filme em Inglês",
      "year": "AAAA",
      "reason": "Por que especificamente este usuário vai amar este filme, conectando com os filmes que ele já avaliou bem (2-3 frases em português)",
      "matchScore": 95,
      "genres": ["Gênero1", "Gênero2"],
      "director": "Nome do Diretor"
    }
  ]
}

O matchScore deve ser um número de 70-99 representando o quanto você acredita que o usuário vai gostar.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Resposta inesperada do Claude");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Formato de resposta inválido");

  return JSON.parse(jsonMatch[0]) as RecommendationResult;
}
