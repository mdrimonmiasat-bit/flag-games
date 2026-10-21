/**
 * Flag Battle: Marble Race
 * Pure vanilla JavaScript with HTML5 Canvas & Web Audio API
 */

// Full Country List (ISO 3166-1 alpha-2 codes and names)
const COUNTRIES = [
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'ca', name: 'Canada' },
  { code: 'au', name: 'Australia' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'it', name: 'Italy' },
  { code: 'es', name: 'Spain' },
  { code: 'br', name: 'Brazil' },
  { code: 'jp', name: 'Japan' },
  { code: 'kr', name: 'South Korea' },
  { code: 'cn', name: 'China' },
  { code: 'in', name: 'India' },
  { code: 'mx', name: 'Mexico' },
  { code: 'ar', name: 'Argentina' },
  { code: 'za', name: 'South Africa' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'eg', name: 'Egypt' },
  { code: 'ke', name: 'Kenya' },
  { code: 'sa', name: 'Saudi Arabia' },
  { code: 'ae', name: 'United Arab Emirates' },
  { code: 'tr', name: 'Turkey' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'se', name: 'Sweden' },
  { code: 'no', name: 'Norway' },
  { code: 'fi', name: 'Finland' },
  { code: 'dk', name: 'Denmark' },
  { code: 'pl', name: 'Poland' },
  { code: 'pt', name: 'Portugal' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'be', name: 'Belgium' },
  { code: 'at', name: 'Austria' },
  { code: 'gr', name: 'Greece' },
  { code: 'cz', name: 'Czech Republic' },
  { code: 'ro', name: 'Romania' },
  { code: 'hu', name: 'Hungary' },
  { code: 'ie', name: 'Ireland' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'sg', name: 'Singapore' },
  { code: 'my', name: 'Malaysia' },
  { code: 'th', name: 'Thailand' },
  { code: 'vn', name: 'Vietnam' },
  { code: 'ph', name: 'Philippines' },
  { code: 'id', name: 'Indonesia' },
  { code: 'pk', name: 'Pakistan' },
  { code: 'bd', name: 'Bangladesh' },
  { code: 'co', name: 'Colombia' },
  { code: 'cl', name: 'Chile' },
  { code: 'pe', name: 'Peru' },
  { code: 'uy', name: 'Uruguay' },
  { code: 'ua', name: 'Ukraine' },
  { code: 'hr', name: 'Croatia' },
  { code: 'is', name: 'Iceland' },
  { code: 'ma', name: 'Morocco' },
  { code: 'gh', name: 'Ghana' },
  { code: 'qa', name: 'Qatar' },
  { code: 'jm', name: 'Jamaica' },
  { code: 'cr', name: 'Costa Rica' }
];

// Web Audio API Sound Synthesizer
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playCollision(intensity = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360 * Math.min(Math.max(intensity, 0.7), 1.5), this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.08 * intensity, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playEscape() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.22);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + i * 0.12;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      } catch (e) {}
    });
  }
}

const audio = new SoundController();

// Game State & Configuration
const state = {
  canvas: null,
  ctx: null,
  size: 420,
  center: { x: 210, y: 210 },
  coreRadius: 20,
  isRunning: false,
  isGameOver: false,
  speedMultiplier: 1,
  mode: 'last_survivor', // 'first_out' or 'last_survivor'
  marbleCount: 10,
  soundOn: true,
  elapsedTime: 0,
  marbles: [],
  rings: [],
  finished: [],
  particles: [],
  imageCache: new Map(),
  hoveredMarble: null
};

// Initialize Rings
function initRings() {
  state.rings = [
    { radius: 68, thickness: 10, angle: 0, speed: 0.016, gaps: [{ start: 0, size: 0.85 }], color: '#7dd3fc' },
    { radius: 124, thickness: 10, angle: Math.PI * 0.7, speed: -0.014, gaps: [{ start: 0, size: 0.75 }, { start: Math.PI, size: 0.75 }], color: '#38bdf8' },
    { radius: 180, thickness: 11, angle: Math.PI * 1.3, speed: 0.011, gaps: [{ start: 0, size: 0.8 }, { start: Math.PI * 1.05, size: 0.78 }], color: '#0284c7' }
  ];
}

