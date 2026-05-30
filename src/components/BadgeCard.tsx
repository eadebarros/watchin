import { getBadgeDef, TIER_COLORS } from "@/lib/badges";

interface Props {
  type: string;
  earnedAt?: Date | string;
  locked?: boolean;
}

export function BadgeCard({ type, earnedAt, locked = false }: Props) {
  const def = getBadgeDef(type);
  if (!def) return null;

  const colors = TIER_COLORS[def.tier];

  return (
    <div
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-xl border bg-gradient-to-b text-center
        ${locked ? "opacity-30 grayscale" : colors}
      `}
    >
      <span className="text-3xl">{def.emoji}</span>
      <div>
        <p className="font-semibold text-sm leading-tight">{def.label}</p>
        <p className="text-xs opacity-70 mt-0.5">{def.description}</p>
      </div>
      {!locked && earnedAt && (
        <p className="text-xs opacity-50">
          {new Date(earnedAt).toLocaleDateString("pt-BR")}
        </p>
      )}
      <span className={`absolute top-2 right-2 text-xs font-mono uppercase opacity-50`}>
        {def.tier}
      </span>
    </div>
  );
}
