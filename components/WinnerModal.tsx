'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Crown, Clock, X } from 'lucide-react';
import { FinishedMarble, GameMode } from '@/lib/race-engine';
import { sound } from '@/lib/sound';

interface WinnerModalProps {
  winner: FinishedMarble | null;
  mode: GameMode;
  onPlayAgain: () => void;
  onClose: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  mode,
  onPlayAgain,
  onClose,
}) => {
  useEffect(() => {
    if (winner) {
      // Fire confetti burst
      try {
        const count = 200;
        const defaults = {
          origin: { y: 0.65 },
          zIndex: 9999,
        };

        const fire = (particleRatio: number, opts: confetti.Options) => {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        };

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
          colors: ['#38bdf8', '#0284c7', '#ffffff'],
        });
        fire(0.2, {
          spread: 60,
          colors: ['#f59e0b', '#fbbf24', '#38bdf8'],
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          colors: ['#38bdf8', '#3b82f6'],
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
      } catch {
        // Fallback
      }
    }
  }, [winner]);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#162038] to-[#0d1222] border-2 border-sky-400/40 p-6 text-center text-slate-100 shadow-[0_0_60px_rgba(56,189,248,0.3)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown & Trophy Icon */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-amber-400 p-0.5 shadow-[0_0_30px_rgba(56,189,248,0.5)]">
          <div className="w-full h-full rounded-2xl bg-[#0f1320] flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <div className="mt-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
            {mode === 'first_out' ? 'Sprint Champion' : 'Ultimate Survivor'}
          </span>
          <h2 className="mt-2 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400">
            VICTORY!
          </h2>
        </div>

        {/* Big Flag */}
        <div className="mt-5 relative mx-auto w-36 h-24 rounded-2xl overflow-hidden border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.4)] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/flags/${winner.country.code.toLowerCase()}.svg`}
            alt={winner.country.name}
            className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105"
          />
        </div>

        {/* Country Name */}
        <h3 className="mt-4 text-xl font-bold text-slate-100">
          {winner.country.name}
        </h3>
        <p className="text-xs text-sky-400 font-mono mt-0.5">
          ISO: {winner.country.code.toUpperCase()}
        </p>

        {/* Escape Time badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Finish Time: <strong className="text-sky-300 font-mono">{winner.escapeTime.toFixed(1)}s</strong></span>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(56,189,248,0.4)] transition transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700/80 transition"
          >
            <span>Continue Watching (চলতে থাকবে)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
