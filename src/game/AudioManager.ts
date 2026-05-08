/**
 * AudioManager — Motor V6 Twin-Turbo realista + Música Phonk/Drift
 * Basado en características de GTR VR38DETT y Aventador SVJ
 *
 * Sonidos:
 *  - Cuenta regresiva: beeps 3-2-1 y ¡YA!
 *  - Motor V6 Twin-Turbo: síntesis basada en firing order + turbo whistle
 *  - Chirrido de llantas: al frenar / derrapar
 *  - Cruce de meta: fanfarria
 *  - Música Phonk: drift phonk con 808s, cowbell, hi-hats rápidos
 *  - Fin de carrera: jingle de victoria
 */
export class AudioManager {
  private ctx: AudioContext;
  private masterGain: GainNode;

  // Motor
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineOsc3: OscillatorNode | null = null;
  private engineNoise: AudioBufferSourceNode | null = null;
  private engineGain: GainNode | null = null;
  private engineNoiseGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  
  // Turbo
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;

  // Chirrido
  private tireOsc: OscillatorNode | null = null;
  private tireGain: GainNode | null = null;

  // Música
  private musicNodes: AudioNode[] = [];
  private musicScheduled = false;
  private musicLoopId: ReturnType<typeof setTimeout> | null = null;

  // Estado
  private started = false;
  private countdownBeepStep = -1;
  private currentGear = 0;  // 0=N, 1-6=marchas

