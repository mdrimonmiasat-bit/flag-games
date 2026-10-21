'use client';

import React from 'react';
import { ChevronLeft, Volume2, VolumeX, Settings, Box, Layers } from 'lucide-react';
import { sound } from '@/lib/sound';

interface TopBarProps {
  onBack: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  viewMode: '2d' | '3d';
  onToggleViewMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onBack,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <header className="w-full max-w-[440px] mx-auto px-3 pt-3 pb-2 flex items-center justify-between z-20">
      {/* Left: Round Back button (circle with "<" icon) */}
      <button
        onClick={() => {
          sound.playClick();
          onBack();
        }}
        aria-label="Back / Reset"
        className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900/90 border border-slate-700/80 text-sky-400 hover:text-white hover:bg-slate-800 hover:border-sky-400/50 shadow-md transition active:scale-95 shrink-0"
      >
        <ChevronLeft className="w-6 h-6 -ml-0.5" />
      </button>

      {/* Center: Bold Title "Flag Battle: Marble Race" in sky blue */}
      <div className="flex-1 text-center px-2">
        <h1 className="text-base sm:text-lg font-black tracking-tight text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] truncate">
          Flag Battle: Marble Race
        </h1>
      </div>

      {/* Right: Quick Controls (2D/3D toggle, Sound, Settings) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* View Mode Toggle (2D / 3D) */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleViewMode();
          }}
          title={`Switch to ${viewMode === '2d' ? '3D Arena' : '2D Canvas'}`}
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition shadow-sm ${
            viewMode === '3d'
              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white'
          }`}
        >
          {viewMode === '2d' ? <Box className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleSound();
          }}
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-sm"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-sky-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenSettings();
          }}
          title="Settings"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-sky-300 hover:bg-slate-800 transition shadow-sm"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
