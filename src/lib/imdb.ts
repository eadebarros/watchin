import { parseString } from "xml2js";
import { promisify } from "util";

const parseXml = promisify(parseString);

export interface ImdbRating {
  imdbId: string;
  title: string;
  yourRating: number;
  year: string;
  url: string;
  description: string;
}

export async function fetchImdbRatings(userId: string): Promise<ImdbRating[]> {
  const url = `https://rss.imdb.com/user/${userId}/ratings`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Watchin/1.0)" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Usuário do IMDb não encontrado. Verifique o User ID.");
    }
    if (response.status === 403) {
      throw new Error("Ratings do usuário são privados ou o User ID está incorreto.");
    }
    throw new Error(`Erro ao buscar ratings: ${response.status}`);
  }

  const xml = await response.text();

  if (!xml.includes("<rss") && !xml.includes("<?xml")) {
    throw new Error("Resposta inválida do IMDb. Verifique o User ID.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any = await parseXml(xml);
  const items = parsed?.rss?.channel?.[0]?.item ?? [];

  return items.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any): ImdbRating => {
      const link: string = item.link?.[0] ?? "";
      const imdbIdMatch = link.match(/title\/(tt\d+)/);
      const descRaw: string = item.description?.[0] ?? "";
      const ratingMatch = descRaw.match(/(\d+)\/10/);
      const yearMatch = descRaw.match(/\((\d{4})\)/);

      return {
        imdbId: imdbIdMatch?.[1] ?? "",
        title: item.title?.[0] ?? "Desconhecido",
        yourRating: ratingMatch ? parseInt(ratingMatch[1], 10) : 0,
        year: yearMatch?.[1] ?? "",
        url: link,
        description: descRaw.replace(/<[^>]*>/g, "").trim(),
      };
    }
  );
}
