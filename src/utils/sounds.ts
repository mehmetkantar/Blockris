// Sound utility functions
// Using Web Audio API for simple sound effects

class SoundManager {
  private context: AudioContext | null = null;
  private isMuted: boolean = false;
  private backgroundMusicGain: GainNode | null = null;
  private isBackgroundMusicPlaying: boolean = false;

  constructor() {
    // Initialize AudioContext on first user interaction
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;

    // Control background music volume
    if (this.backgroundMusicGain) {
      this.backgroundMusicGain.gain.setValueAtTime(
        muted ? 0 : 0.15,
        this.context?.currentTime || 0
      );
    }
  }

  // Call this on first user interaction to initialize audio
  async init() {
    return await this.ensureContext();
  }

  private async ensureContext() {
    if (!this.context) return false;

    // Resume context if suspended (required by browser autoplay policy)
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        return false;
      }
    }

    return true;
  }

  private async createOscillator(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (this.isMuted) return;

    const contextReady = await this.ensureContext();
    if (!contextReady || !this.context) return;

    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    } catch (error) {
      console.error('Failed to create oscillator:', error);
    }
  }

  async playPlace() {
    // Short tap sound
    const contextReady = await this.ensureContext();
    if (!contextReady || this.isMuted) return;
    await this.createOscillator(440, 0.1, 'sine');
  }

  async playClear() {
    // Line clear sound - rising tone
    const contextReady = await this.ensureContext();
    if (!contextReady || this.isMuted) return;

    const frequencies = [523, 659, 784]; // C, E, G
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator(freq, 0.15, 'square');
      }, i * 50);
    });
  }

  async playGameOver() {
    // Descending tone
    const contextReady = await this.ensureContext();
    if (!contextReady || this.isMuted) return;

    const frequencies = [392, 349, 294, 262]; // G, F, D, C
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator(freq, 0.2, 'triangle');
      }, i * 100);
    });
  }

  async playCombo() {
    // Quick ascending tone
    const contextReady = await this.ensureContext();
    if (!contextReady || this.isMuted) return;

    await this.createOscillator(880, 0.08, 'square');
    setTimeout(() => this.createOscillator(1047, 0.08, 'square'), 60);
  }

  async playFullClear() {
    // Victory sound - complex ascending pattern
    const contextReady = await this.ensureContext();
    if (!contextReady || this.isMuted) return;

    const pattern = [523, 659, 784, 1047, 1319]; // C, E, G, C, E
    pattern.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator(freq, 0.12, 'sine');
      }, i * 80);
    });
  }

  async startBackgroundMusic() {
    const contextReady = await this.ensureContext();
    if (!contextReady || !this.context || this.isBackgroundMusicPlaying) return;

    this.isBackgroundMusicPlaying = true;

    // Create gain node for background music
    this.backgroundMusicGain = this.context.createGain();
    this.backgroundMusicGain.connect(this.context.destination);
    this.backgroundMusicGain.gain.setValueAtTime(
      this.isMuted ? 0 : 0.15,
      this.context.currentTime
    );

    // Simple looping melody - Tetris-inspired
    const melody = [
      { note: 659, duration: 0.4 },  // E
      { note: 494, duration: 0.2 },  // B
      { note: 523, duration: 0.2 },  // C
      { note: 587, duration: 0.4 },  // D
      { note: 523, duration: 0.2 },  // C
      { note: 494, duration: 0.2 },  // B
      { note: 440, duration: 0.4 },  // A
      { note: 440, duration: 0.2 },  // A
      { note: 523, duration: 0.2 },  // C
      { note: 659, duration: 0.4 },  // E
      { note: 587, duration: 0.2 },  // D
      { note: 523, duration: 0.2 },  // C
      { note: 494, duration: 0.6 },  // B
      { note: 523, duration: 0.2 },  // C
      { note: 587, duration: 0.4 },  // D
      { note: 659, duration: 0.4 },  // E
      { note: 523, duration: 0.4 },  // C
      { note: 440, duration: 0.4 },  // A
      { note: 440, duration: 0.4 },  // A
    ];

    const playMelody = () => {
      if (!this.isBackgroundMusicPlaying || !this.context || !this.backgroundMusicGain) return;

      let currentTime = 0;
      melody.forEach(({ note, duration }) => {
        setTimeout(() => {
          if (!this.isBackgroundMusicPlaying || !this.context || !this.backgroundMusicGain) return;

          try {
            const oscillator = this.context.createOscillator();
            const noteGain = this.context.createGain();

            oscillator.connect(noteGain);
            noteGain.connect(this.backgroundMusicGain);

            oscillator.frequency.value = note;
            oscillator.type = 'triangle';

            noteGain.gain.setValueAtTime(0.3, this.context.currentTime);
            noteGain.gain.exponentialRampToValueAtTime(
              0.01,
              this.context.currentTime + duration
            );

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
          } catch (error) {
            console.error('Error playing background music note:', error);
          }
        }, currentTime * 1000);

        currentTime += duration;
      });

      // Loop the melody
      setTimeout(() => {
        if (this.isBackgroundMusicPlaying) {
          playMelody();
        }
      }, currentTime * 1000);
    };

    playMelody();
  }

  stopBackgroundMusic() {
    this.isBackgroundMusicPlaying = false;

    if (this.backgroundMusicGain) {
      this.backgroundMusicGain.disconnect();
      this.backgroundMusicGain = null;
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();
