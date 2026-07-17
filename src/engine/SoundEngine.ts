// Generates the mechanical "tick" of a flap turning entirely in-browser via
// the Web Audio API. No sample files: every tick is a short burst of filtered
// noise plus a percussive click, synthesized fresh so pitch/volume can be
// randomized per-tile without needing dozens of sample variations.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _enabled = true;
  private _volume = 0.35;
  private noiseBufferPool: AudioBuffer[] = [];
  private activeTicks = 0;
  private readonly MAX_CONCURRENT_TICKS = 24;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
      this.buildNoisePool(this.ctx);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Generates a handful of noise-burst buffer variants once, up front,
   * instead of re-randomizing ~2200 samples on every single tick() call.
   * With hundreds of ticks firing in a burst (e.g. the startup sweep),
   * that per-tick allocation + fill was real, avoidable CPU work — a
   * small fixed pool sounds effectively identical (variance still comes
   * from the pitch/volume jitter layered on top) at a fraction of the cost. */
  private buildNoisePool(ctx: AudioContext) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const poolSize = 6;
    for (let p = 0; p < poolSize; p++) {
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const decay = 1 - i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * decay * decay;
      }
      this.noiseBufferPool.push(buffer);
    }
  }

  set enabled(v: boolean) {
    this._enabled = v;
  }
  get enabled() {
    return this._enabled;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this._volume;
  }
  get volume() {
    return this._volume;
  }

  /** Unlocks the AudioContext on first user gesture (autoplay policy). */
  unlock() {
    this.ensureContext();
  }

  /**
   * Plays one flap tick. pitchJitter and volumeJitter are small random
   * offsets (already computed by the caller) so no two tiles ever sound
   * identical, mimicking mechanical variance between physical units.
   */
  tick(pitchJitter = 0, volumeJitter = 0) {
    if (!this._enabled) return;
    // During a burst (e.g. the startup sweep), hundreds of tiles can tick
    // within an overlapping window — each tick spins up ~7-8 Web Audio
    // nodes (buffer source, 2 oscillators, gains, filter), so letting that
    // go unbounded is real audio-graph overhead, and a real physical board
    // wouldn't sound louder with more simultaneous flaps either (they mask
    // each other acoustically). Silently dropping the tick when already at
    // the cap is inaudible in practice — it's dropping into an already-busy
    // moment, not silence.
    if (this.activeTicks >= this.MAX_CONCURRENT_TICKS) return;
    this.activeTicks++;
    setTimeout(() => {
      this.activeTicks--;
    }, 80);

    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const gain = this.masterGain!;

    // Layer 1: filtered noise burst (the "flap" sound) — deeper and longer
    // than a light click, to read as a heavier physical mechanism
    const buffer =
      this.noiseBufferPool[Math.floor(Math.random() * this.noiseBufferPool.length)];
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1400 + pitchJitter * 1200;
    bandpass.Q.value = 0.9;

    const noiseGain = ctx.createGain();
    const vol = 0.28 + volumeJitter;
    noiseGain.gain.setValueAtTime(Math.max(0.04, vol), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(bandpass).connect(noiseGain).connect(gain);
    noise.start(now);
    noise.stop(now + 0.055);

    // Layer 2: percussive click (the "clack" of the flap hitting its stop)
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(95 + pitchJitter * 40, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.028);

    const oscGain = ctx.createGain();
    const clickVol = 0.2 + volumeJitter * 0.5;
    oscGain.gain.setValueAtTime(Math.max(0.03, clickVol), now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(oscGain).connect(gain);
    osc.start(now);
    osc.stop(now + 0.04);

    // Layer 3: low-frequency thud for physical weight — a real flap has
    // mass, and this is the part that sells that on small speakers
    const thud = ctx.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(80 + pitchJitter * 15, now);
    thud.frequency.exponentialRampToValueAtTime(38, now + 0.05);

    const thudGain = ctx.createGain();
    const thudVol = 0.16 + volumeJitter * 0.4;
    thudGain.gain.setValueAtTime(Math.max(0.02, thudVol), now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    thud.connect(thudGain).connect(gain);
    thud.start(now);
    thud.stop(now + 0.075);
  }
}

export const soundEngine = new SoundEngine();