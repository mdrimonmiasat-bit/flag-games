import { Country, getFlagUrl } from './countries';
import { sound } from './sound';

export type GameMode = 'first_out' | 'last_survivor' | 'endless';

export interface RingGap {
  startAngle: number; // in radians, relative to ring angle
  size: number;       // angular width in radians
}

export interface Ring {
  radius: number;
  thickness: number;
  angle: number;
  speed: number;       // angular velocity in rad/frame
  gaps: RingGap[];
  color: string;
}

export interface Marble {
  id: string;
  country: Country;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  angularVelocity: number;
  escaped: boolean;
  escapeTime: number | null;
  currentRingLevel: number; // 0 = inner, 1 = mid, 2 = outer, 3 = escaped
  img: HTMLImageElement | null;
  imgLoaded: boolean;
  flashTimer: number; // for hit glow
}

export interface FinishedMarble {
  rank: number;
  country: Country;
  escapeTime: number;
  isWinner: boolean;
}

export interface RaceConfig {
  marbleCount: number;
  mode: GameMode;
  speedMultiplier: number;
  soundEnabled: boolean;
  ringSpeedFactor: number;
  continuousTimer?: boolean;
}

export interface HitParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class RaceEngine {
  public center = { x: 210, y: 210 };
  public arenaRadius = 195;
  public coreRadius = 20;

  public rings: Ring[] = [];
  public marbles: Marble[] = [];
  public finished: FinishedMarble[] = [];
  public particles: HitParticle[] = [];

  public config: RaceConfig = {
    marbleCount: 10,
    mode: 'last_survivor',
    speedMultiplier: 1,
    soundEnabled: true,
    ringSpeedFactor: 1,
  };

  public isRunning: boolean = false;
  public isGameOver: boolean = false;
  public winner: FinishedMarble | null = null;
  public elapsedTime: number = 0; // in seconds

  private lastTime: number = 0;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor() {
    this.initRings();
  }

  public initRings() {
    // 3 Concentric rings
    this.rings = [
      {
        radius: 68,
        thickness: 10,
        angle: 0,
        speed: 0.016,
        gaps: [
          { startAngle: 0, size: 0.85 } // ~48 degrees
        ],
        color: '#7dd3fc', // sky-300
      },
      {
        radius: 124,
        thickness: 10,
        angle: Math.PI * 0.7,
        speed: -0.014,
        gaps: [
          { startAngle: 0, size: 0.75 },
          { startAngle: Math.PI, size: 0.75 }
        ],
        color: '#38bdf8', // sky-400
      },
      {
        radius: 180,
        thickness: 11,
        angle: Math.PI * 1.3,
        speed: 0.011,
        gaps: [
          { startAngle: 0, size: 0.8 },
          { startAngle: Math.PI * 1.05, size: 0.78 }
        ],
        color: '#0284c7', // sky-600
      }
    ];
  }

  public start() {
    this.isRunning = true;
  }

  public pause() {
    this.isRunning = false;
  }

  public togglePlay(): boolean {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }

  public setSpeed(s: number) {
    this.config.speedMultiplier = s;
  }

  public setSound(enabled: boolean) {
    this.config.soundEnabled = enabled;
  }

  public setConfig(cfg: Partial<RaceConfig>) {
    this.config = { ...this.config, ...cfg };
  }

  public getRemainingCount(): number {
    return this.marbles.filter((m) => !m.escaped).length;
  }

