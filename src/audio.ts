export type MusicMode = "soft" | "crisp" | "weird";
export type MusicSelection = MusicMode | "mute";
export type RotationMode = "order" | "chaos";
export type PlayMode = "manual" | "autoplay";

export type OriginNoteEvent = {
  timeMs: number;
  row: number;
  col: number;
  dieId: string;
  rotationMode: RotationMode;
  playMode: PlayMode;
};

export type MusicEngineOptions = {
  initialSelection: MusicSelection;
  onTempoChange?: (bpm: number) => void;
};

type ModeProfile = {
  bpm: number;
  scaleSemitones: number[];
  degreeWeights: number[];
  baseMidi: number;
  attackSec: number;
  decaySec: number;
  sustain: number;
  releaseSec: number;
  holdBeats: number;
  filterType: BiquadFilterType;
  filterFreqHz: number;
  filterQ: number;
  voiceGain: number;
  delayBeats: number;
  delayWet: number;
  reverbWetMin: number;
  reverbWetMax: number;
  delayFeedbackMin: number;
  delayFeedbackMax: number;
  preFlangerDepthMin: number;
  preFlangerDepthMax: number;
  preFlangerWet: number;
  preFlangerLfoHz: number;
  postFlangerDepthMin: number;
  postFlangerDepthMax: number;
  postFlangerWet: number;
  postFlangerLfoHzMin: number;
  postFlangerLfoHzMax: number;
  scatterBaseSec: number;
  scatterSpreadSec: number;
  scatterWetMin: number;
  scatterWetMax: number;
  scatterFeedbackMin: number;
  scatterFeedbackMax: number;
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
// Weights align by index to each mode's scaleSemitones array.
// Stronger hierarchy: high-priority tones dominate, low-priority tones are rare.
const SOFT_DEGREE_WEIGHTS = [0.34, 0.05, 0.2, 0.12, 0.22, 0.05, 0.02];
const CRISP_DEGREE_WEIGHTS = [0.34, 0.05, 0.2, 0.12, 0.22, 0.05, 0.02];
const WEIRD_DEGREE_WEIGHTS = [0.3, 0.08, 0.22, 0.1, 0.2, 0.06, 0.04];

const MODE_PROFILES: Record<MusicMode, ModeProfile> = {
  soft: {
    bpm: 64,
    scaleSemitones: MAJOR,
    degreeWeights: SOFT_DEGREE_WEIGHTS,
    baseMidi: 60,
    attackSec: 0.06,
    decaySec: 0.45,
    sustain: 0.66,
    releaseSec: 1.05,
    holdBeats: 0.5,
    filterType: "lowpass",
    filterFreqHz: 1900,
    filterQ: 0.32,
    voiceGain: 0.2,
    delayBeats: 1.5,
    delayWet: 0.08,
    reverbWetMin: 0.5,
    reverbWetMax: 1,
    delayFeedbackMin: 0.08,
    delayFeedbackMax: 0.6,
    preFlangerDepthMin: 0.0015,
    preFlangerDepthMax: 0.0055,
    preFlangerWet: 0.16,
    preFlangerLfoHz: 0.2,
    postFlangerDepthMin: 0,
    postFlangerDepthMax: 0,
    postFlangerWet: 0,
    postFlangerLfoHzMin: 0,
    postFlangerLfoHzMax: 0,
    scatterBaseSec: 0,
    scatterSpreadSec: 0,
    scatterWetMin: 0,
    scatterWetMax: 0,
    scatterFeedbackMin: 0,
    scatterFeedbackMax: 0,
  },
  crisp: {
    bpm: 133,
    scaleSemitones: NATURAL_MINOR,
    degreeWeights: CRISP_DEGREE_WEIGHTS,
    baseMidi: 67,
    attackSec: 0.004,
    decaySec: 0.05,
    sustain: 0.1,
    releaseSec: 0.3,
    holdBeats: 0,
    filterType: "highpass",
    filterFreqHz: 760,
    filterQ: 0.82,
    voiceGain: 0.3,
    delayBeats: 0.375,
    delayWet: 0.8,
    reverbWetMin: 0.05,
    reverbWetMax: 0.4,
    delayFeedbackMin: 0.5,
    delayFeedbackMax: 0.95,
    preFlangerDepthMin: 0.001,
    preFlangerDepthMax: 0.003,
    preFlangerWet: 0,
    preFlangerLfoHz: 0.3,
    postFlangerDepthMin: 0,
    postFlangerDepthMax: 0,
    postFlangerWet: 0,
    postFlangerLfoHzMin: 0,
    postFlangerLfoHzMax: 0,
    scatterBaseSec: 0.045,
    scatterSpreadSec: 0.04,
    scatterWetMin: 0.3,
    scatterWetMax: 0.6,
    scatterFeedbackMin: 0.4,
    scatterFeedbackMax: 0.8,
  },
  weird: {
    bpm: 101,
    scaleSemitones: PHRYGIAN,
    degreeWeights: WEIRD_DEGREE_WEIGHTS,
    baseMidi: 58,
    attackSec: 0.004,
    decaySec: 1.8,
    sustain: 0.42,
    releaseSec: 1.75,
    holdBeats: 0,
    filterType: "bandpass",
    filterFreqHz: 1300,
    filterQ: 1.8,
    voiceGain: 0.4,
    delayBeats: 0.75,
    delayWet: 0.3,
    reverbWetMin: 0.16,
    reverbWetMax: 0.28,
    delayFeedbackMin: 0,
    delayFeedbackMax: 1,
    preFlangerDepthMin: 0.1,
    preFlangerDepthMax: 0.5,
    preFlangerWet: 0.25,
    preFlangerLfoHz: 0.5,
    postFlangerDepthMin: 0.00025,
    postFlangerDepthMax: 0.004,
    postFlangerWet: 0.5,
    postFlangerLfoHzMin: 10.45,
    postFlangerLfoHzMax: 0.5,
    scatterBaseSec: 0,
    scatterSpreadSec: 0,
    scatterWetMin: 0,
    scatterWetMax: 0,
    scatterFeedbackMin: 0,
    scatterFeedbackMax: 0,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function weightedIndex(weights: number[]) {
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (total <= 0) return 0;
  let pick = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    pick -= Math.max(0, weights[i]);
    if (pick <= 0) return i;
  }
  return weights.length - 1;
}

function weightedValue(values: number[], weights: number[]) {
  const idx = weightedIndex(weights);
  return values[Math.min(values.length - 1, Math.max(0, idx))] ?? values[0] ?? 0;
}

function midiToHz(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function createImpulseResponse(ctx: AudioContext, durationSec = 3.2, decay = 2.7) {
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.max(1, Math.floor(durationSec * sampleRate));
  const impulse = ctx.createBuffer(2, frameCount, sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const envelope = Math.pow(1 - t, decay);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
  }

  return impulse;
}

export class MusicEngine {
  private readonly audioCtx: AudioContext;
  private readonly onTempoChange?: (bpm: number) => void;

  private readonly masterGain: GainNode;
  private readonly voiceBus: GainNode;

  private readonly preFlangerInput: GainNode;
  private readonly preFlangerDry: GainNode;
  private readonly preFlangerWet: GainNode;
  private readonly preFlangerDelay: DelayNode;
  private readonly preFlangerOutput: GainNode;
  private readonly preFlangerDepthGain: GainNode;
  private readonly preFlangerLfo: OscillatorNode;

  private readonly delayInput: GainNode;
  private readonly delayDry: GainNode;
  private readonly delayWet: GainNode;
  private readonly delayNode: DelayNode;
  private readonly delayFeedback: GainNode;

  private readonly scatterDelayWet: GainNode;
  private readonly scatterDelayNode: DelayNode;
  private readonly scatterDelayFeedback: GainNode;

  private readonly delayOutput: GainNode;

  private readonly reverbInput: GainNode;
  private readonly reverbDry: GainNode;
  private readonly reverbWet: GainNode;
  private readonly convolver: ConvolverNode;

  private readonly postFlangerInput: GainNode;
  private readonly postFlangerDry: GainNode;
  private readonly postFlangerWet: GainNode;
  private readonly postFlangerDelay: DelayNode;
  private readonly postFlangerOutput: GainNode;
  private readonly postFlangerDepthGain: GainNode;
  private readonly postFlangerLfo: OscillatorNode;

  private selection: MusicSelection;
  private rippleIntensityTarget = 0;
  private rippleIntensityCurrent = 0;
  private lastTickMs = 0;
  private scatterJitterSec = 0;

  constructor(options: MusicEngineOptions) {
    this.audioCtx = new window.AudioContext();
    this.onTempoChange = options.onTempoChange;
    this.selection = options.initialSelection;

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.62;

    this.voiceBus = this.audioCtx.createGain();
    this.voiceBus.gain.value = 1;

    this.preFlangerInput = this.audioCtx.createGain();
    this.preFlangerDry = this.audioCtx.createGain();
    this.preFlangerWet = this.audioCtx.createGain();
    this.preFlangerDelay = this.audioCtx.createDelay(0.05);
    this.preFlangerOutput = this.audioCtx.createGain();
    this.preFlangerDepthGain = this.audioCtx.createGain();
    this.preFlangerLfo = this.audioCtx.createOscillator();

    this.preFlangerDelay.delayTime.value = 0.006;
    this.preFlangerDry.gain.value = 1;
    this.preFlangerWet.gain.value = 0;
    this.preFlangerDepthGain.gain.value = 0;
    this.preFlangerLfo.frequency.value = 0.25;

    this.delayInput = this.audioCtx.createGain();
    this.delayDry = this.audioCtx.createGain();
    this.delayWet = this.audioCtx.createGain();
    this.delayNode = this.audioCtx.createDelay(2);
    this.delayFeedback = this.audioCtx.createGain();

    this.scatterDelayWet = this.audioCtx.createGain();
    this.scatterDelayNode = this.audioCtx.createDelay(2);
    this.scatterDelayFeedback = this.audioCtx.createGain();

    this.delayOutput = this.audioCtx.createGain();

    this.delayDry.gain.value = 1;
    this.delayWet.gain.value = 0;
    this.delayFeedback.gain.value = 0;
    this.scatterDelayWet.gain.value = 0;
    this.scatterDelayFeedback.gain.value = 0;

    this.reverbInput = this.audioCtx.createGain();
    this.reverbDry = this.audioCtx.createGain();
    this.reverbWet = this.audioCtx.createGain();
    this.convolver = this.audioCtx.createConvolver();
    this.convolver.buffer = createImpulseResponse(this.audioCtx);
    this.reverbDry.gain.value = 0.88;
    this.reverbWet.gain.value = 0.22;

    this.postFlangerInput = this.audioCtx.createGain();
    this.postFlangerDry = this.audioCtx.createGain();
    this.postFlangerWet = this.audioCtx.createGain();
    this.postFlangerDelay = this.audioCtx.createDelay(0.08);
    this.postFlangerOutput = this.audioCtx.createGain();
    this.postFlangerDepthGain = this.audioCtx.createGain();
    this.postFlangerLfo = this.audioCtx.createOscillator();

    this.postFlangerDelay.delayTime.value = 0.008;
    this.postFlangerDry.gain.value = 1;
    this.postFlangerWet.gain.value = 0;
    this.postFlangerDepthGain.gain.value = 0;
    this.postFlangerLfo.frequency.value = 0.5;

    this.voiceBus.connect(this.preFlangerInput);
    this.preFlangerInput.connect(this.preFlangerDry);
    this.preFlangerInput.connect(this.preFlangerDelay);
    this.preFlangerDelay.connect(this.preFlangerWet);
    this.preFlangerDry.connect(this.preFlangerOutput);
    this.preFlangerWet.connect(this.preFlangerOutput);

    this.preFlangerLfo.connect(this.preFlangerDepthGain);
    this.preFlangerDepthGain.connect(this.preFlangerDelay.delayTime);
    this.preFlangerLfo.start();

    this.preFlangerOutput.connect(this.delayInput);
    this.delayInput.connect(this.delayDry);
    this.delayInput.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);

    this.delayInput.connect(this.scatterDelayNode);
    this.scatterDelayNode.connect(this.scatterDelayFeedback);
    this.scatterDelayFeedback.connect(this.scatterDelayNode);
    this.scatterDelayNode.connect(this.scatterDelayWet);

    this.delayDry.connect(this.delayOutput);
    this.delayWet.connect(this.delayOutput);
    this.scatterDelayWet.connect(this.delayOutput);

    this.delayOutput.connect(this.reverbInput);
    this.reverbInput.connect(this.reverbDry);
    this.reverbInput.connect(this.convolver);
    this.convolver.connect(this.reverbWet);

    this.reverbDry.connect(this.postFlangerInput);
    this.reverbWet.connect(this.postFlangerInput);

    this.postFlangerInput.connect(this.postFlangerDry);
    this.postFlangerInput.connect(this.postFlangerDelay);
    this.postFlangerDelay.connect(this.postFlangerWet);
    this.postFlangerDry.connect(this.postFlangerOutput);
    this.postFlangerWet.connect(this.postFlangerOutput);

    this.postFlangerLfo.connect(this.postFlangerDepthGain);
    this.postFlangerDepthGain.connect(this.postFlangerDelay.delayTime);
    this.postFlangerLfo.start();

    this.postFlangerOutput.connect(this.masterGain);
    this.masterGain.connect(this.audioCtx.destination);

    this.applyModeForSelection(this.selection, true);
  }

  async resumeIfNeeded() {
    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }
  }

  setSelection(selection: MusicSelection) {
    if (this.selection === selection) return;
    this.selection = selection;
    this.applyModeForSelection(selection, false);
  }

  getSelection() {
    return this.selection;
  }

  getActiveBpm() {
    if (this.selection === "mute") return MODE_PROFILES.soft.bpm;
    return MODE_PROFILES[this.selection].bpm;
  }

  triggerOriginNote(event: OriginNoteEvent) {
    if (this.selection === "mute") return;
    if (this.audioCtx.state !== "running") {
      void this.resumeIfNeeded()
        .then(() => this.triggerOriginNote(event))
        .catch(() => {
          // Browser gesture policies may block resume until user interaction.
        });
      return;
    }

    const mode = this.selection;
    const profile = MODE_PROFILES[mode];

    const degreeIndex = weightedIndex(profile.degreeWeights);
    const semitone = profile.scaleSemitones[degreeIndex] ?? 0;
    const octaveDrift = weightedValue(
      [-12, -7, -5, 0, 5, 7, 12],
      [0.08, 0.12, 0.16, 0.28, 0.16, 0.12, 0.08]
    );

    const midi = profile.baseMidi + semitone + octaveDrift;
    const freq = midiToHz(midi);

    if (mode === "crisp") {
      this.scatterJitterSec = (Math.random() * 2 - 1) * 0.012;
    }

    const noteAttackSec = mode === "soft" ? lerp(0.4, 0.015, this.rippleIntensityCurrent) : profile.attackSec;
    const beatSec = 60 / Math.max(1, profile.bpm);
    const holdSec = Math.max(0, beatSec * profile.holdBeats);

    const now = this.audioCtx.currentTime + 0.001;
    const sustainStart = now + noteAttackSec + profile.decaySec;
    const releaseStart = sustainStart + holdSec;
    const stopAt = releaseStart + profile.releaseSec + 0.05;

    const voiceGain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    voiceGain.gain.value = 0;
    filter.type = profile.filterType;
    filter.frequency.value = profile.filterFreqHz;
    filter.Q.value = profile.filterQ;

    voiceGain.connect(filter);
    filter.connect(this.voiceBus);

    if (mode === "soft") {
      const oscA = this.audioCtx.createOscillator();
      const oscB = this.audioCtx.createOscillator();
      const oscBlendA = this.audioCtx.createGain();
      const oscBlendB = this.audioCtx.createGain();

      oscA.type = "triangle";
      oscB.type = "sine";
      oscA.frequency.setValueAtTime(freq, now);
      oscB.frequency.setValueAtTime(freq * 1.002, now);
      oscBlendA.gain.value = 0.7;
      oscBlendB.gain.value = 0.4;

      oscA.connect(oscBlendA);
      oscB.connect(oscBlendB);
      oscBlendA.connect(voiceGain);
      oscBlendB.connect(voiceGain);

      oscA.start(now);
      oscB.start(now);
      oscA.stop(stopAt);
      oscB.stop(stopAt);
    } else if (mode === "crisp") {
      const oscA = this.audioCtx.createOscillator();
      const oscB = this.audioCtx.createOscillator();
      const oscBlendA = this.audioCtx.createGain();
      const oscBlendB = this.audioCtx.createGain();

      oscA.type = "sawtooth";
      oscB.type = "square";
      oscA.frequency.setValueAtTime(freq, now);
      oscB.frequency.setValueAtTime(freq * 2, now);
      oscBlendA.gain.value = 0.72;
      oscBlendB.gain.value = 0.24;

      oscA.connect(oscBlendA);
      oscB.connect(oscBlendB);
      oscBlendA.connect(voiceGain);
      oscBlendB.connect(voiceGain);

      oscA.start(now);
      oscB.start(now);
      oscA.stop(stopAt);
      oscB.stop(stopAt);
    } else {
      const carrier = this.audioCtx.createOscillator();
      const detuned = this.audioCtx.createOscillator();
      const mod = this.audioCtx.createOscillator();
      const modGain = this.audioCtx.createGain();
      const carrierGain = this.audioCtx.createGain();
      const detunedGain = this.audioCtx.createGain();
      const vibrato = this.audioCtx.createOscillator();
      const vibratoGain = this.audioCtx.createGain();

      carrier.type = "triangle";
      detuned.type = "sawtooth";
      mod.type = "sine";
      vibrato.type = "sine";

      carrier.frequency.setValueAtTime(freq, now);
      detuned.frequency.setValueAtTime(freq * 1.007, now);
      mod.frequency.setValueAtTime(Math.max(1, freq * 1.5), now);
      modGain.gain.setValueAtTime(freq * 0.33, now);

      // Subtle pitch oscillation.
      const vibratoHz = lerp(4, 16, this.rippleIntensityCurrent);
      const vibratoDepth = lerp(0.0005, 0.0025, this.rippleIntensityCurrent);
      vibrato.frequency.setValueAtTime(vibratoHz, now);
      vibratoGain.gain.setValueAtTime(freq * vibratoDepth, now);

      carrierGain.gain.value = 0.62;
      detunedGain.gain.value = 0.36;

      mod.connect(modGain);
      modGain.connect(carrier.frequency);

      vibrato.connect(vibratoGain);
      vibratoGain.connect(carrier.frequency);
      vibratoGain.connect(detuned.frequency);

      carrier.connect(carrierGain);
      detuned.connect(detunedGain);
      carrierGain.connect(voiceGain);
      detunedGain.connect(voiceGain);

      carrier.start(now);
      detuned.start(now);
      mod.start(now);
      vibrato.start(now);

      carrier.stop(stopAt);
      detuned.stop(stopAt);
      mod.stop(stopAt);
      vibrato.stop(stopAt);
    }

    const peak = profile.voiceGain;
    voiceGain.gain.cancelScheduledValues(now);
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(peak, now + noteAttackSec);
    voiceGain.gain.linearRampToValueAtTime(peak * profile.sustain, sustainStart);
    voiceGain.gain.setValueAtTime(peak * profile.sustain, releaseStart);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, releaseStart + profile.releaseSec);

    const cleanupDelayMs = Math.max(0, (stopAt - this.audioCtx.currentTime + 0.08) * 1000);
    window.setTimeout(() => {
      voiceGain.disconnect();
      filter.disconnect();
    }, cleanupDelayMs);
  }

  setRippleActiveCount(activeCount: number, totalDice: number) {
    const safeTotal = Math.max(1, totalDice);
    this.rippleIntensityTarget = clamp(Math.sqrt(Math.max(0, activeCount) / safeTotal), 0, 1);
  }

  tick(nowMs: number) {
    if (this.lastTickMs <= 0) {
      this.lastTickMs = nowMs;
    }
    const dtMs = clamp(nowMs - this.lastTickMs, 0, 500);
    this.lastTickMs = nowMs;

    const smoothingMs = 120;
    const alpha = 1 - Math.exp(-dtMs / smoothingMs);
    this.rippleIntensityCurrent = lerp(this.rippleIntensityCurrent, this.rippleIntensityTarget, alpha);

    if (this.selection === "mute") return;

    const profile = MODE_PROFILES[this.selection];
    const intensity = this.rippleIntensityCurrent;

    const reverbWet = lerp(profile.reverbWetMin, profile.reverbWetMax, intensity);
    const delayFb = lerp(profile.delayFeedbackMin, profile.delayFeedbackMax, intensity);
    const preFlangerDepth = lerp(profile.preFlangerDepthMin, profile.preFlangerDepthMax, intensity);
    const scatterWet = lerp(profile.scatterWetMin, profile.scatterWetMax, intensity);
    const scatterFeedback = lerp(profile.scatterFeedbackMin, profile.scatterFeedbackMax, intensity);
    const scatterTime = clamp(
      profile.scatterBaseSec + this.scatterJitterSec + profile.scatterSpreadSec * intensity,
      0,
      2
    );
    const postFlangerDepth = lerp(profile.postFlangerDepthMin, profile.postFlangerDepthMax, intensity);
    const postFlangerLfoHz = lerp(profile.postFlangerLfoHzMin, profile.postFlangerLfoHzMax, intensity);

    this.reverbWet.gain.setTargetAtTime(reverbWet, this.audioCtx.currentTime, 0.03);
    this.delayFeedback.gain.setTargetAtTime(delayFb, this.audioCtx.currentTime, 0.03);
    this.delayWet.gain.setTargetAtTime(profile.delayWet, this.audioCtx.currentTime, 0.03);
    this.preFlangerDepthGain.gain.setTargetAtTime(preFlangerDepth, this.audioCtx.currentTime, 0.03);
    this.preFlangerWet.gain.setTargetAtTime(profile.preFlangerWet, this.audioCtx.currentTime, 0.03);

    this.scatterDelayWet.gain.setTargetAtTime(scatterWet, this.audioCtx.currentTime, 0.03);
    this.scatterDelayFeedback.gain.setTargetAtTime(scatterFeedback, this.audioCtx.currentTime, 0.03);
    this.scatterDelayNode.delayTime.setTargetAtTime(scatterTime, this.audioCtx.currentTime, 0.03);

    this.postFlangerDepthGain.gain.setTargetAtTime(postFlangerDepth, this.audioCtx.currentTime, 0.03);
    this.postFlangerWet.gain.setTargetAtTime(profile.postFlangerWet, this.audioCtx.currentTime, 0.03);
    this.postFlangerLfo.frequency.setTargetAtTime(postFlangerLfoHz, this.audioCtx.currentTime, 0.04);
  }

  dispose() {
    this.preFlangerLfo.stop();
    this.postFlangerLfo.stop();
    void this.audioCtx.close();
  }

  private applyModeForSelection(selection: MusicSelection, initial: boolean) {
    if (selection === "mute") {
      this.masterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.02);
      return;
    }

    const profile = MODE_PROFILES[selection];
    const beatSec = 60 / Math.max(1, profile.bpm);
    const delaySec = beatSec * profile.delayBeats;

    this.masterGain.gain.setTargetAtTime(0.62, this.audioCtx.currentTime, 0.03);

    this.delayNode.delayTime.setTargetAtTime(delaySec, this.audioCtx.currentTime, 0.03);
    this.delayWet.gain.setTargetAtTime(profile.delayWet, this.audioCtx.currentTime, 0.03);
    this.delayFeedback.gain.setTargetAtTime(profile.delayFeedbackMin, this.audioCtx.currentTime, 0.03);

    this.preFlangerDry.gain.setTargetAtTime(profile.preFlangerWet > 0 ? 0.8 : 1, this.audioCtx.currentTime, 0.03);
    this.preFlangerWet.gain.setTargetAtTime(profile.preFlangerWet, this.audioCtx.currentTime, 0.03);
    this.preFlangerLfo.frequency.setTargetAtTime(profile.preFlangerLfoHz, this.audioCtx.currentTime, 0.04);
    this.preFlangerDepthGain.gain.setTargetAtTime(profile.preFlangerDepthMin, this.audioCtx.currentTime, 0.03);

    this.scatterDelayNode.delayTime.setTargetAtTime(profile.scatterBaseSec, this.audioCtx.currentTime, 0.03);
    this.scatterDelayWet.gain.setTargetAtTime(profile.scatterWetMin, this.audioCtx.currentTime, 0.03);
    this.scatterDelayFeedback.gain.setTargetAtTime(profile.scatterFeedbackMin, this.audioCtx.currentTime, 0.03);

    this.reverbWet.gain.setTargetAtTime(profile.reverbWetMin, this.audioCtx.currentTime, 0.03);

    this.postFlangerDry.gain.setTargetAtTime(profile.postFlangerWet > 0 ? 0.7 : 1, this.audioCtx.currentTime, 0.03);
    this.postFlangerWet.gain.setTargetAtTime(profile.postFlangerWet, this.audioCtx.currentTime, 0.03);
    this.postFlangerDepthGain.gain.setTargetAtTime(profile.postFlangerDepthMin, this.audioCtx.currentTime, 0.03);
    this.postFlangerLfo.frequency.setTargetAtTime(profile.postFlangerLfoHzMin, this.audioCtx.currentTime, 0.04);

    if (!initial) {
      this.onTempoChange?.(profile.bpm);
    }
  }
}