// Reset Game
function resetGame() {
  state.isRunning = false;
  state.isGameOver = false;
  state.elapsedTime = 0;
  state.finished = [];
  state.particles = [];
  initRings();

  // Pick random countries
  const shuffled = [...COUNTRIES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, state.marbleCount);

  let radius = 14;
  if (state.marbleCount > 12) radius = 12;
  if (state.marbleCount > 20) radius = 10;

  state.marbles = selected.map((country, idx) => {
    const flagUrl = `/flags/${country.code.toLowerCase()}.svg`;
    let img = state.imageCache.get(flagUrl);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = flagUrl;
      state.imageCache.set(flagUrl, img);
    }

    const minR = state.coreRadius + radius + 4;
    const maxR = state.rings[0].radius - radius - 6;
    const r = minR + Math.random() * (maxR - minR);
    const angle = (idx / state.marbleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;

    const spd = 1.6 + Math.random() * 0.8;
    const vAngle = Math.random() * Math.PI * 2;

    return {
      id: `${country.code}-${idx}`,
      country,
      x: state.center.x + Math.cos(angle) * r,
      y: state.center.y + Math.sin(angle) * r,
      vx: Math.cos(vAngle) * spd,
      vy: Math.sin(vAngle) * spd,
      radius,
      angle: Math.random() * Math.PI * 2,
      escaped: false,
      escapeTime: null,
      currentRingLevel: 0,
      img
    };
  });

  updateFinishedUI();
  updateTimerUI();
  document.getElementById('startBtn').textContent = 'START RACE';
  document.getElementById('startBtn').classList.remove('paused');
}

