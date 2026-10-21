'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, CheckCircle2, X } from 'lucide-react';

export const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // If already active and controlling, check if already ready
          if (reg.active && navigator.serviceWorker.controller) {
            // Check session storage to show once per session
            if (!sessionStorage.getItem('sw_ready_shown')) {
              setShowOfflineReady(true);
              sessionStorage.setItem('sw_ready_shown', 'true');
              setTimeout(() => setShowOfflineReady(false), 4500);
            }
          }

          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowOfflineReady(true);
                  setTimeout(() => setShowOfflineReady(false), 4500);
                }
              };
            }
          };
        })
        .catch(() => {
          // Fallback if SW not supported or running in sandboxed environment
        });

      // Listen for message from sw.js
      const handleMessage = (e: MessageEvent) => {
        if (e.data && e.data.type === 'OFFLINE_READY') {
          setShowOfflineReady(true);
          setTimeout(() => setShowOfflineReady(false), 4500);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Alert when disconnected */}
      {!isOnline && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode Active (Cached Local Game)</span>
        </div>
      )}

      {/* Offline Ready Toast after precaching completes */}
      {showOfflineReady && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-slate-100 shadow-[0_0_25px_rgba(16,185,129,0.25)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-emerald-300">Offline Ready!</p>
              <p className="text-[11px] text-slate-400">
                All flag assets cached. Playable without internet.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOfflineReady(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
