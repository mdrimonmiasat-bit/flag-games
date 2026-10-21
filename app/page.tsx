'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RaceEngine, RaceConfig, FinishedMarble } from '@/lib/race-engine';
import { COUNTRIES } from '@/lib/countries';
import { sound } from '@/lib/sound';
import { TopBar } from '@/components/TopBar';
import { MarbleRace2D } from '@/components/MarbleRace2D';
import { MarbleRace3D } from '@/components/MarbleRace3D';
import { ControlBar } from '@/components/ControlBar';
import { FinishedFlags } from '@/components/FinishedFlags';
import { WinnerModal } from '@/components/WinnerModal';
import { SettingsModal } from '@/components/SettingsModal';
import { OfflineStatus } from '@/components/OfflineStatus';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

export default function FlagBattlePage() {
  const [engine] = useState(() => {
    const eng = new RaceEngine();
    const shuffled = [...COUNTRIES].sort(() => 0.5 - Math.random());
    eng.setConfig({ continuousTimer: true });
    eng.resetRace(shuffled.slice(0, 10));
    return eng;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<FinishedMarble | null>(null);
  const [finishedMarbles, setFinishedMarbles] = useState<FinishedMarble[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingCount, setRemainingCount] = useState(10);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('All');

  const [config, setConfig] = useState<RaceConfig>({
    marbleCount: 10,
    mode: 'last_survivor',
    speedMultiplier: 1,
    soundEnabled: true,
    ringSpeedFactor: 1,
    continuousTimer: true,
  });

  const getFilteredCountries = useCallback(() => {
    let pool = COUNTRIES;
    if (selectedRegion !== 'All') {
      pool = COUNTRIES.filter((c) => c.region === selectedRegion);
      if (pool.length < config.marbleCount) pool = COUNTRIES;
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, config.marbleCount);
  }, [config.marbleCount, selectedRegion]);

  // Restart race with new random countries
  const handleRestart = useCallback(() => {
    const countries = getFilteredCountries();
    engine.setConfig(config);
    engine.resetRace(countries);
    setIsRunning(false);
    setIsGameOver(false);
    setWinner(null);
    setFinishedMarbles([]);
    setElapsedTime(0);
    setRemainingCount(countries.length);
  }, [engine, config, getFilteredCountries]);

  // Sync state loop from engine to React UI
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRunning(engine.isRunning);
      setElapsedTime(engine.elapsedTime);
      setFinishedMarbles([...engine.finished]);
      setRemainingCount(engine.getRemainingCount());

      if (engine.isGameOver && !isGameOver && engine.winner) {
        setIsGameOver(true);
        setWinner(engine.winner);
        setIsRunning(false);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [engine, isGameOver]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        sound.playClick();
        if (engine.isGameOver) {
          handleRestart();
        } else {
          const active = engine.togglePlay();
          setIsRunning(active);
        }
      } else if (e.code === 'KeyR') {
        sound.playClick();
        handleRestart();
      } else if (e.code === 'KeyM') {
        const next = !config.soundEnabled;
        sound.enabled = next;
        setConfig((prev) => ({ ...prev, soundEnabled: next }));
        engine.setSound(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, config.soundEnabled, handleRestart]);

  const handleTogglePlay = () => {
    if (engine.isGameOver) {
      handleRestart();
      engine.start();
      setIsRunning(true);
    } else {
      const active = engine.togglePlay();
      setIsRunning(active);
    }
  };

  const handleChangeSpeed = (spd: number) => {
    setConfig((prev) => ({ ...prev, speedMultiplier: spd }));
    engine.setSpeed(spd);
  };

  const handleToggleSound = () => {
    const next = !config.soundEnabled;
    sound.enabled = next;
    setConfig((prev) => ({ ...prev, soundEnabled: next }));
    engine.setSound(next);
  };

  const handleChangeConfig = (newCfg: Partial<RaceConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newCfg };
      engine.setConfig(merged);
      return merged;
    });
  };

  const handleBack = () => {
    engine.pause();
    setIsRunning(false);
    handleRestart();
  };

  return (
    <main className="min-h-screen w-full bg-[#0f1320] text-slate-100 flex flex-col items-center justify-between select-none">
      {/* Top Bar with round back button and bold sky blue title */}
      <TopBar
        onBack={handleBack}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundEnabled={config.soundEnabled}
        onToggleSound={handleToggleSound}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
      />

      {/* Sub-header info badges */}
      <div className="w-full max-w-[420px] px-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-sky-400 font-semibold text-[11px]">
            {config.mode === 'endless'
              ? '♾️ Non-Stop (সময় শেষ হবে না)'
              : config.mode === 'first_out'
              ? '⚡ First Out Wins'
              : '👑 Last Survivor'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {viewMode.toUpperCase()} Arena
          </span>
        </div>
        <div className="font-mono text-xs text-sky-300 font-bold bg-slate-900/90 px-2.5 py-1 rounded-xl border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
          ⏱️ {formatTime(elapsedTime)}
        </div>
      </div>

      {/* Game Arena centered on screen (Canvas fills width in portrait layout) */}
      <section className="w-full max-w-[440px] flex-1 flex flex-col items-center justify-center my-auto">
        {viewMode === '2d' ? (
          <MarbleRace2D engine={engine} />
        ) : (
          <MarbleRace3D engine={engine} />
        )}
      </section>

      {/* Bottom Area: Controls & Finished Flags Strip */}
      <footer className="w-full max-w-[440px] flex flex-col gap-2 pb-4 pt-1">
        {/* Controls: Play/Pause, Restart, Speed 1x 2x 3x */}
        <ControlBar
          isRunning={isRunning}
          onTogglePlay={handleTogglePlay}
          onRestart={handleRestart}
          speed={config.speedMultiplier}
          onChangeSpeed={handleChangeSpeed}
          elapsedTime={elapsedTime}
          remainingCount={remainingCount}
          totalCount={config.marbleCount}
        />

        {/* Finished flags in order of exit */}
        <FinishedFlags
          finished={finishedMarbles}
          totalMarbles={config.marbleCount}
          mode={config.mode}
        />
      </footer>

      {/* Winner Modal with Confetti & Big Flag */}
      <WinnerModal
        winner={winner}
        mode={config.mode}
        onPlayAgain={handleRestart}
        onClose={() => setWinner(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChangeConfig={handleChangeConfig}
        selectedRegion={selectedRegion}
        onChangeRegion={setSelectedRegion}
        onRestart={handleRestart}
      />

      {/* Offline Ready and Connection Monitor */}
      <OfflineStatus />
    </main>
  );
}
