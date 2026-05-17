const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime: number;
  credits?: {
    crew: { job: string; name: string }[];
    cast: { name: string; order: number }[];
  };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) throw new Error("TMDB_API_KEY não configurada");
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "pt-BR");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${path}`);
  return res.json();
}

export async function searchMovieByImdbId(imdbId: string): Promise<TmdbMovie | null> {
  const result = await tmdbFetch<{ movie_results: TmdbMovie[] }>(`/find/${imdbId}`, {
    external_source: "imdb_id",
  });
  const movie = result.movie_results?.[0];
  if (!movie) return null;
  return tmdbFetch<TmdbMovie>(`/movie/${movie.id}`, { append_to_response: "credits" });
}

export async function searchMovieByTitle(
  title: string,
  year?: string
): Promise<TmdbMovie | null> {
  const params: Record<string, string> = { query: title };
  if (year) params.year = year;
  const result = await tmdbFetch<{ results: TmdbMovie[] }>("/search/movie", params);
  const movie = result.results?.[0];
  if (!movie) return null;
  return tmdbFetch<TmdbMovie>(`/movie/${movie.id}`, { append_to_response: "credits" });
}

export function posterUrl(path: string | null, size: "w342" | "w780" = "w342"): string {
  if (!path) return "/placeholder-poster.svg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