// Physics Sub-step
function updatePhysics(dt) {
  if (!state.isRunning || state.isGameOver) return;

  const simSteps = Math.max(1, Math.round(state.speedMultiplier * 2));
  const subDt = (dt * state.speedMultiplier) / simSteps;
  state.elapsedTime += dt * state.speedMultiplier;

  for (let s = 0; s < simSteps; s++) {
    // 1. Rotate rings
    for (const ring of state.rings) {
      ring.angle = (ring.angle + ring.speed * (subDt * 60)) % (Math.PI * 2);
    }

    // 2. Marbles position update
    for (const m of state.marbles) {
      if (m.escaped) continue;
      m.x += m.vx * (subDt * 60);
      m.y += m.vy * (subDt * 60);
      m.angle += 0.02;

      // Air resistance / perpetual movement
      const spd = Math.hypot(m.vx, m.vy);
      if (spd > 5.2) {
        m.vx = (m.vx / spd) * 5.2;
        m.vy = (m.vy / spd) * 5.2;
      } else if (spd < 1.0) {
        m.vx *= 1.1;
        m.vy *= 1.1;
      }
    }

    // 3. Central Core bounce
    for (const m of state.marbles) {
      if (m.escaped) continue;
      const dx = m.x - state.center.x;
      const dy = m.y - state.center.y;
      const dist = Math.hypot(dx, dy);
      const minCore = state.coreRadius + m.radius;
      if (dist < minCore && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        m.x = state.center.x + nx * (minCore + 0.5);
        m.y = state.center.y + ny * (minCore + 0.5);
        const dot = m.vx * nx + m.vy * ny;
        if (dot < 0) {
          m.vx -= 1.95 * dot * nx;
          m.vy -= 1.95 * dot * ny;
          audio.playCollision(Math.abs(dot));
        }
      }
    }

    // 4. Ring Arc Collisions & Gaps
    for (const m of state.marbles) {
      if (m.escaped) continue;
      const dx = m.x - state.center.x;
      const dy = m.y - state.center.y;
      const dist = Math.hypot(dx, dy);

      // Check outer escape
      const outerRing = state.rings[2];
      if (dist > outerRing.radius + outerRing.thickness / 2 + m.radius + 6) {
        handleMarbleEscape(m);
        continue;
      }

      for (let rIdx = 0; rIdx < state.rings.length; rIdx++) {
        const ring = state.rings[rIdx];
        const halfThick = ring.thickness / 2;
        const threshold = halfThick + m.radius;
        if (Math.abs(dist - ring.radius) < threshold && dist > 0.001) {
          let mAngle = Math.atan2(dy, dx);
          if (mAngle < 0) mAngle += Math.PI * 2;

          let inGap = false;
          for (const gap of ring.gaps) {
            let gStart = (ring.angle + gap.start) % (Math.PI * 2);
            if (gStart < 0) gStart += Math.PI * 2;
            let gEnd = (gStart + gap.size) % (Math.PI * 2);
            const isInside = gStart <= gEnd ? (mAngle >= gStart && mAngle <= gEnd) : (mAngle >= gStart || mAngle <= gEnd);
            if (isInside) {
              inGap = true;
              break;
            }
          }

          if (inGap) {
            if (dist > ring.radius && m.currentRingLevel === rIdx) {
              m.currentRingLevel = rIdx + 1;
            }
            continue;
          }

          // Wall bounce
          const nx = dx / dist;
          const ny = dy / dist;
          const isInside = dist < ring.radius;
          const targetDist = isInside ? ring.radius - threshold - 0.2 : ring.radius + threshold + 0.2;
          m.x = state.center.x + nx * targetDist;
          m.y = state.center.y + ny * targetDist;

          const wallVx = -ring.speed * dy * 0.4;
          const wallVy = ring.speed * dx * 0.4;
          const relVx = m.vx - wallVx;
          const relVy = m.vy - wallVy;
          const wallNormX = isInside ? -nx : nx;
          const wallNormY = isInside ? -ny : ny;
          const dot = relVx * wallNormX + relVy * wallNormY;

          if (dot < 0) {
            m.vx = wallVx + (relVx - 1.91 * dot * wallNormX);
            m.vy = wallVy + (relVy - 1.91 * dot * wallNormY);
            audio.playCollision(Math.abs(dot));
          }
        }
      }
    }

    // 5. Marble-to-Marble Collisions
    for (let i = 0; i < state.marbles.length; i++) {
      const m1 = state.marbles[i];
      if (m1.escaped) continue;
      for (let j = i + 1; j < state.marbles.length; j++) {
        const m2 = state.marbles[j];
        if (m2.escaped) continue;
        const dx = m2.x - m1.x;
        const dy = m2.y - m1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = m1.radius + m2.radius;
        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          m1.x -= nx * (overlap * 0.5 + 0.1);
          m1.y -= ny * (overlap * 0.5 + 0.1);
          m2.x += nx * (overlap * 0.5 + 0.1);
          m2.y += ny * (overlap * 0.5 + 0.1);

          const kx = m1.vx - m2.vx;
          const ky = m1.vy - m2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;
          if (p > 0) {
            m1.vx -= p * 0.5 * 1.92 * nx;
            m1.vy -= p * 0.5 * 1.92 * ny;
            m2.vx += p * 0.5 * 1.92 * nx;
            m2.vy += p * 0.5 * 1.92 * ny;
            audio.playCollision(Math.abs(p));
          }
        }
      }
    }
  }
}

// Handle Escape
function handleMarbleEscape(marble) {
  marble.escaped = true;
  marble.escapeTime = state.elapsedTime;
  audio.playEscape();

  const rank = state.finished.length + 1;
  state.finished.push({
    rank,
    country: marble.country,
    escapeTime: marble.escapeTime
  });

  updateFinishedUI();

  if (state.mode === 'endless') {
    // Non-Stop Mode: Marble respawns in center, timer keeps running, time never ends!
    const minR = state.coreRadius + marble.radius + 4;
    const maxR = state.rings[0].radius - marble.radius - 6;
    const r = minR + Math.random() * (maxR - minR);
    const angle = Math.random() * Math.PI * 2;
    marble.x = state.center.x + Math.cos(angle) * r;
    marble.y = state.center.y + Math.sin(angle) * r;
    const spd = 1.6 + Math.random() * 0.8;
    const vAngle = Math.random() * Math.PI * 2;
    marble.vx = Math.cos(vAngle) * spd;
    marble.vy = Math.sin(vAngle) * spd;
    marble.escaped = false;
    marble.currentRingLevel = 0;
    return;
  }

  if (state.mode === 'first_out') {
    triggerWin(state.finished[0]);
  } else {
    const remaining = state.marbles.filter(m => !m.escaped);
    if (remaining.length === 1) {
      const survivor = remaining[0];
      survivor.escaped = true;
      survivor.escapeTime = state.elapsedTime;
      const winner = { rank: 1, country: survivor.country, escapeTime: state.elapsedTime };
      state.finished.unshift(winner);
      updateFinishedUI();
      triggerWin(winner);
    }
  }
}

