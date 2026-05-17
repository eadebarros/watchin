export interface ImdbRating {
  imdbId: string;
  title: string;
  yourRating: number;
  year: string;
  url: string;
  description: string;
  genres?: string[];
  directors?: string[];
  runtime?: number;
}

export function parseImdbCsv(csvText: string): ImdbRating[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV vazio ou inválido");

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);

  const idCol = col("Const");
  const ratingCol = col("Your Rating");
  const titleCol = col("Title");
  const yearCol = col("Year");
  const genreCol = col("Genres");
  const directorCol = col("Directors");
  const runtimeCol = col("Runtime (mins)");

  if (idCol === -1 || ratingCol === -1 || titleCol === -1) {
    throw new Error("Formato de CSV inválido. Exporte diretamente do IMDb (Seus ratings → ··· → Exportar).");
  }

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const cols = parseCsvLine(line);
      const imdbId = cols[idCol]?.trim() ?? "";
      return {
        imdbId,
        title: cols[titleCol]?.trim() ?? "Desconhecido",
        yourRating: parseInt(cols[ratingCol] ?? "0", 10),
        year: cols[yearCol]?.trim() ?? "",
        url: imdbId ? `https://www.imdb.com/title/${imdbId}/` : "",
        description: "",
        genres: cols[genreCol]?.split(",").map((g) => g.trim()).filter(Boolean) ?? [],
        directors: cols[directorCol]?.split(",").map((d) => d.trim()).filter(Boolean) ?? [],
        runtime: runtimeCol !== -1 ? parseInt(cols[runtimeCol] ?? "0", 10) || undefined : undefined,
      };
    })
    .filter((r) => r.yourRating > 0);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
