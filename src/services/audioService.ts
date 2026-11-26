/**
 * Procedural Web Audio Engine for "Our Little Universe".
 * Never autoplays before explicit user interaction.
 */
class MuseumAudioService {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private musicPlaying = false;
  private chordTimer: number | null = null;
  private sfxEnabled = true;
  private musicEnabled = true;
  private lastFootstepAt = 0;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) {
          if (this.ctx.state === 'running') {
            void this.ctx.suspend();
          }
        } else if (this.musicEnabled && this.musicPlaying && this.ctx.state === 'suspended') {
          void this.ctx.resume();
        }
      });
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopAmbientMusic();
    } else {
      this.startAmbientMusic();
    }
  }

  unlockAndStartMusic() {
    if (!this.musicEnabled) return;
    this.startAmbientMusic();
  }

  startAmbientMusic() {
    if (this.musicPlaying || !this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicGain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 2.5);
    this.musicGain.connect(ctx.destination);
    this.musicPlaying = true;

    // Warm museum ambient progression (Fmaj7 -> Cmaj7 -> Am9 -> G6)
    const chords = [
      [174.61, 220.0, 261.63, 329.63],
      [130.81, 196.0, 246.94, 329.63],
      [110.0, 196.0, 261.63, 329.63],
      [98.0, 196.0, 246.94, 293.66],
    ];
    let step = 0;

    const triggerChord = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const notes = chords[step % chords.length];
      step += 1;

      for (const freq of notes) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const env = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(620, now);

        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(0.18, now + 1.6);
        env.gain.exponentialRampToValueAtTime(0.0008, now + 5.8);

        osc.connect(filter);
        filter.connect(env);
        env.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 6.0);
      }
    };

    triggerChord();
    this.chordTimer = window.setInterval(triggerChord, 5400);
  }

  stopAmbientMusic() {
    this.musicPlaying = false;
    if (this.chordTimer !== null) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      } catch {
        // ignore ramp error
      }
    }
  }

  playFootstep() {
    if (!this.sfxEnabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastFootstepAt < 380) return;
    this.lastFootstepAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95 + Math.random() * 14, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.08);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playDoorOpen() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.45);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.68);
  }

  playPhotoInteract() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.055, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.38);
    });
  }

  playRoomTransition() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.35);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.58);
  }
}

export const audioService = new MuseumAudioService();
