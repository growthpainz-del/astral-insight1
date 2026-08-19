import React from "react";
import { UserCircle2, Sparkles, Star } from "lucide-react";

/**
 * ReaderProfileCard
 * Shown to a client joining a live session, so they know a little
 * about the reader before/while the reading happens.
 */
export default function ReaderProfileCard({ reader }) {
  if (!reader) return null;

  return (
    <div className="bg-gradient-to-b from-[#1a0f35]/80 to-[#0a0618]/80 border border-[#a078ff]/30 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-purple-900/40 border border-purple-500/40 overflow-hidden flex items-center justify-center shrink-0">
          {reader.photo_url ? (
            <img src={reader.photo_url} alt={reader.display_name} className="w-full h-full object-cover" />
          ) : (
            <UserCircle2 className="w-9 h-9 text-purple-400/60" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-white font-['Cinzel'] tracking-wide">
              {reader.display_name || "Your Reader"}
            </h3>
            {reader.status === "online" && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            )}
          </div>
          {reader.tagline && (
            <p className="text-sm text-cyan-300/90 italic mt-0.5">{reader.tagline}</p>
          )}
        </div>
      </div>

      {reader.bio && (
        <p className="text-sm text-purple-100/80 leading-relaxed mt-3 whitespace-pre-wrap">{reader.bio}</p>
      )}

      <div className="flex flex-wrap gap-4 mt-3 text-xs text-purple-300/70">
        {reader.years_experience != null && reader.years_experience !== "" && (
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-300" />
            {reader.years_experience} yr{Number(reader.years_experience) !== 1 ? "s" : ""} reading
          </span>
        )}
        {reader.reading_style && (
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            {reader.reading_style}
          </span>
        )}
      </div>

      {reader.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {reader.specialties.map((s) => (
            <span key={s} className="text-xs bg-purple-500/15 border border-purple-500/30 text-purple-200 rounded-full px-3 py-1">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
