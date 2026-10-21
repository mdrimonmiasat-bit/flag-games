'use client';

import React from 'react';
import { Trophy, Flag, Clock } from 'lucide-react';
import { FinishedMarble, GameMode } from '@/lib/race-engine';

interface FinishedFlagsProps {
  finished: FinishedMarble[];
  totalMarbles: number;
  mode: GameMode;
  onSelectCountry?: (countryName: string) => void;
}

export const FinishedFlags: React.FC<FinishedFlagsProps> = ({
  finished,
  totalMarbles,
  mode,
}) => {
  const firstFinisher = finished.length > 0 ? finished[0] : null;
  const otherFinishers = finished.length > 1 ? finished.slice(1) : [];

  return (
    <div className="w-full max-w-[420px] mx-auto px-2 pb-2">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
        <div className="flex items-center gap-1.5 font-medium">
          <Flag className="w-3.5 h-3.5 text-sky-400" />
          <span>Escaped Marbles</span>
        </div>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-sky-300">
          {finished.length} / {totalMarbles} Out
        </span>
      </div>

      {finished.length === 0 ? (
        <div className="py-4 px-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
          <p className="text-xs text-slate-500">
            Marbles are bouncing inside the rings...
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Escaped flags will queue here in exit order!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Top Center: First Finisher Highlighted/Larger */}
          {firstFinisher && (
            <div className="relative mx-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900/90 to-sky-950/60 border border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              {/* Rank 1 Crown/Badge */}
              <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                <Trophy className="w-4 h-4 text-slate-950" />
              </div>

              {/* Flag Icon */}
              <div className="w-10 h-7 rounded-md overflow-hidden border border-sky-400 shadow-sm shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/flags/${firstFinisher.country.code.toLowerCase()}.svg`}
                  alt={firstFinisher.country.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-sky-200">
                    {firstFinisher.country.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    1ST
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>{firstFinisher.escapeTime.toFixed(1)}s</span>
                  {mode === 'first_out' && (
                    <span className="text-amber-400 font-sans font-semibold ml-1">🏆 Winner</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subsequent Finishers: Scrollable horizontal row of rectangular flag icons */}
          {otherFinishers.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {otherFinishers.map((item) => (
                <div
                  key={`${item.country.code}-${item.rank}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0 hover:border-sky-500/40 transition group"
                  title={`${item.country.name} (Rank #${item.rank}, ${item.escapeTime.toFixed(1)}s)`}
                >
                  <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-sky-300">
                    #{item.rank}
                  </span>
                  <div className="w-6 h-4 rounded overflow-hidden border border-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/flags/${item.country.code.toLowerCase()}.svg`}
                      alt={item.country.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 max-w-[70px] truncate">
                    {item.country.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