  public resetRace(countries: Country[]) {
    this.isRunning = false;
    this.isGameOver = false;
    this.winner = null;
    this.elapsedTime = 0;
    this.finished = [];
    this.particles = [];
    this.initRings();

    const count = Math.min(countries.length, this.config.marbleCount);
    const selected = countries.slice(0, count);

    // Dynamic radius based on count so marbles fit comfortably inside innermost ring (radius 68, core 20)
    let marbleRadius = 14;
    if (count > 12) marbleRadius = 12;
    if (count > 20) marbleRadius = 10;
    if (count > 25) marbleRadius = 9;

    this.marbles = selected.map((country, idx) => {
      // Preload image
      const flagUrl = getFlagUrl(country.code);
      let img = this.imageCache.get(flagUrl) || null;
      if (!img && typeof window !== 'undefined') {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = flagUrl;
        this.imageCache.set(flagUrl, img);
      }

      // Distribute in innermost annular zone (between coreRadius + marbleRadius and ring[0].radius - marbleRadius)
      const minSpawnR = this.coreRadius + marbleRadius + 4;
      const maxSpawnR = this.rings[0].radius - marbleRadius - 6;
      const spawnR = minSpawnR + Math.random() * (maxSpawnR - minSpawnR);
      const angle = (idx / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;

      const x = this.center.x + Math.cos(angle) * spawnR;
      const y = this.center.y + Math.sin(angle) * spawnR;

      // Initial velocity
      const initSpeed = 1.6 + Math.random() * 0.8;
      const velAngle = Math.random() * Math.PI * 2;
      const vx = Math.cos(velAngle) * initSpeed;
      const vy = Math.sin(velAngle) * initSpeed;

      return {
        id: `${country.code}-${idx}-${Date.now()}`,
        country,
        x,
        y,
        vx,
        vy,
        radius: marbleRadius,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.1,
        escaped: false,
        escapeTime: null,
        currentRingLevel: 0,
        img,
        imgLoaded: img ? img.complete : false,
        flashTimer: 0,
      };
    });

    this.lastTime = performance.now();
  }

  public update(dt: number) {
    if (!this.isRunning || this.isGameOver) return;

    // Apply speed multiplier
    const simSteps = Math.max(1, Math.round(this.config.speedMultiplier * 2));
    const subDt = (dt * this.config.speedMultiplier) / simSteps;

    this.elapsedTime += dt * this.config.speedMultiplier;

    for (let step = 0; step < simSteps; step++) {
      this.subStep(subDt);
    }

    // Update particle lifetimes
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 2.5;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private subStep(dt: number) {
    // 1. Rotate rings
    for (const ring of this.rings) {
      ring.angle = (ring.angle + ring.speed * this.config.ringSpeedFactor * (dt * 60)) % (Math.PI * 2);
      if (ring.angle < 0) ring.angle += Math.PI * 2;
    }

    // 2. Update marbles position
    for (const marble of this.marbles) {
      if (marble.escaped) continue;

      marble.x += marble.vx * (dt * 60);
      marble.y += marble.vy * (dt * 60);

      // Subtle angular spin based on speed
      marble.angle += marble.angularVelocity;
      if (marble.flashTimer > 0) {
        marble.flashTimer -= dt * 4;
      }

      // Air resistance / speed cap
      const currentSpeed = Math.hypot(marble.vx, marble.vy);
      if (currentSpeed > 5.5) {
        marble.vx = (marble.vx / currentSpeed) * 5.5;
        marble.vy = (marble.vy / currentSpeed) * 5.5;
      } else if (currentSpeed < 1.0) {
        // Prevent marble from stopping completely (perpetual gentle bounce)
        const boost = 1.4 / Math.max(currentSpeed, 0.1);
        marble.vx *= boost;
        marble.vy *= boost;
      }
    }

    // 3. Central Core collision
    for (const marble of this.marbles) {
      if (marble.escaped) continue;

      const dx = marble.x - this.center.x;
      const dy = marble.y - this.center.y;
      const dist = Math.hypot(dx, dy);
      const minCoreDist = this.coreRadius + marble.radius;

      if (dist < minCoreDist && dist > 0.001) {
        // Normal pointing outwards from core
        const nx = dx / dist;
        const ny = dy / dist;

        // Push outside core
        marble.x = this.center.x + nx * (minCoreDist + 0.5);
        marble.y = this.center.y + ny * (minCoreDist + 0.5);

        // Reflect velocity
        const dot = marble.vx * nx + marble.vy * ny;
        if (dot < 0) {
          marble.vx = (marble.vx - 1.95 * dot * nx);
          marble.vy = (marble.vy - 1.95 * dot * ny);
          this.spawnHitParticles(marble.x, marble.y, '#38bdf8', 4);
          sound.playWallCollision(Math.abs(dot) * 0.8);
          marble.flashTimer = 1;
        }
      }
    }

    // 4. Ring Arc Collisions
    for (const marble of this.marbles) {
      if (marble.escaped) continue;

      const dx = marble.x - this.center.x;
      const dy = marble.y - this.center.y;
      const dist = Math.hypot(dx, dy);

      // Check if marble completely escaped outer ring
      const outerRing = this.rings[this.rings.length - 1];
      if (dist > outerRing.radius + outerRing.thickness / 2 + marble.radius + 6) {
        this.handleEscape(marble);
        continue;
      }

      // Check each ring
      for (let rIdx = 0; rIdx < this.rings.length; rIdx++) {
        const ring = this.rings[rIdx];
        const halfThick = ring.thickness / 2;
        const collisionThreshold = halfThick + marble.radius;

        // Is marble radially near the ring?
        const radialDiff = Math.abs(dist - ring.radius);
        if (radialDiff < collisionThreshold && dist > 0.001) {
          // Angle of marble relative to center
          let marbleAngle = Math.atan2(dy, dx);
          if (marbleAngle < 0) marbleAngle += Math.PI * 2;

          // Check if marble angle falls in any gap
          let inGap = false;
          let nearestTipAngle: number | null = null;
          let minTipAngularDist = Infinity;

          for (const gap of ring.gaps) {
            // Gap range in global angle space
            let gStart = (ring.angle + gap.startAngle) % (Math.PI * 2);
            if (gStart < 0) gStart += Math.PI * 2;
            let gEnd = (gStart + gap.size) % (Math.PI * 2);

            // Angular margin for marble passing through gap
            const angularRadius = (marble.radius * 0.75) / ring.radius;

            const isAngleInArc = (angle: number, start: number, end: number) => {
              if (start <= end) {
                return angle >= start && angle <= end;
              } else {
                return angle >= start || angle <= end;
              }
            };

            // Check if within clear gap area (with small margin for edge collision)
            const gapStartWithMargin = (gStart + angularRadius) % (Math.PI * 2);
            const gapEndWithMargin = (gEnd - angularRadius + Math.PI * 2) % (Math.PI * 2);

            if (gap.size > angularRadius * 2) {
              if (isAngleInArc(marbleAngle, gapStartWithMargin, gapEndWithMargin)) {
                inGap = true;
                break;
              }
            }

            // Keep track of gap tips for realistic corner bounces
            const tip1Dist = Math.abs(this.angularDistance(marbleAngle, gStart));
            const tip2Dist = Math.abs(this.angularDistance(marbleAngle, gEnd));
            if (tip1Dist < minTipAngularDist) {
              minTipAngularDist = tip1Dist;
              nearestTipAngle = gStart;
            }
            if (tip2Dist < minTipAngularDist) {
              minTipAngularDist = tip2Dist;
              nearestTipAngle = gEnd;
            }
          }

          if (inGap) {
            // Freely passing through gap! Update currentRingLevel
            if (dist > ring.radius && marble.currentRingLevel === rIdx) {
              marble.currentRingLevel = rIdx + 1;
            }
            continue;
          }

          // Check corner tip collision if very close to a tip
          if (nearestTipAngle !== null && minTipAngularDist < (marble.radius + halfThick) / ring.radius) {
            const tipX = this.center.x + Math.cos(nearestTipAngle) * ring.radius;
            const tipY = this.center.y + Math.sin(nearestTipAngle) * ring.radius;
            const tipDx = marble.x - tipX;
            const tipDy = marble.y - tipY;
            const tipDist = Math.hypot(tipDx, tipDy);
            const tipMinDist = marble.radius + halfThick;

            if (tipDist < tipMinDist && tipDist > 0.001) {
              const nx = tipDx / tipDist;
              const ny = tipDy / tipDist;

              marble.x = tipX + nx * (tipMinDist + 0.5);
              marble.y = tipY + ny * (tipMinDist + 0.5);

              // Angular velocity of ring wall at tip
              const wallVx = -ring.speed * this.config.ringSpeedFactor * 60 * Math.sin(nearestTipAngle) * ring.radius * 0.015;
              const wallVy = ring.speed * this.config.ringSpeedFactor * 60 * Math.cos(nearestTipAngle) * ring.radius * 0.015;

              const relVx = marble.vx - wallVx;
              const relVy = marble.vy - wallVy;
              const dot = relVx * nx + relVy * ny;

              if (dot < 0) {
                const rest = 0.90;
                marble.vx = wallVx + (relVx - (1 + rest) * dot * nx);
                marble.vy = wallVy + (relVy - (1 + rest) * dot * ny);
                sound.playWallCollision(Math.abs(dot) * 0.8);
                this.spawnHitParticles(marble.x, marble.y, ring.color, 3);
                marble.flashTimer = 1;
              }
              continue;
            }
          }

          // Standard circular arc wall bounce
          // Radial unit normal
          const nx = dx / dist;
          const ny = dy / dist;

          const isInside = dist < ring.radius;
          const wallNormalX = isInside ? -nx : nx;
          const wallNormalY = isInside ? -ny : ny;

          // Reposition marble flush with arc surface
          const targetDist = isInside
            ? ring.radius - collisionThreshold - 0.2
            : ring.radius + collisionThreshold + 0.2;

          marble.x = this.center.x + nx * targetDist;
          marble.y = this.center.y + ny * targetDist;

          // Linear velocity of rotating wall at this contact point
          const wallVx = -ring.speed * this.config.ringSpeedFactor * (dy) * 0.4;
          const wallVy = ring.speed * this.config.ringSpeedFactor * (dx) * 0.4;

          const relVx = marble.vx - wallVx;
          const relVy = marble.vy - wallVy;

          const dot = relVx * wallNormalX + relVy * wallNormalY;
          if (dot < 0) {
            const restitution = 0.91;
            marble.vx = wallVx + (relVx - (1 + restitution) * dot * wallNormalX);
            marble.vy = wallVy + (relVy - (1 + restitution) * dot * wallNormalY);

            // Give a little tangential friction/spin
            marble.angularVelocity += (marble.vx * wallNormalY - marble.vy * wallNormalX) * 0.02;

            sound.playWallCollision(Math.abs(dot));
            this.spawnHitParticles(marble.x, marble.y, ring.color, 4);
            marble.flashTimer = 1;
          }
        }
      }
    }

    // 5. Marble-to-Marble Elastic Collisions
    const len = this.marbles.length;
    for (let i = 0; i < len; i++) {
      const m1 = this.marbles[i];
      if (m1.escaped) continue;

      for (let j = i + 1; j < len; j++) {
        const m2 = this.marbles[j];
        if (m2.escaped) continue;

        const dx = m2.x - m1.x;
        const dy = m2.y - m1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = m1.radius + m2.radius;

        if (dist < minDist && dist > 0.001) {
          // Normal vector
          const nx = dx / dist;
          const ny = dy / dist;

          // Separate them equally
          const overlap = minDist - dist;
          m1.x -= nx * (overlap * 0.5 + 0.1);
          m1.y -= ny * (overlap * 0.5 + 0.1);
          m2.x += nx * (overlap * 0.5 + 0.1);
          m2.y += ny * (overlap * 0.5 + 0.1);

          // Relative velocity
          const kx = m1.vx - m2.vx;
          const ky = m1.vy - m2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2; // Equal mass

          if (p > 0) {
            const restitution = 0.92;
            m1.vx -= p * 0.5 * (1 + restitution) * nx;
            m1.vy -= p * 0.5 * (1 + restitution) * ny;
            m2.vx += p * 0.5 * (1 + restitution) * nx;
            m2.vy += p * 0.5 * (1 + restitution) * ny;

            sound.playMarbleCollision(Math.abs(p));
            this.spawnHitParticles((m1.x + m2.x) * 0.5, (m1.y + m2.y) * 0.5, '#ffffff', 2);
            m1.flashTimer = 0.6;
            m2.flashTimer = 0.6;
          }
        }
      }
    }
  }

  private angularDistance(a1: number, a2: number): number {
    let diff = (a1 - a2) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return diff;
  }

  private handleEscape(marble: Marble) {
    marble.escaped = true;
    marble.escapeTime = this.elapsedTime;
    marble.currentRingLevel = 3;

    sound.playEscapeSound();

    // Spawn rich escape fireworks/particles
    this.spawnHitParticles(marble.x, marble.y, '#38bdf8', 14);
    this.spawnHitParticles(marble.x, marble.y, '#f59e0b', 8);

    const rank = this.finished.length + 1;
    const isWinner = this.config.mode === 'first_out' && rank === 1;

    const finishedEntry: FinishedMarble = {
      rank,
      country: marble.country,
      escapeTime: this.elapsedTime,
      isWinner,
    };

    this.finished.push(finishedEntry);

    // Endless Mode: Time never ends, timer continuously runs, marbles respawn!
    if (this.config.mode === 'endless') {
      const minSpawnR = this.coreRadius + marble.radius + 4;
      const maxSpawnR = this.rings[0].radius - marble.radius - 6;
      const spawnR = minSpawnR + Math.random() * (maxSpawnR - minSpawnR);
      const angle = Math.random() * Math.PI * 2;
      marble.x = this.center.x + Math.cos(angle) * spawnR;
      marble.y = this.center.y + Math.sin(angle) * spawnR;
      const initSpeed = 1.6 + Math.random() * 0.8;
      const velAngle = Math.random() * Math.PI * 2;
      marble.vx = Math.cos(velAngle) * initSpeed;
      marble.vy = Math.sin(velAngle) * initSpeed;
      marble.escaped = false;
      marble.currentRingLevel = 0;
      marble.flashTimer = 1.8;
      this.isGameOver = false;
      this.isRunning = true;
      return;
    }

    // Check game over logic
    if (this.config.mode === 'first_out') {
      this.winner = finishedEntry;
      this.isGameOver = true;
      if (!this.config.continuousTimer) {
        this.isRunning = false;
      }
      sound.playWinnerFanfare();
    } else {
      // Last Survivor Wins
      const remaining = this.marbles.filter(m => !m.escaped);
      if (remaining.length === 1) {
        // The lone survivor remaining is the winner!
        const survivor = remaining[0];
        survivor.escaped = true;
        survivor.escapeTime = this.elapsedTime;
        const winnerEntry: FinishedMarble = {
          rank: 1, // 1st Place Champion
          country: survivor.country,
          escapeTime: this.elapsedTime,
          isWinner: true,
        };
        // In Last Survivor mode, the survivor is the Champion!
        this.winner = winnerEntry;
        this.finished.unshift(winnerEntry); // Place at head of finished list
        // Adjust other ranks
        for (let i = 1; i < this.finished.length; i++) {
          this.finished[i].rank = i + 1;
        }
        this.isGameOver = true;
        this.isRunning = false;
        sound.playWinnerFanfare();
      } else if (remaining.length === 0) {
        // If all somehow exited, the very last one that exited is the winner
        if (this.finished.length > 0) {
          const lastEscaped = this.finished[this.finished.length - 1];
          lastEscaped.isWinner = true;
          this.winner = lastEscaped;
        }
        this.isGameOver = true;
        this.isRunning = false;
        sound.playWinnerFanfare();
      }
    }
  }

  private spawnHitParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }
}
