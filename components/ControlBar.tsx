'use client';

import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { sound } from '@/lib/sound';

interface ControlBarProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  speed: number;
  onChangeSpeed: (spd: number) => void;
  elapsedTime: number;
  remainingCount: number;
  totalCount: number;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isRunning,
  onTogglePlay,
  onRestart,
  speed,
  onChangeSpeed,
  elapsedTime,
  remainingCount,
  totalCount,
}) => {
  return (
    <div className="w-full max-w-[420px] mx-auto px-2 py-1 flex items-center justify-between gap-2 z-10">
      {/* Play / Pause Button */}
      <button
        onClick={() => {
          sound.playClick();
          onTogglePlay();
        }}
        className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm tracking-wide shadow-lg transition active:scale-95 ${
          isRunning
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.35)]'
        }`}
      >
        {isRunning ? (
          <>
            <Pause className="w-4 h-4 fill-current" />
            <span>PAUSE</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <span>START RACE</span>
          </>
        )}
      </button>

      {/* Restart Button */}
      <button
        onClick={() => {
          sound.playClick();
          onRestart();
        }}
        title="Restart Race"
        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-sky-300 hover:border-sky-400/50 shadow-md transition active:scale-95 shrink-0"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* Speed Multiplier Pill Control (1x, 2x, 3x) */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-md shrink-0">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => {
              sound.playClick();
              onChangeSpeed(s);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              speed === s
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};
