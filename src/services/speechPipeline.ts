import { VoicePipelineStatus, WakeWordConfig } from '../types';
import { DEFAULT_WAKE_CONFIG, routeSpokenSpeech, SpokenRouteResult } from './voiceRouter';

export interface UseVoicePipelineProps {
  onWakePing?: (replyText: string) => void;
  onCommandRouted?: (command: string, route: SpokenRouteResult) => void;
  onContinuousToggle?: (active: boolean) => void;
  onListeningStateChange?: (state: 'standby' | 'listening' | 'speaking' | 'processing') => void;
  onAudioLevel?: (level: number) => void;
  onToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  config?: Partial<WakeWordConfig>;
}

export interface VoicePipelineEngine {
  start: () => Promise<void>;
  stop: () => void;
  simulateWakeWord: () => void;
  testMicHardware: () => Promise<{ ok: boolean; transcript?: string; error?: string }>;
  isListening: boolean;
  permission: 'granted' | 'prompt' | 'denied' | 'unknown';
}

/**
 * Robust Speech & Wake Word Pipeline
 * Handles automatic mic acquisition, continuous Web Speech API listening,
 * duplex echo muting during TTS, audio level analysis, and Gemini STT fallback.
 */
export class SapphireSpeechPipeline {
  private config: WakeWordConfig;
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private restartTimer: any = null;
  private silenceTimer: any = null;
  private isSpeaking = false;
  private ignoreAudioUntil = 0;
  private isContinuous = false;
  private isArmed = false;
  private callbacks: UseVoicePipelineProps;

  constructor(callbacks: UseVoicePipelineProps) {
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_WAKE_CONFIG, ...callbacks.config };
    this.isContinuous = this.config.continuousMode;
  }

  public setSpeaking(speaking: boolean, graceDurationMs = 700) {
    this.isSpeaking = speaking;
    if (speaking) {
      this.ignoreAudioUntil = Date.now() + 60000;
      if (this.recognition) {
        try { this.recognition.abort(); } catch (_) {}
      }
      this.callbacks.onListeningStateChange?.('speaking');
    } else {
      this.ignoreAudioUntil = Date.now() + graceDurationMs;
      this.callbacks.onListeningStateChange?.('standby');
      // Resume listening after grace period
      clearTimeout(this.restartTimer);
      this.restartTimer = setTimeout(() => {
        if (this.isArmed && !this.isSpeaking) {
          this.startRecognition();
        }
      }, graceDurationMs);
    }
  }

  public setContinuous(continuous: boolean) {
    this.isContinuous = continuous;
  }

  public async startPipeline(): Promise<boolean> {
    this.isArmed = true;
    if (typeof window === 'undefined') return false;

    // 1. Initialize AudioContext & Stream for Level Monitoring
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        if (!this.mediaStream || !this.mediaStream.active) {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.setupAudioAnalysis(this.mediaStream);
        }
      } catch (err: any) {
        console.warn('Microphone stream permission error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.callbacks.onToast?.('Microphone blocked. Please allow mic permissions in your browser.', 'error');
          return false;
        }
      }
    }

    // 2. Start Speech Recognition
    this.startRecognition();
    return true;
  }

  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const pollVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        this.callbacks.onAudioLevel?.(normalized);
        this.animFrameId = requestAnimationFrame(pollVolume);
      };
      pollVolume();
    } catch (_) {}
  }

  private startRecognition() {
    if (this.isSpeaking || !this.isArmed || typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch (_) {}
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        if (!this.isSpeaking) {
          this.callbacks.onListeningStateChange?.('listening');
        }
      };

      rec.onresult = (event: any) => {
        if (this.isSpeaking || Date.now() < this.ignoreAudioUntil) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (interim.trim() && !this.isSpeaking && Date.now() >= this.ignoreAudioUntil) {
              this.handleTranscriptPhrase(interim);
            }
          }, this.config.silenceThresholdMs);
        }

        if (final.trim()) {
          clearTimeout(this.silenceTimer);
          this.handleTranscriptPhrase(final);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          this.callbacks.onToast?.('Microphone access denied', 'error');
          this.isArmed = false;
          return;
        }
        // Transient error auto-retry
        if (this.isArmed && !this.isSpeaking) {
          clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.isArmed && !this.isSpeaking) {
              try { rec.start(); } catch (_) {}
            }
          }, 300);
        }
      };

      rec.onend = () => {
        if (this.isArmed && !this.isSpeaking) {
          clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.isArmed && !this.isSpeaking) {
              try { rec.start(); } catch (_) { this.startRecognition(); }
            }
          }, 250);
        }
      };

      this.recognition = rec;
      rec.start();
    } catch (_) {}
  }

  private handleTranscriptPhrase(phrase: string) {
    if (!phrase || !phrase.trim()) return;
    if (this.isSpeaking || Date.now() < this.ignoreAudioUntil) return;

    const routed = routeSpokenSpeech(phrase, this.isContinuous, this.config);

    if (routed.intent === 'ignore') {
      return;
    }

    if (routed.intent === 'wake_ping') {
      this.callbacks.onToast?.("🎙️ 'Hey Sapphire' Detected — Listening...", 'success');
      this.callbacks.onWakePing?.("I'm listening, Damone. What do you need?");
      return;
    }

    if (routed.intent === 'continuous_start') {
      this.isContinuous = true;
      this.callbacks.onContinuousToggle?.(true);
      this.callbacks.onWakePing?.("Continuous Conversation is online. I'll stay on, listen, and talk with you back-and-forth indefinitely.");
      return;
    }

    if (routed.intent === 'continuous_stop') {
      this.isContinuous = false;
      this.callbacks.onContinuousToggle?.(false);
      this.callbacks.onWakePing?.("Continuous Conversation mode paused. Say 'Hey Sapphire' whenever you need me.");
      return;
    }

    if (routed.cleanQuery) {
      this.callbacks.onCommandRouted?.(routed.cleanQuery, routed);
    }
  }

  public stopPipeline() {
    this.isArmed = false;
    clearTimeout(this.restartTimer);
    clearTimeout(this.silenceTimer);

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch (_) {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    if (this.recognition) {
      try { this.recognition.abort(); } catch (_) {}
      this.recognition = null;
    }

    this.callbacks.onListeningStateChange?.('standby');
    this.callbacks.onAudioLevel?.(0);
  }
}
