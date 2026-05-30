import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BADGE_DEFS } from "@/lib/badges";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const featuredBadges = BADGE_DEFS.filter((b) =>
    ["WATCHED_100", "ROGER_EBERT", "HORROR_FAN", "DIRECTOR_DEVOTEE", "HARSH_CRITIC", "WATCHED_500"].includes(b.type)
  ).slice(0, 6);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4">
            <span className="text-amber-500">watchin</span>
          </h1>
          <p className="text-zinc-400 text-xl max-w-xl mx-auto mb-8">
            Importe seus ratings do IMDb, descubra seu perfil de cinéfilo e ganhe badges pelo que você assiste.
          </p>
          <Link
            href="/login"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
          >
            Criar meu perfil
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 text-center">
          {[
            { emoji: "📊", title: "Perfil público", desc: "URL própria com suas stats, gêneros favoritos e histórico" },
            { emoji: "🏅", title: "Sistema de badges", desc: "Desbloqueie conquistas baseadas em filmes assistidos e hábitos" },
            { emoji: "🤖", title: "Recomendações com IA", desc: "Gemini analisa seus ratings e sugere o próximo filme ideal" },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-4xl mb-3">{emoji}</p>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-zinc-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>

        {/* Badge preview */}
        <div className="mb-16">
          <h2 className="text-center text-zinc-500 text-sm uppercase tracking-wider mb-6">Alguns badges para ganhar</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BADGE_DEFS.slice(0, 6).map((b) => (
              <div key={b.type} className="flex flex-col items-center gap-1 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center opacity-60">
                <span className="text-2xl">{b.emoji}</span>
                <span className="text-xs text-zinc-400">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
            Entrar com Google →
          </Link>
        </div>
      </div>
    </main>
  );
}
