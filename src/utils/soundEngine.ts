// Web Audio API sound effects engine for MasterChef alerts (purely sound effects, no voice)

export type AlertSoundType =
  | 'interval-15'
  | 'last-10'
  | 'last-5'
  | 'last-1'
  | 'final-tick'
  | 'finish';

class MasterChefSoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTone(
    freq: number,
    duration: number,
    startTimeOffset = 0,
    type: OscillatorType = 'triangle',
    peakGain = 0.35
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + startTimeOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public triggerAlertSound(type: AlertSoundType, muted = false) {
    if (muted) return;

    switch (type) {
      case 'interval-15':
        // Studio double resonant gong chime (15 em 15 minutos)
        this.playTone(523.25, 0.5, 0, 'triangle', 0.45); // C5
        this.playTone(659.25, 0.5, 0, 'sine', 0.3); // E5 harmonic
        this.playTone(783.99, 0.8, 0.28, 'triangle', 0.5); // G5
        this.playTone(1046.5, 0.9, 0.28, 'sine', 0.35); // C6
        break;

      case 'last-10':
        // Dramatic 3-note ascending alert (Últimos 10 minutos)
        this.playTone(440, 0.32, 0, 'sawtooth', 0.32); // A4
        this.playTone(554.37, 0.32, 0.22, 'sawtooth', 0.35); // C#5
        this.playTone(659.25, 0.75, 0.44, 'sawtooth', 0.42); // E5
        this.playTone(880, 0.9, 0.44, 'triangle', 0.38); // A5
        break;

      case 'last-5':
        // High-urgency 4-pulse kitchen pressure alert (Últimos 5 minutos)
        for (let i = 0; i < 4; i++) {
          this.playTone(698.46, 0.22, i * 0.22, 'sawtooth', 0.38); // F5
          this.playTone(880, 0.22, i * 0.22, 'triangle', 0.38); // A5
        }
        this.playTone(1046.5, 0.95, 0.9, 'sawtooth', 0.45); // C6
        break;

      case 'last-1':
        // Dramatic rapid siren chime (Último 1 minuto!)
        for (let i = 0; i < 6; i++) {
          const freq = i % 2 === 0 ? 880 : 1174.66; // A5 / D6
          this.playTone(freq, 0.18, i * 0.16, 'sawtooth', 0.45);
        }
        this.playTone(1318.51, 1.1, 1.0, 'triangle', 0.55);
        break;

      case 'final-tick':
        // Crisp broadcast studio second tick (last 10 seconds)
        this.playTone(1200, 0.08, 0, 'sine', 0.28);
        break;

      case 'finish':
        // MasterChef Time's Up Grand Horn & Gong ("Mãos para cima!")
        this.playTone(220, 1.8, 0, 'sawtooth', 0.5);
        this.playTone(277.18, 1.8, 0, 'sawtooth', 0.42);
        this.playTone(329.63, 1.8, 0, 'sawtooth', 0.45);
        this.playTone(440, 2.0, 0, 'triangle', 0.55);
        this.playTone(880, 2.0, 0.15, 'sine', 0.45);
        break;
    }
  }
}

export const soundEngine = new MasterChefSoundEngine();
