'use client';

import React from 'react';
import { X, Volume2, VolumeX, Smartphone, Trophy, Zap, Globe2 } from 'lucide-react';
import { GameMode, RaceConfig } from '@/lib/race-engine';
import { sound } from '@/lib/sound';
import { usePWAInstall } from '@/hooks/use-pwa-install';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RaceConfig;
  onChangeConfig: (newConfig: Partial<RaceConfig>) => void;
  selectedRegion: string;
  onChangeRegion: (region: string) => void;
  onRestart: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  selectedRegion,
  onChangeRegion,
  onRestart,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);

  if (!isOpen) return null;

  const regions = ['All', 'Europe', 'Americas', 'Asia', 'Africa', 'Oceania'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[#13192b] border border-sky-500/30 p-6 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-sky-300">Race Settings</h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Win Condition Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Trophy className="w-4 h-4 text-sky-400" />
              Win Condition
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onChangeConfig({ mode: 'first_out' });
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${
                  config.mode === 'first_out'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold">First Out</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Sprint</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onChangeConfig({ mode: 'last_survivor' });
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${
                  config.mode === 'last_survivor'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold">Last Survivor</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Survival</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onChangeConfig({ mode: 'endless', continuousTimer: true });
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${
                  config.mode === 'endless'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm ring-1 ring-sky-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold text-amber-300">Non-Stop ♾️</span>
                <span className="text-[10px] text-amber-400/80 mt-0.5">সময় শেষ হবে না</span>
              </button>
            </div>
          </div>

          {/* Continuous Timer Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>⏱️</span>
                <span>Continuous Timer (টাইমার চলতে থাকবে)</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Time count never stops; keeps running smoothly
              </p>
            </div>
            <button
              onClick={() => {
                const next = !config.continuousTimer;
                sound.playClick();
                onChangeConfig({ continuousTimer: next });
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                config.continuousTimer || config.mode === 'endless' ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
            </button>
          </div>

          {/* Marble Count */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Number of Marbles ({config.marbleCount})
              </label>
              <div className="flex gap-1.5">
                {[8, 12, 16, 24].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      sound.playClick();
                      onChangeConfig({ marbleCount: preset });
                    }}
                    className={`px-2 py-0.5 text-xs rounded-lg font-medium transition ${
                      config.marbleCount === preset
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={config.marbleCount}
              onChange={(e) => onChangeConfig({ marbleCount: parseInt(e.target.value, 10) })}
              className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>5 countries</span>
              <span>15</span>
              <span>30 countries</span>
            </div>
          </div>

          {/* Ring Rotation Speed */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Ring Rotation Speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Normal', val: 1 },
                { label: 'Fast', val: 1.5 },
                { label: 'Chaotic', val: 2.2 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    sound.playClick();
                    onChangeConfig({ ringSpeedFactor: item.val });
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    config.ringSpeedFactor === item.val
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Continent / Region Filter */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Globe2 className="w-4 h-4 text-sky-400" />
              Country Region Filter
            </label>
            <div className="flex flex-wrap gap-1.5">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => {
                    sound.playClick();
                    onChangeRegion(region);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium border transition ${
                    selectedRegion === region
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-sky-400">
                {config.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold">Sound Effects</p>
                <p className="text-xs text-slate-400">Collision, chimes & victory fanfare</p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !config.soundEnabled;
                sound.enabled = next;
                sound.playClick();
                onChangeConfig({ soundEnabled: next });
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                config.soundEnabled ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
            </button>
          </div>

          {/* PWA In-App Install Option */}
          {(!isInstalled && (isInstallable || isIOS)) && (
            <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sky-200">Install Mobile App</p>
                    <p className="text-xs text-sky-400/80">Play offline & fullscreen</p>
                  </div>
                </div>
                {isInstallable ? (
                  <button
                    onClick={install}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
                  >
                    Install
                  </button>
                ) : isIOS ? (
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium text-xs hover:bg-sky-500/30 transition"
                  >
                    iOS Guide
                  </button>
                ) : null}
              </div>

              {showIOSGuide && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 space-y-1">
                  <p>1. Tap Safari <strong>Share</strong> button at bottom.</p>
                  <p>2. Choose <strong>Add to Home Screen</strong>.</p>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="mt-2 text-sky-400 font-medium text-[11px] underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
              onClose();
            }}
            className="flex-1 py-3 rounded-2xl bg-sky-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:bg-sky-400 transition"
          >
            Apply & Restart Race
          </button>
        </div>
      </div>
    </div>
  );
};