  // Marchas: [velocidad mínima en m/s, velocidad máxima en m/s]
  // 1ª: 0–55 km/h, 2ª: 50–95, 3ª: 85–135, 4ª: 125–180, 5ª: 165–225, 6ª: 210–270, 7ª: 255–340
  private static readonly GEAR_RANGES: [number, number][] = [
    [0,    0   ],  // N (neutral)
    [0,    15.3],  // 1ª  0–55 km/h
    [13.9, 26.4],  // 2ª  50–95 km/h
    [23.6, 37.5],  // 3ª  85–135 km/h
    [34.7, 50.0],  // 4ª  125–180 km/h
    [45.8, 62.5],  // 5ª  165–225 km/h
    [58.3, 75.0],  // 6ª  210–270 km/h
    [70.8, 94.4]   // 7ª  255–340 km/h
  ];

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;
    this.masterGain.connect(this.ctx.destination);
  }

  /** Llamar una vez cuando el usuario interactúa */
  resume(): void {
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  // ── Cuenta regresiva ─────────────────────────────────────────

  tickCountdown(step: number): void {
    if (step === this.countdownBeepStep) return;
    this.countdownBeepStep = step;
    if (step < 3) {
      this.playBeep(step < 3 ? 220 + step * 55 : 880, 0.18, 0.12);
    } else {
      this.playBeep(880, 0.22, 0.08);
      setTimeout(() => this.playBeep(1108, 0.18, 0.08), 60);
      setTimeout(() => this.playBeep(1320, 0.22, 0.12), 120);
    }
  }

  private playBeep(freq: number, vol: number, decay: number): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + decay + 0.3);
  }

  // ── Motor V6 Twin-Turbo ───────────────────────────────────────

  startEngine(): void {
    if (this.started) return;
    this.started = true;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // ── Motor simplificado y limpio ──
    // Oscilador principal
    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc1.type = "sawtooth";
    this.engineOsc1.frequency.value = 80;

    // Segundo oscilador para grosor
    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = "triangle";
    this.engineOsc2.frequency.value = 160;

    // Tercer oscilador sutil
    this.engineOsc3 = ctx.createOscillator();
    this.engineOsc3.type = "sine";
    this.engineOsc3.frequency.value = 240;

    // Filtro suave
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.value = 1200;
    this.engineFilter.Q.value = 1.5;

    // Ruido de escape sutil
    this.engineNoise = ctx.createBufferSource();
    this.engineNoise.buffer = this.createNoiseBuffer(ctx, 2.0);
    this.engineNoise.loop = true;

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineNoiseGain = ctx.createGain();
    this.engineNoiseGain.gain.value = 0;

    // ── Turbo whistle sutil ──
    this.turboOsc = ctx.createOscillator();
    this.turboOsc.type = "sine";
    this.turboOsc.frequency.value = 3000;

    this.turboFilter = ctx.createBiquadFilter();
    this.turboFilter.type = "bandpass";
    this.turboFilter.frequency.value = 3500;
    this.turboFilter.Q.value = 5.0;

    this.turboGain = ctx.createGain();
    this.turboGain.gain.value = 0;

    // Conexiones
    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineOsc3.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineNoise.connect(this.engineNoiseGain);
    this.engineNoiseGain.connect(this.masterGain);

    this.turboOsc.connect(this.turboFilter);
    this.turboFilter.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);

    // Start
    this.engineOsc1.start(now);
    this.engineOsc2.start(now);
    this.engineOsc3.start(now);
    this.engineNoise.start(now);
    this.turboOsc.start(now);

    // Fade-in suave
    this.engineGain.gain.setValueAtTime(0, now);
    this.engineGain.gain.linearRampToValueAtTime(0.15, now + 0.8);
  }

  updateEngine(speed: number, throttle: number, braking: boolean): { gear: number; rpmNorm: number } {
    if (!this.engineOsc1 || !this.engineOsc2 || !this.engineOsc3 || !this.engineGain || !this.engineFilter || !this.engineNoiseGain || !this.turboOsc || !this.turboGain || !this.turboFilter) {
      return { gear: 0, rpmNorm: 0 };
    }

    const absSpeed = Math.abs(speed);
    const now = this.ctx.currentTime;

    // ── Calcular marcha ───────────────────────────────────
    let newGear = 1;
    if (absSpeed < 1) {
      newGear = 0;
    } else {
      const ranges = AudioManager.GEAR_RANGES;
      let g = Math.max(1, this.currentGear === 0 ? 1 : this.currentGear);
      while (g < 7 && absSpeed > ranges[g]![1] * 0.88) g++;
      while (g > 1 && absSpeed < ranges[g - 1]![1] * 0.70) g--;
      newGear = g;
    }

    const gearChanged = newGear !== this.currentGear && this.currentGear !== 0 && newGear !== 0;
    const shiftUp = gearChanged && newGear > this.currentGear;
    this.currentGear = newGear;

    if (gearChanged) this.playGearShift(shiftUp);

    // ── RPM dentro de la marcha ───────────────────────────
    const range = AudioManager.GEAR_RANGES[Math.max(1, Math.min(7, newGear))]!;
    const rangeMin = range[0], rangeMax = range[1];
    const rpmInGear = rangeMax > rangeMin
      ? Math.max(0, Math.min(1, (absSpeed - rangeMin) / (rangeMax - rangeMin)))
      : 0;

    const rpmNorm = Math.max(rpmInGear, throttle * 0.25);

    // ── Frecuencias suaves y agradables ──
    const baseFreq = 80 + rpmNorm * 120;  // 80-260 Hz
    const freq1 = baseFreq;
    const freq2 = baseFreq * 2.0;
    const freq3 = baseFreq * 3.0;

    this.engineOsc1.frequency.setTargetAtTime(freq1, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(freq2, now, 0.08);
    this.engineOsc3.frequency.setTargetAtTime(freq3, now, 0.08);

    // Volumen suave
    const baseVol = 0.08 + rpmNorm * 0.12;
    const vol = braking ? baseVol * 0.70 : baseVol;
    this.engineGain.gain.setTargetAtTime(vol, now, 0.05);

    // Filtro suave
    const filterFreq = 800 + rpmNorm * 2000;
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.10);

    // Ruido de escape sutil
    const noiseVol = throttle * rpmNorm * 0.04;
    this.engineNoiseGain.gain.setTargetAtTime(noiseVol, now, 0.06);

    // Turbo whistle sutil
    const turboSpoolUp = throttle * Math.max(0, rpmNorm - 0.4) * 1.2;
    const turboFreq = 3000 + turboSpoolUp * 3000;
    const turboVol = turboSpoolUp * 0.04;
    
    this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.12);
    this.turboFilter.frequency.setTargetAtTime(turboFreq, now, 0.12);
    this.turboGain.gain.setTargetAtTime(turboVol, now, 0.10);

    return { gear: newGear, rpmNorm };
  }

  /** Cambio de marcha SIMPLE y limpio */
  private playGearShift(shiftUp: boolean): void {
    const now = this.ctx.currentTime;
    if (!this.engineOsc1 || !this.engineOsc2 || !this.engineOsc3 || !this.engineGain || !this.engineFilter) return;

    const curFreq = this.engineOsc1.frequency.value;
    const curVol  = this.engineGain.gain.value;

    if (shiftUp) {
      // Subida: corte rápido y recuperación
      this.engineGain.gain.cancelScheduledValues(now);
      this.engineGain.gain.setValueAtTime(curVol, now);
      this.engineGain.gain.linearRampToValueAtTime(0.02, now + 0.06);
      this.engineGain.gain.linearRampToValueAtTime(curVol * 0.85, now + 0.16);

      // Caída de frecuencia
      this.engineOsc1.frequency.cancelScheduledValues(now);
      this.engineOsc1.frequency.setValueAtTime(curFreq, now);
      this.engineOsc1.frequency.linearRampToValueAtTime(curFreq * 0.65, now + 0.12);

      this.engineOsc2.frequency.cancelScheduledValues(now);
      this.engineOsc2.frequency.setValueAtTime(curFreq * 2.0, now);
      this.engineOsc2.frequency.linearRampToValueAtTime(curFreq * 1.30, now + 0.12);

      this.engineOsc3.frequency.cancelScheduledValues(now);
      this.engineOsc3.frequency.setValueAtTime(curFreq * 3.0, now);
      this.engineOsc3.frequency.linearRampToValueAtTime(curFreq * 1.95, now + 0.12);

      // Pop sutil
      this.playShiftPop(now + 0.04, 0.15);

    } else {
      // Bajada: blip rápido
      this.engineOsc1.frequency.cancelScheduledValues(now);
      this.engineOsc1.frequency.setValueAtTime(curFreq, now);
      this.engineOsc1.frequency.linearRampToValueAtTime(curFreq * 1.45, now + 0.06);
      this.engineOsc1.frequency.linearRampToValueAtTime(curFreq * 1.25, now + 0.14);

      this.engineOsc2.frequency.cancelScheduledValues(now);
      this.engineOsc2.frequency.setValueAtTime(curFreq * 2.0, now);
      this.engineOsc2.frequency.linearRampToValueAtTime(curFreq * 2.90, now + 0.06);
      this.engineOsc2.frequency.linearRampToValueAtTime(curFreq * 2.50, now + 0.14);

      this.engineOsc3.frequency.cancelScheduledValues(now);
      this.engineOsc3.frequency.setValueAtTime(curFreq * 3.0, now);
      this.engineOsc3.frequency.linearRampToValueAtTime(curFreq * 4.35, now + 0.06);
      this.engineOsc3.frequency.linearRampToValueAtTime(curFreq * 3.75, now + 0.14);

      this.engineGain.gain.cancelScheduledValues(now);
      this.engineGain.gain.setValueAtTime(curVol, now);
      this.engineGain.gain.linearRampToValueAtTime(Math.min(0.25, curVol * 1.3), now + 0.06);
      this.engineGain.gain.linearRampToValueAtTime(curVol * 1.05, now + 0.14);
    }
  }

  /** Pop de cambio sutil */
  private playShiftPop(t: number, vol: number): void {
    const ctx = this.ctx;
    const buf = this.createNoiseBuffer(ctx, 0.08);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.09);
  }

  stopEngine(): void {
    if (!this.engineGain) return;
    const now = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(0, now, 0.3);
    this.engineNoiseGain?.gain.setTargetAtTime(0, now, 0.3);
    this.turboGain?.gain.setTargetAtTime(0, now, 0.3);
    setTimeout(() => {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineOsc3?.stop();
      this.engineNoise?.stop();
      this.turboOsc?.stop();
      this.started = false;
    }, 1500);
  }

  // ── Chirrido de llantas ───────────────────────────────────────

  startTireSqueal(): void {
    if (this.tireOsc) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.tireOsc = ctx.createOscillator();
    this.tireOsc.type = "sawtooth";
    this.tireOsc.frequency.value = 320;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(this.tireOsc.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 3;

    this.tireGain = ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, now);
    this.tireGain.gain.linearRampToValueAtTime(0.12, now + 0.08);

    this.tireOsc.connect(filter);
    filter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);

    lfo.start(now);
    this.tireOsc.start(now);
  }

  stopTireSqueal(): void {
    if (!this.tireGain || !this.tireOsc) return;
    const now = this.ctx.currentTime;
    this.tireGain.gain.setTargetAtTime(0, now, 0.08);
    const osc = this.tireOsc;
    this.tireOsc = null;
    this.tireGain = null;
    setTimeout(() => { try { osc.stop(); } catch { /* ya parado */ } }, 400);
  }

  // ── Cruce de meta ─────────────────────────────────────────────

  playLapComplete(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.25, 0.18), i * 90);
    });
  }

  // ── Victoria ──────────────────────────────────────────────────

  playVictory(): void {
    const melody = [
      { f: 523, t: 0   },
      { f: 659, t: 120 },
      { f: 784, t: 240 },
      { f: 1047,t: 360 },
      { f: 784, t: 500 },
      { f: 1047,t: 600 },
      { f: 1319,t: 720 },
    ];
    melody.forEach(({ f, t }) => {
      setTimeout(() => this.playBeep(f, 0.28, 0.22), t);
    });
  }

  // ── Música Phonk/Drift ────────────────────────────────────────

  startRaceMusic(): void {
    if (this.musicScheduled) return;
    this.musicScheduled = true;
    this.scheduleRaceMusic();
  }

  stopRaceMusic(): void {
    this.musicScheduled = false;
    if (this.musicLoopId !== null) {
      clearTimeout(this.musicLoopId);
      this.musicLoopId = null;
    }
    const now = this.ctx.currentTime;
    for (const node of this.musicNodes) {
      if (node instanceof GainNode) {
        node.gain.setTargetAtTime(0, now, 0.5);
      }
    }
    setTimeout(() => {
      for (const node of this.musicNodes) {
        try { (node as OscillatorNode | AudioBufferSourceNode).stop?.(); } catch { /* ok */ }
      }
      this.musicNodes = [];
    }, 2000);
  }

  private scheduleRaceMusic(): void {
    if (!this.musicScheduled) return;

    const ctx = this.ctx;
    const BPM = 150; // Phonk/Drift tempo
    const beat = 60 / BPM;
    const bar  = beat * 4;
    const loopBars = 4;
    const loopDur  = bar * loopBars;

    const now = ctx.currentTime + 0.05;

    const musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0, now);
    musicGain.gain.linearRampToValueAtTime(0.25, now + 1.5);
    musicGain.connect(this.masterGain);
    this.musicNodes.push(musicGain);

    // ── 808 Bass (SUB BASS PESADO) ────────────────────────────
    const bassPattern = [
      { t: 0,          dur: beat * 0.8 },
      { t: beat * 1,   dur: beat * 0.4 },
      { t: beat * 1.5, dur: beat * 0.4 },
      { t: beat * 2,   dur: beat * 0.8 },
      { t: beat * 3,   dur: beat * 0.8 },
    ];
    for (let b = 0; b < loopBars; b++) {
      for (const { t, dur } of bassPattern) {
        this.schedule808Bass(ctx, musicGain, now + b * bar + t, dur);
      }
    }

    // ── Kick (bombo en cada beat) ─────────────────────────────
    for (let b = 0; b < loopBars * 4; b++) {
      const t = now + b * beat;
      this.schedulePhonkKick(ctx, musicGain, t);
    }

    // ── Snare (caja en 2 y 4) ─────────────────────────────────
    for (let b = 0; b < loopBars; b++) {
      this.scheduleSnare(ctx, musicGain, now + b * bar + beat);
      this.scheduleSnare(ctx, musicGain, now + b * bar + beat * 3);
    }

    // ── Hi-hats rápidos (trap style) ──────────────────────────
    for (let b = 0; b < loopBars * 16; b++) {
      const t = now + b * (beat / 4);
      const vol = b % 4 === 0 ? 0.14 : 0.07;
      const open = b % 8 === 6;
      this.scheduleHihat(ctx, musicGain, t, vol, open);
    }

    // ── Cowbell (característico de phonk) ─────────────────────
    const cowbellPattern = [0, beat * 0.5, beat * 2, beat * 2.5, beat * 3.5];
    for (let b = 0; b < loopBars; b++) {
      for (const offset of cowbellPattern) {
        this.scheduleCowbell(ctx, musicGain, now + b * bar + offset);
      }
    }

    // ── Synth lead oscuro ──────────────────────────────────────
    const leadPattern = [
      { note: 110, t: 0,          dur: beat * 0.9 },
      { note: 147, t: beat,       dur: beat * 0.9 },
      { note: 123, t: beat * 2,   dur: beat * 0.9 },
      { note: 110, t: beat * 3,   dur: beat * 0.9 },
    ];
    for (let rep = 0; rep < loopBars; rep++) {
      for (const { note, t, dur } of leadPattern) {
        this.schedulePhonkLead(ctx, musicGain, now + rep * bar + t, note, dur);
      }
    }

    // ── Pad oscuro de fondo ───────────────────────────────────
    const chords = [
      [110, 165, 220],  // Am dark
      [98,  147, 196],  // Gm dark
    ];
    for (let b = 0; b < loopBars; b += 2) {
      const chord = chords[(b / 2) % chords.length]!;
      const t = now + b * bar;
      this.schedulePhonkPad(ctx, musicGain, t, chord, bar * 1.95);
    }

    // Programar el siguiente loop
    const loopDelay = loopDur * 1000 - 100;
    this.musicLoopId = setTimeout(() => {
      if (this.musicScheduled) this.scheduleRaceMusic();
    }, loopDelay);
  }

  // ── Helpers de síntesis PHONK ─────────────────────────────────

  /** 808 Bass — sub bass distorsionado característico */
  private schedule808Bass(ctx: AudioContext, dest: AudioNode, t: number, dur: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + dur * 0.3);

    const waveshaper = ctx.createWaveShaper();
    waveshaper.curve = this.makeDistortionCurve(80);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(waveshaper);
    waveshaper.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  /** Kick phonk — bombo más profundo */
  private schedulePhonkKick(ctx: AudioContext, dest: AudioNode, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.10);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  /** Cowbell — sonido característico de phonk */
  private scheduleCowbell(ctx: AudioContext, dest: AudioNode, t: number): void {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "square";
    osc2.type = "square";
    osc1.frequency.value = 800;
    osc2.frequency.value = 540;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.09);
    osc2.stop(t + 0.09);
  }

  /** Synth lead oscuro */
  private schedulePhonkLead(ctx: AudioContext, dest: AudioNode, t: number, freq: number, dur: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = freq * 1.01;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freq * 4, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 2, t + dur * 0.7);
    filter.Q.value = 4.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
    gain.gain.setValueAtTime(0.12, t + dur - 0.05);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + dur + 0.01);
    osc2.stop(t + dur + 0.01);
  }

  /** Pad oscuro de fondo */
  private schedulePhonkPad(ctx: AudioContext, dest: AudioNode, t: number, freqs: number[], dur: number): void {
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = freq * 3;
      filter.Q.value = 1.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.5);
      gain.gain.setValueAtTime(0.05, t + dur - 0.5);
      gain.gain.linearRampToValueAtTime(0, t + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    }
  }

  /** Curva de distorsión para 808 bass */
  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  private scheduleSnare(ctx: AudioContext, dest: AudioNode, t: number, vol = 0.35): void {
    const buf = this.createNoiseBuffer(ctx, 0.2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(t);
    src.stop(t + 0.2);

    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 200;
    og.gain.setValueAtTime(vol * 0.7, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(og);
    og.connect(dest);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  private scheduleHihat(ctx: AudioContext, dest: AudioNode, t: number, vol: number, open: boolean): void {
    const buf = this.createNoiseBuffer(ctx, open ? 0.3 : 0.05);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 8000;
    const gain = ctx.createGain();
    const decay = open ? 0.25 : 0.04;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(t);
    src.stop(t + decay + 0.01);
  }

  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.ceil(sampleRate * duration);
    const buf = ctx.createBuffer(1, length, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  dispose(): void {
    this.stopRaceMusic();
    this.stopEngine();
    this.stopTireSqueal();
    void this.ctx.close();
  }
}