function triggerWin(winner) {
  state.isGameOver = true;
  state.isRunning = false;
  audio.playFanfare();

  // Trigger Confetti
  if (typeof confetti === 'function') {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }

  // Display Winner Modal
  const modal = document.getElementById('winnerModal');
  document.getElementById('winnerFlagImg').src = `/flags/${winner.country.code.toLowerCase()}.svg`;
  document.getElementById('winnerCountryName').textContent = winner.country.name;
  document.getElementById('winnerTime').textContent = `${winner.escapeTime.toFixed(1)}s`;
  modal.style.display = 'flex';
}

// Render 2D Canvas
function render() {
  const ctx = state.ctx;
  if (!ctx) return;

  ctx.fillStyle = '#0f1320';
  ctx.fillRect(0, 0, state.size, state.size);

  const cx = state.center.x;
  const cy = state.center.y;

  // Background glow
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200);
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
  glow.addColorStop(1, 'rgba(15, 19, 32, 0.95)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 200, 0, Math.PI * 2);
  ctx.fill();

  // Central Core
  ctx.save();
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, state.coreRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Concentric Rings
  for (const ring of state.rings) {
    ctx.save();
    ctx.lineWidth = ring.thickness;
    ctx.lineCap = 'round';
    ctx.strokeStyle = ring.color;
    ctx.shadowColor = ring.color;
    ctx.shadowBlur = 12;

    const sortedGaps = [...ring.gaps].sort((a, b) => a.start - b.start);
    for (let i = 0; i < sortedGaps.length; i++) {
      const cur = sortedGaps[i];
      const nxt = sortedGaps[(i + 1) % sortedGaps.length];
      const start = (ring.angle + cur.start + cur.size) % (Math.PI * 2);
      let end = (ring.angle + nxt.start) % (Math.PI * 2);
      if (end < start) end += Math.PI * 2;
      if (end - start > 0.05) {
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, start, end);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Marbles
  for (const m of state.marbles) {
    if (m.escaped) continue;
    ctx.save();
    ctx.translate(m.x, m.y);

    // Glow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
    ctx.clip();

    if (m.img && m.img.complete && m.img.naturalWidth > 0) {
      ctx.rotate(m.angle);
      ctx.drawImage(m.img, -m.radius * 1.3, -m.radius * 1.1, m.radius * 2.6, m.radius * 2.2);
      ctx.rotate(-m.angle);
    } else {
      ctx.fillStyle = '#0284c7';
      ctx.fill();
    }

    // Marble glass overlay
    const grad = ctx.createRadialGradient(-m.radius * 0.35, -m.radius * 0.35, m.radius * 0.1, 0, 0, m.radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.6)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// UI Updates
function updateFinishedUI() {
  const container = document.getElementById('finishedRow');
  const leaderBox = document.getElementById('leaderPodium');
  if (!container || !leaderBox) return;

  if (state.finished.length === 0) {
    leaderBox.style.display = 'none';
    container.innerHTML = '<div style="color:#64748b;font-size:11px;padding:4px;">No marbles escaped yet...</div>';
    return;
  }

  // First finisher
  const first = state.finished[0];
  leaderBox.style.display = 'flex';
  document.getElementById('leaderFlag').src = `/flags/${first.country.code.toLowerCase()}.svg`;
  document.getElementById('leaderName').textContent = first.country.name;
  document.getElementById('leaderTime').textContent = `${first.escapeTime.toFixed(1)}s`;

  // Others
  const others = state.finished.slice(1);
  container.innerHTML = others.map(item => `
    <div class="finished-flag-item">
      <span style="font-weight:700;color:#94a3b8;">#${item.rank}</span>
      <img src="/flags/${item.country.code.toLowerCase()}.svg" alt="${item.country.name}">
      <span>${item.country.name}</span>
    </div>
  `).join('');

  document.getElementById('escapedCountBadge').textContent = `${state.finished.length} / ${state.marbleCount} Out`;
}

function updateTimerUI() {
  const el = document.getElementById('timerText');
  if (el) {
    const totalSecs = state.elapsedTime;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const tenths = Math.floor((totalSecs % 1) * 10);
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    el.textContent = `⏱️ ${mm}:${ss}.${tenths}`;
  }
}

// Loop
let lastFrameTime = performance.now();
function gameLoop(time) {
  const dt = Math.min((time - lastFrameTime) / 1000, 0.05);
  lastFrameTime = time;

  updatePhysics(dt);
  render();
  updateTimerUI();

  requestAnimationFrame(gameLoop);
}

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
  state.canvas = document.getElementById('gameCanvas');
  state.ctx = state.canvas.getContext('2d');
  state.canvas.width = state.size;
  state.canvas.height = state.size;

  resetGame();
  requestAnimationFrame(gameLoop);

  // Start / Pause
  document.getElementById('startBtn').addEventListener('click', () => {
    audio.init();
    if (state.isGameOver) {
      resetGame();
      state.isRunning = true;
    } else {
      state.isRunning = !state.isRunning;
    }
    const btn = document.getElementById('startBtn');
    btn.textContent = state.isRunning ? 'PAUSE' : 'START RACE';
    btn.classList.toggle('paused', state.isRunning);
  });

  // Restart
  document.getElementById('restartBtn').addEventListener('click', () => {
    audio.playCollision();
    resetGame();
  });

  // Speed controls
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.speedMultiplier = parseInt(e.target.dataset.speed, 10);
    });
  });

  // Sound toggle
  document.getElementById('soundBtn').addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    audio.enabled = state.soundOn;
    document.getElementById('soundBtn').textContent = state.soundOn ? '🔊' : '🔇';
  });

  // Settings Modal
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'flex';
  });
  // Game Mode selectors
  const modeLastBtn = document.getElementById('modeLast');
  const modeFirstBtn = document.getElementById('modeFirst');
  const modeEndlessBtn = document.getElementById('modeEndless');

  const setMode = (m) => {
    state.mode = m;
    [modeLastBtn, modeFirstBtn, modeEndlessBtn].forEach(b => b && b.classList.remove('active'));
    if (m === 'last_survivor' && modeLastBtn) modeLastBtn.classList.add('active');
    if (m === 'first_out' && modeFirstBtn) modeFirstBtn.classList.add('active');
    if (m === 'endless' && modeEndlessBtn) modeEndlessBtn.classList.add('active');
  };

  if (modeLastBtn) modeLastBtn.addEventListener('click', () => setMode('last_survivor'));
  if (modeFirstBtn) modeFirstBtn.addEventListener('click', () => setMode('first_out'));
  if (modeEndlessBtn) modeEndlessBtn.addEventListener('click', () => setMode('endless'));

  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
  });
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    document.getElementById('winnerModal').style.display = 'none';
    resetGame();
    state.isRunning = true;
    document.getElementById('startBtn').textContent = 'PAUSE';
  });
  document.getElementById('closeWinnerModal').addEventListener('click', () => {
    document.getElementById('winnerModal').style.display = 'none';
  });

  // Service Worker Registration & Offline Ready indicator
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      const showToast = () => {
        const toast = document.getElementById('offlineToast');
        if (toast) {
          toast.style.display = 'flex';
          setTimeout(() => { toast.style.display = 'none'; }, 4000);
        }
      };

      if (reg.active && navigator.serviceWorker.controller) {
        if (!sessionStorage.getItem('sw_static_shown')) {
          showToast();
          sessionStorage.setItem('sw_static_shown', 'true');
        }
      }

      reg.onupdatefound = () => {
        const inst = reg.installing;
        if (inst) {
          inst.onstatechange = () => {
            if (inst.state === 'installed' && navigator.serviceWorker.controller) {
              showToast();
            }
          };
        }
      };
    }).catch(() => {});

    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'OFFLINE_READY') {
        const toast = document.getElementById('offlineToast');
        if (toast) {
          toast.style.display = 'flex';
          setTimeout(() => { toast.style.display = 'none'; }, 4000);
        }
      }
    });
  }
});
