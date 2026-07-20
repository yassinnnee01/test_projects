/**
 * audio.js
 * Synthesizes high-fidelity sound effects using the browser Web Audio API.
 * Eliminates the need for external asset loading (.mp3/wav) and guarantees instant playback.
 */

let audioCtx = null;
let soundEnabled = true;

/**
 * Initializes and retrieves the browser AudioContext lazily.
 * Resolves browser restrictions around autoplay and user gesture requirements.
 * @returns {AudioContext|null} Web Audio Context instance
 */
function getAudioContext() {
  if (!soundEnabled) return null;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(err => console.warn("Failed to resume AudioContext:", err));
  }
  
  return audioCtx;
}

/**
 * Set the state of audio globally.
 * @param {boolean} enabled - True to enable sound, false to mute
 */
export function setSoundEnabled(enabled) {
  soundEnabled = !!enabled;
  if (!soundEnabled && audioCtx) {
    audioCtx.close().then(() => {
      audioCtx = null;
    });
  }
}

/**
 * Synthesizes a soft, clean UI click sound.
 */
export function playClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

/**
 * Synthesizes a subtle cell selection pop.
 */
export function playSelect() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.03);

  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.03);
}

/**
 * Synthesizes a sweeping whoosh sound for erasing cells.
 */
export function playErase() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(750, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

/**
 * Synthesizes a dissonant, low warning tone for mistakes/errors.
 */
export function playError() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.35;

  // Use two oscillators with slightly offset frequencies to create an unpleasant beating effect
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(120, now);
  
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(124, now);

  gainNode.gain.setValueAtTime(0.12, now);
  gainNode.gain.linearRampToValueAtTime(0.001, now + duration);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start();
  osc2.start();
  
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

/**
 * Synthesizes a short, rising arpeggio for a correct number entry.
 */
export function playSuccess() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Note 1: E5 (659Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(659.25, now);
  gain1.gain.setValueAtTime(0.06, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start();
  osc1.stop(now + 0.1);

  // Note 2: A5 (880Hz) playing 0.06s later
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880.00, now + 0.06);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(0.06, now + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.06);
  osc2.stop(now + 0.22);
}

/**
 * Synthesizes an arpeggiated major-seventh chord victory fanfare.
 */
export function playWin() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Major arpeggio details: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const tempo = 0.08; // Duration offset between notes

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // End note is a rich mix of sine + triangle, other notes are pure sines
    osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now + (idx * tempo));
    
    // Add a tiny vibrato to the final note for vintage arcade texture
    if (idx === notes.length - 1) {
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 6; // LFO speed
      vibratoGain.gain.value = 10; // Vibrato depth (Hz)
      
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      vibrato.start(now + (idx * tempo));
      vibrato.stop(now + 1.2);
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(idx === notes.length - 1 ? 0.08 : 0.05, now + (idx * tempo));
    
    const decayDuration = idx === notes.length - 1 ? 0.8 : 0.2;
    gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * tempo) + decayDuration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + (idx * tempo));
    osc.stop(now + (idx * tempo) + decayDuration + 0.1);
  });
}
