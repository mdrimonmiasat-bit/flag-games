'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RaceEngine, Marble } from '@/lib/race-engine';

interface MarbleRace2DProps {
  engine: RaceEngine;
  onHoverMarble?: (marble: Marble | null, pos: { x: number; y: number } | null) => void;
}

export const MarbleRace2D: React.FC<MarbleRace2DProps> = ({ engine, onHoverMarble }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [hoveredMarble, setHoveredMarble] = useState<Marble | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Handle high DPI crisp rendering
    const size = 420;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${size}px`;
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = '1 / 1';

    let isSubscribed = true;

    const renderLoop = (time: number) => {
      if (!isSubscribed) return;

      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      // Update simulation step
      engine.update(dt);

      // Render frame
      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Dark Navy Background
      ctx.fillStyle = '#0f1320';
      ctx.fillRect(0, 0, size, size);

      const cx = engine.center.x;
      const cy = engine.center.y;

      // 2. Subtle radial background glow from center
      const bgGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, engine.arenaRadius + 20);
      bgGlow.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      bgGlow.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
      bgGlow.addColorStop(1, 'rgba(15, 19, 32, 0.95)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, engine.arenaRadius + 20, 0, Math.PI * 2);
      ctx.fill();

      // Subtle arena circular boundary guideline
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, engine.arenaRadius + 14, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Central Core ("goal/core")
      ctx.save();
      // Outer core glow
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, engine.coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner core ring
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Draw Concentric Rotating Rings with Gaps
      for (let rIdx = 0; rIdx < engine.rings.length; rIdx++) {
        const ring = engine.rings[rIdx];

        // Convert gaps into solid arcs
        // Sort gaps by start angle
        const sortedGaps = [...ring.gaps].sort((a, b) => a.startAngle - b.startAngle);
        
        ctx.save();
        ctx.lineWidth = ring.thickness;
        ctx.lineCap = 'round';
        ctx.strokeStyle = ring.color;
        ctx.shadowColor = ring.color;
        ctx.shadowBlur = 14;

        if (sortedGaps.length === 0) {
          // Full ring
          ctx.beginPath();
          ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // For each gap, draw arc between previous gap end and current gap start
          for (let i = 0; i < sortedGaps.length; i++) {
            const currentGap = sortedGaps[i];
            const nextGap = sortedGaps[(i + 1) % sortedGaps.length];

            const arcStart = (ring.angle + currentGap.startAngle + currentGap.size) % (Math.PI * 2);
            let arcEnd = (ring.angle + nextGap.startAngle) % (Math.PI * 2);
            if (arcEnd < arcStart) arcEnd += Math.PI * 2;

            if (arcEnd - arcStart > 0.05) {
              ctx.beginPath();
              ctx.arc(cx, cy, ring.radius, arcStart, arcEnd);
              ctx.stroke();
            }
          }
        }
        ctx.restore();

        // Secondary inner core accent line for high-tech neon bevel
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 0;
        for (let i = 0; i < sortedGaps.length; i++) {
          const currentGap = sortedGaps[i];
          const nextGap = sortedGaps[(i + 1) % sortedGaps.length];
          const arcStart = (ring.angle + currentGap.startAngle + currentGap.size + 0.04) % (Math.PI * 2);
          let arcEnd = (ring.angle + nextGap.startAngle - 0.04) % (Math.PI * 2);
          if (arcEnd < arcStart) arcEnd += Math.PI * 2;
          if (arcEnd - arcStart > 0.1) {
            ctx.beginPath();
            ctx.arc(cx, cy, ring.radius, arcStart, arcEnd);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // 5. Draw Hit Particles
      for (const p of engine.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Draw Marbles (Country Flag spheres)
      for (const marble of engine.marbles) {
        if (marble.escaped) continue;

        ctx.save();
        ctx.translate(marble.x, marble.y);

        // Soft drop shadow / neon under-glow
        ctx.save();
        ctx.shadowColor = marble.flashTimer > 0 ? '#ffffff' : 'rgba(56, 189, 248, 0.6)';
        ctx.shadowBlur = marble.flashTimer > 0 ? 16 : 8;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, marble.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Circular clipping mask for country flag
        ctx.beginPath();
        ctx.arc(0, 0, marble.radius, 0, Math.PI * 2);
        ctx.clip();

        // Draw country flag
        if (marble.img && marble.img.complete && marble.img.naturalWidth > 0) {
          ctx.rotate(marble.angle);
          // Scale to cover circle
          const r = marble.radius;
          ctx.drawImage(marble.img, -r * 1.35, -r * 1.1, r * 2.7, r * 2.2);
          ctx.rotate(-marble.angle);
        } else {
          // Fallback colored marble with ISO code text
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-marble.radius, -marble.radius, marble.radius * 2, marble.radius * 2);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(marble.country.code.toUpperCase(), 0, 0);
        }

        // Spherical Gloss Gradient (gives real glass marble look)
        const glossGrad = ctx.createRadialGradient(
          -marble.radius * 0.35,
          -marble.radius * 0.35,
          marble.radius * 0.1,
          0,
          0,
          marble.radius
        );
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
        glossGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
        glossGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
        glossGrad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');

        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.arc(0, 0, marble.radius, 0, Math.PI * 2);
        ctx.fill();

        // Hit flash highlight overlay
        if (marble.flashTimer > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(marble.flashTimer * 0.5, 0.5)})`;
          ctx.beginPath();
          ctx.arc(0, 0, marble.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Border rim
        ctx.strokeStyle = hoveredMarble === marble ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = hoveredMarble === marble ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, marble.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Hover target indicator ring
        if (hoveredMarble === marble) {
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(marble.x, marble.y, marble.radius + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [engine, hoveredMarble]);

  // Pointer / Touch interaction for country inspection
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 420 / rect.width;
    const px = (e.clientX - rect.left) * scale;
    const py = (e.clientY - rect.top) * scale;

    let found: Marble | null = null;
    for (const marble of engine.marbles) {
      if (marble.escaped) continue;
      const d = Math.hypot(marble.x - px, marble.y - py);
      if (d <= marble.radius + 8) {
        found = marble;
        break;
      }
    }

    setHoveredMarble(found);
    if (onHoverMarble) {
      onHoverMarble(found, found ? { x: e.clientX, y: e.clientY } : null);
    }
  };

  const handlePointerLeave = () => {
    setHoveredMarble(null);
    if (onHoverMarble) {
      onHoverMarble(null, null);
    }
  };

  return (
    <div className="relative w-full flex items-center justify-center p-2 select-none touch-none">
      <div className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden border border-sky-500/20 shadow-[0_0_35px_rgba(56,189,248,0.15)] bg-[#0f1320]">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Hovered marble tooltip overlay inside canvas */}
        {hoveredMarble && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-sky-400/50 shadow-lg text-xs font-semibold text-sky-200 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/flags/${hoveredMarble.country.code.toLowerCase()}.svg`}
              alt={hoveredMarble.country.name}
              className="w-4 h-3 object-cover rounded-sm border border-slate-700"
            />
            <span>{hoveredMarble.country.name}</span>
            <span className="text-slate-400 text-[10px]">
              Ring {hoveredMarble.currentRingLevel + 1}/3
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
