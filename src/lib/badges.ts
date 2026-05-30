import type { Rating } from "@prisma/client";

export interface BadgeDef {
  type: string;
  label: string;
  description: string;
  emoji: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export const BADGE_DEFS: BadgeDef[] = [
  // Filmes assistidos
  { type: "WATCHED_10",   label: "Iniciante",       description: "Assistiu 10 filmes",    emoji: "🎟️",  tier: "bronze"   },
  { type: "WATCHED_50",   label: "Cinéfilo",         description: "Assistiu 50 filmes",    emoji: "🍿",  tier: "silver"   },
  { type: "WATCHED_100",  label: "Maratonista",      description: "Assistiu 100 filmes",   emoji: "🎬",  tier: "gold"     },
  { type: "WATCHED_250",  label: "Viciado",          description: "Assistiu 250 filmes",   emoji: "📽️",  tier: "gold"     },
  { type: "WATCHED_500",  label: "Arquivista",       description: "Assistiu 500 filmes",   emoji: "🏛️",  tier: "platinum" },
  { type: "WATCHED_1000", label: "Lenda do Cinema",  description: "Assistiu 1000 filmes",  emoji: "👑",  tier: "platinum" },

  // Ratings dados
  { type: "RATED_25",  label: "Crítico Iniciante", description: "Avaliou 25 filmes",   emoji: "✍️", tier: "bronze" },
  { type: "RATED_100", label: "Crítico",           description: "Avaliou 100 filmes",  emoji: "📝", tier: "silver" },
  { type: "RATED_500", label: "Roger Ebert",       description: "Avaliou 500 filmes",  emoji: "🖊️", tier: "gold"   },

  // Padrão de gosto
  { type: "HARSH_CRITIC",    label: "Exigente",    description: "Média de notas abaixo de 5.5", emoji: "🔪", tier: "silver" },
  { type: "GENEROUS_CRITIC", label: "Otimista",    description: "Média de notas acima de 8",    emoji: "🌟", tier: "silver" },
  { type: "BALANCED_CRITIC", label: "Equilibrado", description: "Média de notas entre 6 e 7.5", emoji: "⚖️", tier: "bronze" },

  // Especialistas de gênero
  { type: "HORROR_FAN",    label: "Amante do Terror",  description: "Assistiu 15+ filmes de terror",   emoji: "👻", tier: "silver" },
  { type: "DRAMA_FAN",     label: "Apreciador de Drama",description: "Assistiu 20+ dramas",            emoji: "🎭", tier: "silver" },
  { type: "SCIFI_FAN",     label: "Fã de Ficção Científica", description: "Assistiu 15+ filmes de ficção científica", emoji: "🚀", tier: "silver" },
  { type: "COMEDY_FAN",    label: "Ama Comédia",       description: "Assistiu 15+ comédias",           emoji: "😂", tier: "silver" },
  { type: "ACTION_FAN",    label: "Fã de Ação",        description: "Assistiu 20+ filmes de ação",     emoji: "💥", tier: "bronze" },
  { type: "THRILLER_FAN",  label: "Fã de Thriller",    description: "Assistiu 15+ thrillers",          emoji: "😰", tier: "silver" },
  { type: "ANIMATION_FAN", label: "Fã de Animação",    description: "Assistiu 10+ animações",          emoji: "🎨", tier: "bronze" },

  // Lealdade a diretor
  { type: "DIRECTOR_FAN",       label: "Fã de Diretor",   description: "Assistiu 5+ filmes do mesmo diretor",  emoji: "🎥", tier: "bronze" },
  { type: "DIRECTOR_DEVOTEE",   label: "Devoto",           description: "Assistiu 10+ filmes do mesmo diretor", emoji: "🙏", tier: "gold"   },

  // Uso do app
  { type: "FIRST_IMPORT", label: "Boas-Vindas",   description: "Primeira importação de ratings", emoji: "🌱", tier: "bronze" },
  { type: "REGULAR_USER", label: "Usuário Fiel",  description: "5+ importações realizadas",      emoji: "🔄", tier: "silver" },
];

export function computeEarnedBadges(ratings: Rating[], importCount: number): string[] {
  const earned: string[] = [];
  const total = ratings.length;
  const avg = total > 0 ? ratings.reduce((s, r) => s + r.yourRating, 0) / total : 0;

  // Contagem de filmes
  if (total >= 10)   earned.push("WATCHED_10");
  if (total >= 50)   earned.push("WATCHED_50");
  if (total >= 100)  earned.push("WATCHED_100");
  if (total >= 250)  earned.push("WATCHED_250");
  if (total >= 500)  earned.push("WATCHED_500");
  if (total >= 1000) earned.push("WATCHED_1000");

  // Ratings (todos são avaliações no CSV do IMDb)
  if (total >= 25)  earned.push("RATED_25");
  if (total >= 100) earned.push("RATED_100");
  if (total >= 500) earned.push("RATED_500");

  // Padrão de gosto
  if (avg < 5.5 && total >= 20)           earned.push("HARSH_CRITIC");
  if (avg > 8 && total >= 20)             earned.push("GENEROUS_CRITIC");
  if (avg >= 6 && avg <= 7.5 && total >= 20) earned.push("BALANCED_CRITIC");

  // Gêneros
  const genreCount = (genre: string) =>
    ratings.filter((r) => r.genres.some((g) => g.toLowerCase().includes(genre))).length;

  if (genreCount("horror")    >= 15) earned.push("HORROR_FAN");
  if (genreCount("drama")     >= 20) earned.push("DRAMA_FAN");
  if (genreCount("science fiction") >= 15 || genreCount("sci-fi") >= 15) earned.push("SCIFI_FAN");
  if (genreCount("comedy")    >= 15) earned.push("COMEDY_FAN");
  if (genreCount("action")    >= 20) earned.push("ACTION_FAN");
  if (genreCount("thriller")  >= 15) earned.push("THRILLER_FAN");
  if (genreCount("animation") >= 10) earned.push("ANIMATION_FAN");

  // Lealdade a diretor
  const directorCounts: Record<string, number> = {};
  for (const r of ratings) {
    for (const d of r.directors) {
      if (d) directorCounts[d] = (directorCounts[d] ?? 0) + 1;
    }
  }
  const maxDir = Math.max(0, ...Object.values(directorCounts));
  if (maxDir >= 5)  earned.push("DIRECTOR_FAN");
  if (maxDir >= 10) earned.push("DIRECTOR_DEVOTEE");

  // Uso do app
  if (importCount >= 1) earned.push("FIRST_IMPORT");
  if (importCount >= 5) earned.push("REGULAR_USER");

  return earned;
}

export function getBadgeDef(type: string): BadgeDef | undefined {
  return BADGE_DEFS.find((b) => b.type === type);
}

export const TIER_COLORS = {
  bronze:   "from-amber-700/20 to-amber-800/10 border-amber-700/30 text-amber-600",
  silver:   "from-zinc-400/20 to-zinc-500/10 border-zinc-400/30 text-zinc-300",
  gold:     "from-yellow-400/20 to-yellow-500/10 border-yellow-400/30 text-yellow-400",
  platinum: "from-cyan-400/20 to-cyan-500/10 border-cyan-400/30 text-cyan-300",
};
