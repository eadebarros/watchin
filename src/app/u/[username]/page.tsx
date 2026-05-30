import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BadgeCard } from "@/components/BadgeCard";
import { BADGE_DEFS } from "@/lib/badges";
import Image from "next/image";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    include: {
      badges: { orderBy: { earnedAt: "asc" } },
      ratings: true,
    },
  });

  if (!user) notFound();

  await db.user.update({ where: { id: user.id }, data: { profileViews: { increment: 1 } } });

  const total = user.ratings.length;
  const avg = total > 0
    ? (user.ratings.reduce((s, r) => s + r.yourRating, 0) / total).toFixed(1)
    : "–";

  const topGenres = (() => {
    const counts: Record<string, number> = {};
    for (const r of user.ratings) {
      for (const g of r.genres) counts[g] = (counts[g] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g]) => g);
  })();

  const earnedTypes = new Set(user.badges.map((b) => b.type));
  const earnedBadges = user.badges;
  const lockedBadges = BADGE_DEFS.filter((d) => !earnedTypes.has(d.type));

  const memberSince = user.createdAt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Nav */}
        <a href="/" className="text-amber-500 font-bold text-xl mb-10 block">watchin</a>

        {/* Profile header */}
        <div className="flex items-start gap-5 mb-10">
          {user.image ? (
            <Image src={user.image} alt="" width={72} height={72} className="rounded-full shrink-0" />
          ) : (
            <div className="w-18 h-18 bg-zinc-800 rounded-full flex items-center justify-center text-3xl shrink-0">🎬</div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{user.name ?? username}</h1>
            <p className="text-zinc-500 text-sm">@{username} · membro desde {memberSince}</p>
            {user.bio && <p className="text-zinc-400 mt-2 text-sm">{user.bio}</p>}
            <p className="text-zinc-600 text-xs mt-1">{user.profileViews} visitas ao perfil</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Filmes", value: total },
            { label: "Nota média", value: avg },
            { label: "Badges", value: earnedBadges.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{value}</p>
              <p className="text-zinc-500 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Top genres */}
        {topGenres.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm text-zinc-500 uppercase tracking-wider mb-3">Gêneros favoritos</h2>
            <div className="flex flex-wrap gap-2">
              {topGenres.map((g) => (
                <span key={g} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm px-3 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">
              Badges conquistados
              <span className="ml-2 text-zinc-500 text-base font-normal">({earnedBadges.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {earnedBadges.map((b) => (
                <BadgeCard key={b.type} type={b.type} earnedAt={b.earnedAt} />
              ))}
            </div>
          </section>
        )}

        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-zinc-600">
              Badges disponíveis
              <span className="ml-2 text-base font-normal">({lockedBadges.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {lockedBadges.map((d) => (
                <BadgeCard key={d.type} type={d.type} locked />
              ))}
            </div>
          </section>
        )}

        <footer className="mt-16 text-center text-zinc-700 text-xs">
          <p>watchin · <a href="/login" className="hover:text-zinc-500">Criar meu perfil</a></p>
        </footer>
      </div>
    </main>
  );
}
