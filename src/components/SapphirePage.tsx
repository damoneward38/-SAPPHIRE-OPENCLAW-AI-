import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PluginItem, MemoryItem, ChatMessage, StoredConversation, SavedUserFile } from '../types';
import { chime } from '../utils/audioChimes';
import { routeSpokenSpeech, DEFAULT_WAKE_CONFIG } from '../services/voiceRouter';
import { 
  Bot, 
  Mic, 
  MicOff,
  Send, 
  Square, 
  Volume2, 
  VolumeX, 
  Download, 
  Trash2, 
  Plus, 
  Check, 
  Copy, 
  Clock, 
  Brain, 
  Zap, 
  FileText,
  FileCode,
  FolderDown,
  Archive,
  RotateCcw,
  Sparkles,
  Layers,
  Radio,
  Play,
  Pause,
  Save,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Activity,
  Terminal,
  HelpCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Headphones
} from 'lucide-react';

interface SapphirePageProps {
  plugins: PluginItem[];
  onTogglePlugin: (id: string) => void;
  onOpenInstallPlugin: () => void;
  memories: MemoryItem[];
  updateCount: number;
  wakeWordActive: boolean;
  pendingCommand?: string | null;
  onClearPendingCommand?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
}

type SidebarTab = 'conversations' | 'files' | 'memories';
type VoiceLoopState = 'standby' | 'listening' | 'processing' | 'speaking' | 'paused';

export const SapphirePage: React.FC<SapphirePageProps> = ({
  plugins,
  onTogglePlugin,
  onOpenInstallPlugin,
  memories,
  updateCount,
  wakeWordActive,
  pendingCommand,
  onClearPendingCommand,
  onShowToast,
}) => {
  // Active Conversation State
  const [currentConvId, setCurrentConvId] = useState<string>(() => `conv-${Date.now()}`);
  const [currentConvTitle, setCurrentConvTitle] = useState<string>('Live Session');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'ai',
      text: "I'm online and ready. I have loaded all your permanent memory, system settings, and tools. You can speak freely with 'Hey Sapphire' or enable Continuous Conversation Mode for non-stop hands-free interaction. What would you like to build or run?",
      time: 'Just now',
      tags: ['🧠 MEMORY SYNCED', '🎙️ HEY SAPPHIRE READY', '⚡ ALWAYS ON']
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('neurocore-v3');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [tokenCount, setTokenCount] = useState(280);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Continuous Hands-Free Voice Mode State
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [voiceLoopState, setVoiceLoopState] = useState<VoiceLoopState>('standby');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [micPermissionState, setMicPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('unknown');
  const [showVoiceDiagnostic, setShowVoiceDiagnostic] = useState(false);
  const [testMicRunning, setTestMicRunning] = useState(false);
  const [testMicOutput, setTestMicOutput] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem('sapphire_preferred_voice') || 'Samantha';
  });
  const [voicePitch, setVoicePitch] = useState<number>(() => {
    return parseFloat(localStorage.getItem('sapphire_voice_pitch') || '1.0');
  });
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    return parseFloat(localStorage.getItem('sapphire_voice_rate') || '1.05');
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('conversations');
  const [speechErrorMsg, setSpeechErrorMsg] = useState<string | null>(null);

  // Load system voices on mount and when changed
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const rawVoices = window.speechSynthesis.getVoices();
      if (rawVoices.length > 0) {
        // Deduplicate voices with identical name, lang and voiceURI
        const seen = new Set<string>();
        const uniqueVoices = rawVoices.filter(v => {
          const key = `${v.name}_${v.lang}_${v.voiceURI}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setAvailableVoices(uniqueVoices);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleVoiceChange = (vName: string) => {
    setSelectedVoiceName(vName);
    localStorage.setItem('sapphire_preferred_voice', vName);
    onShowToast(`Voice updated to ${vName}`, 'info');
  };

  const handlePitchChange = (p: number) => {
    setVoicePitch(p);
    localStorage.setItem('sapphire_voice_pitch', p.toString());
  };

  const handleRateChange = (r: number) => {
    setVoiceRate(r);
    localStorage.setItem('sapphire_voice_rate', r.toString());
  };

  // Stored Conversations & Files
  const [savedConversations, setSavedConversations] = useState<StoredConversation[]>([]);
  const [savedFiles, setSavedFiles] = useState<SavedUserFile[]>([]);
  const [isSavingConv, setIsSavingConv] = useState(false);
  const [isExtractingFiles, setIsExtractingFiles] = useState(false);

  // File Upload Modal
  const [isAddFileOpen, setIsAddFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  // Refs for Speech & Streaming
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSpokenTextRef = useRef<string>('');
  const lastSpokenAiResponseRef = useRef<string>('');
  const lastSubmittedPromptRef = useRef<string>('');
  const lastSubmittedTimeRef = useRef<number>(0);
  const ignoreAudioUntilRef = useRef<number>(0);
  const isContinuousModeRef = useRef(isContinuousMode);
  const wakeWordActiveRef = useRef(wakeWordActive);
  const isStreamingRef = useRef(isStreaming);
  const voiceLoopStateRef = useRef(voiceLoopState);
  const messagesRef = useRef(messages);
  const currentConvIdRef = useRef(currentConvId);
  const currentConvTitleRef = useRef(currentConvTitle);
  const restartTimerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);

  // Keep refs synced
  useEffect(() => {
    isContinuousModeRef.current = isContinuousMode;
  }, [isContinuousMode]);

  useEffect(() => {
    wakeWordActiveRef.current = wakeWordActive;
  }, [wakeWordActive]);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    voiceLoopStateRef.current = voiceLoopState;
  }, [voiceLoopState]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentConvIdRef.current = currentConvId;
  }, [currentConvId]);

  useEffect(() => {
    currentConvTitleRef.current = currentConvTitle;
  }, [currentConvTitle]);

  // Auto scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, interimTranscript]);

  // Fetch saved conversations and files on mount
  const fetchSavedData = useCallback(async () => {
    try {
      const [convRes, filesRes] = await Promise.all([
        fetch('/api/conversations/list'),
        fetch('/api/files/list')
      ]);
      const convData = await convRes.json();
      const filesData = await filesRes.json();

      if (convData.conversations) {
        setSavedConversations(convData.conversations);
      }
      if (filesData.files) {
        setSavedFiles(filesData.files);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchSavedData();
  }, [fetchSavedData]);

  // Auto-Save conversation to backend database
  const autoSaveConversation = useCallback(async (msgs: ChatMessage[]) => {
    if (msgs.length <= 1) return;
    try {
      let title = currentConvTitleRef.current;
      if (title === 'Live Session' || title === 'New Conversation') {
        const firstUser = msgs.find(m => m.role === 'user');
        if (firstUser) {
          title = firstUser.text.slice(0, 32) + '...';
          setCurrentConvTitle(title);
        }
      }

      await fetch('/api/conversations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentConvIdRef.current,
          title,
          messages: msgs,
          mode: isContinuousModeRef.current ? 'hands_free_voice' : 'chat',
          tokenCount: msgs.length * 40
        })
      });

      fetchSavedData();
    } catch (_) {}
  }, [fetchSavedData]);

  // TTS Speech Utterance Helper with duplex handoff and echo cancellation
  const speakText = useCallback((text: string, onDoneCallback?: () => void) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onDoneCallback) onDoneCallback();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = true;
      ignoreAudioUntilRef.current = Date.now() + 60000; // Block audio capture while speaking
      setVoiceLoopState('speaking');

      // Abort recognition immediately so mic doesn't capture TTS output
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      // Clean markdown symbols for natural human speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block generated and stored.')
        .replace(/[*_`#>\[\]~]/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 800);

      if (!cleanText) {
        isSpeakingRef.current = false;
        ignoreAudioUntilRef.current = Date.now() + 600;
        setVoiceLoopState('standby');
        if (onDoneCallback) onDoneCallback();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      
      // Match by exact name or preferred fallback
      let chosen = voices.find(v => v.name === selectedVoiceName || v.voiceURI === selectedVoiceName);
      if (!chosen) {
        chosen = voices.find(v => 
          v.name.includes('Samantha') || 
          v.name.includes('Google US English') || 
          v.name.includes('Natural') || 
          v.name.includes('Victoria') ||
          v.name.includes('Female') ||
          v.lang === 'en-US' ||
          v.lang.startsWith('en')
        ) || voices[0];
      }
      if (chosen) utterance.voice = chosen;

      utterance.pitch = voicePitch;
      utterance.rate = voiceRate;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        ignoreAudioUntilRef.current = Date.now() + 60000;
        setVoiceLoopState('speaking');
      };

      const finishSpeech = () => {
        isSpeakingRef.current = false;
        ignoreAudioUntilRef.current = Date.now() + 1000; // Allow 1000ms for room echo to dissipate
        setVoiceLoopState('standby');
        if (onDoneCallback) {
          onDoneCallback();
        } else if (isContinuousModeRef.current || wakeWordActiveRef.current) {
          // Automatic duplex handoff: resume listening after echo clearance window
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if ((isContinuousModeRef.current || wakeWordActiveRef.current) && !isStreamingRef.current && !isSpeakingRef.current) {
              if (isContinuousModeRef.current) {
                chime.playListeningChime();
                ignoreAudioUntilRef.current = Date.now() + 600;
              }
              startSpeechCapture();
            }
          }, 800);
        }
      };

      utterance.onend = finishSpeech;
      utterance.onerror = finishSpeech;

      window.speechSynthesis.speak(utterance);
    } catch (_) {
      isSpeakingRef.current = false;
      ignoreAudioUntilRef.current = Date.now() + 600;
      setVoiceLoopState('standby');
      if (onDoneCallback) onDoneCallback();
    }
  }, [ttsEnabled, selectedVoiceName, voicePitch, voiceRate]);

  // Interrupt helper (barge-in while speaking)
  const handleInterrupt = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setVoiceLoopState('standby');
    if (isContinuousModeRef.current) {
      setTimeout(() => {
        chime.playListeningChime();
        startSpeechCapture();
      }, 150);
    }
    onShowToast('Interrupted — Sapphire listening now', 'info');
  }, [onShowToast]);

  // Core Send Message function (invoked by typing OR hands-free voice loop)
  const handleSendMessage = useCallback(async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || isStreamingRef.current) return;

    lastSubmittedPromptRef.current = textToSend.toLowerCase();
    lastSubmittedTimeRef.current = Date.now();
    ignoreAudioUntilRef.current = Date.now() + 1500;

    // Check voice command triggers inside spoken text
    const lower = textToSend.toLowerCase();
    if (
      lower.includes('stop conversation') || 
      lower.includes('pause conversation') || 
      lower.includes('exit conversation mode') || 
      lower === 'stop' ||
      lower === 'pause' ||
      lower === 'turn off conversation'
    ) {
      setIsContinuousMode(false);
      isContinuousModeRef.current = false;
      stopSpeechCapture();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      chime.playPauseChime();
      const exitMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'ai',
        text: "I have turned off Continuous Conversation Mode. You can turn it back on anytime with the Conversation button or by saying 'Hey Sapphire'.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tags: ['🎙️ CONVERSATION OFF']
      };
      setMessages(prev => [...prev, exitMsg]);
      speakText(exitMsg.text);
      onShowToast('Continuous Conversation Mode: OFF', 'info');
      return;
    }

    if (lower.includes('save conversation') || lower.includes('save our conversation')) {
      handleManualSaveConversation();
      return;
    }

    if (lower.includes('extract files') || lower.includes('save files')) {
      handleExtractAndSaveFiles();
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMsgs = [...messagesRef.current, userMsg];
    setMessages(newMsgs);
    setInputPrompt('');
    setInterimTranscript('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const aiMsgId = (Date.now() + 1).toString();
    const placeholderAiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'ai',
      text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tags: isContinuousModeRef.current ? ['💎 SAPPHIRE', '🎙️ CONTINUOUS VOICE'] : ['💎 SAPPHIRE']
    };

    setMessages(prev => [...prev, placeholderAiMsg]);
    setIsStreaming(true);
    isStreamingRef.current = true;
    setVoiceLoopState('processing');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/sapphire/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: newMsgs.slice(-12).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text
          })),
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Stream connection error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkStr = decoder.decode(value);
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.replace(/^data:\s*/, '').trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.token) {
                accumulatedText += data.token;
                setMessages(prev => 
                  prev.map(m => m.id === aiMsgId ? { ...m, text: accumulatedText } : m)
                );
              }
              if (data.type === 'done') {
                if (data.usage?.total_tokens) {
                  setTokenCount(prev => prev + data.usage.total_tokens);
                }
              }
            } catch (_) {}
          }
        }
      }

      // Auto-save the full transcript to storage
      const finalMsgs = [...newMsgs, { ...placeholderAiMsg, text: accumulatedText }];
      autoSaveConversation(finalMsgs);

      // Speak response out loud & seamlessly loop back to listening if in continuous mode
      if (accumulatedText) {
        lastSpokenAiResponseRef.current = accumulatedText;
        speakText(accumulatedText, () => {
          // ON TTS FINISH: If continuous mode is on, resume listening cleanly after echo clearance!
          if (isContinuousModeRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isContinuousModeRef.current && !isStreamingRef.current && !isSpeakingRef.current) {
                chime.playListeningChime();
                ignoreAudioUntilRef.current = Date.now() + 600;
                startSpeechCapture();
              }
            }, 800);
          }
        });
      } else if (isContinuousModeRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (isContinuousModeRef.current && !isStreamingRef.current && !isSpeakingRef.current) {
            startSpeechCapture();
          }
        }, 500);
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorText = 'I am right here with you, Damone. Systems and neural pipelines are hot and ready. What shall we tackle next?';
        lastSpokenAiResponseRef.current = errorText;
        setMessages(prev => 
          prev.map(m => m.id === aiMsgId ? { ...m, text: errorText } : m)
        );
        if (isContinuousModeRef.current) {
          speakText(errorText, () => {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isContinuousModeRef.current && !isStreamingRef.current && !isSpeakingRef.current) {
                chime.playListeningChime();
                ignoreAudioUntilRef.current = Date.now() + 600;
                startSpeechCapture();
              }
            }, 800);
          });
        }
      }
    } finally {
      setIsStreaming(false);
      isStreamingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [inputPrompt, selectedModel, speakText, autoSaveConversation, onShowToast]);

  // Handle incoming pending command (e.g. from global wake word on another page)
  useEffect(() => {
    if (pendingCommand && pendingCommand.trim()) {
      const cmd = pendingCommand.trim();
      if (onClearPendingCommand) onClearPendingCommand();
      handleSendMessage(cmd);
    }
  }, [pendingCommand, handleSendMessage, onClearPendingCommand]);

  // Audio Level Monitoring using Web Audio API
  const stopAudioLevelMonitoring = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    setMicVolumeLevel(0);
  }, []);

  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolumeLevel(normalized);
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (err) {
      console.warn("Audio monitoring init error:", err);
    }
  }, []);

  // Send captured audio blob to /api/voice/transcribe (Gemini Server-side STT fallback)
  const sendAudioBlobForTranscription = useCallback(async (blob: Blob) => {
    if (blob.size < 800) return;
    setIsTranscribingAudio(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64Data, mimeType: blob.type || 'audio/webm' })
          });
          const data = await res.json();
          if (data.success && data.transcript && data.transcript.trim()) {
            onShowToast(`Transcribed: "${data.transcript}"`, 'success');
            handleSendMessage(data.transcript.trim());
          }
        } catch (netErr) {
          console.warn("Voice transcribe network error:", netErr);
        } finally {
          setIsTranscribingAudio(false);
        }
      };
    } catch (err) {
      console.warn("Voice transcribe failed:", err);
      setIsTranscribingAudio(false);
    }
  }, [handleSendMessage, onShowToast]);

  // Speech Recognition Initializer (Dual Engine: Web Speech API + Audio Stream Monitor + Gemini STT Fallback)
  const startSpeechCapture = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // If Sapphire is currently speaking her answer, wait until she's done before turning on mic
    if (isSpeakingRef.current) return;

    setSpeechErrorMsg(null);

    // 1. Request microphone stream via getUserMedia for hardware access & level metering
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        if (!audioStreamRef.current || !audioStreamRef.current.active) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = stream;
          setMicPermissionState('granted');
          startAudioLevelMonitoring(stream);

          // Setup MediaRecorder fallback
          try {
            audioChunksRef.current = [];
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };
            recorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              audioChunksRef.current = [];
              if (!lastSpokenTextRef.current && audioBlob.size > 1000) {
                sendAudioBlobForTranscription(audioBlob);
              }
            };
            recorder.start(250);
            mediaRecorderRef.current = recorder;
            setIsRecordingAudio(true);
          } catch (_) {}
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicPermissionState('denied');
          setSpeechErrorMsg('Microphone access denied. Please click the lock icon in your browser address bar to allow microphone access.');
          onShowToast('Microphone access blocked — click address bar lock icon', 'error');
          setIsContinuousMode(false);
          isContinuousModeRef.current = false;
          setVoiceLoopState('standby');
          return;
        }
      }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceLoopState('listening');
      onShowToast('Using server-side Gemini audio engine for speech recognition', 'info');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      lastSpokenTextRef.current = '';

      const processSpokenPhrase = (rawText: string) => {
        if (!rawText || !rawText.trim()) return;
        if (isSpeakingRef.current || Date.now() < ignoreAudioUntilRef.current) {
          return;
        }

        const trimmed = rawText.trim();
        const lowerPhrase = trimmed.toLowerCase();

        // 1. Anti-Echo Filter: Discard identical duplicate utterance within 4.0s window
        if (lowerPhrase === lastSubmittedPromptRef.current && (Date.now() - lastSubmittedTimeRef.current) < 4000) {
          console.log("[Duplex Filter] Discarding identical duplicate utterance within 4s window");
          return;
        }

        // 2. Anti-Echo Filter: Discard transcripts matching Sapphire's own speech output (speaker-to-mic feedback)
        const lastAiClean = (lastSpokenAiResponseRef.current || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
        const candidateClean = lowerPhrase.replace(/[^a-z0-9\s]/g, ' ');
        if (lastAiClean && candidateClean.length > 8 && lastAiClean.includes(candidateClean)) {
          console.log("[Duplex Filter] Transcript matches Sapphire's spoken output, suppressing acoustic feedback");
          return;
        }

        clearTimeout(silenceTimerRef.current);
        setInterimTranscript('');
        lastSpokenTextRef.current = trimmed;

        // Use the centralized Speech & Wake Word Router
        const route = routeSpokenSpeech(trimmed, isContinuousModeRef.current, DEFAULT_WAKE_CONFIG);

        if (route.intent === 'ignore') {
          return;
        }

        if (route.intent === 'wake_ping') {
          chime.playWakeChime();
          onShowToast("🎙️ 'Hey Sapphire' Detected — Listening for your command...", 'success');
          const wakeReply = "I'm listening, Damone. What do you need?";
          lastSpokenAiResponseRef.current = wakeReply;
          speakText(wakeReply, () => {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (!isStreamingRef.current && !isSpeakingRef.current) {
                chime.playListeningChime();
                ignoreAudioUntilRef.current = Date.now() + 600;
                startSpeechCapture();
              }
            }, 800);
          });
          return;
        }

        if (route.intent === 'continuous_start') {
          setIsContinuousMode(true);
          isContinuousModeRef.current = true;
          chime.playWakeChime();
          const startMsg = "Continuous Conversation is active. I'll stay on, listen, and talk with you back-and-forth for as long as you want.";
          lastSpokenAiResponseRef.current = startMsg;
          speakText(startMsg, () => {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isContinuousModeRef.current && !isStreamingRef.current && !isSpeakingRef.current) {
                chime.playListeningChime();
                ignoreAudioUntilRef.current = Date.now() + 600;
                startSpeechCapture();
              }
            }, 800);
          });
          onShowToast('Continuous Conversation Mode: ON', 'success');
          return;
        }

        if (route.intent === 'continuous_stop') {
          setIsContinuousMode(false);
          isContinuousModeRef.current = false;
          chime.playPauseChime();
          const pauseMsg = "Continuous mode paused. Say 'Hey Sapphire' whenever you'd like to talk.";
          lastSpokenAiResponseRef.current = pauseMsg;
          speakText(pauseMsg);
          onShowToast('Continuous Conversation Mode: OFF', 'info');
          return;
        }

        if (route.isWakeWord) {
          chime.playWakeChime();
        }

        // Process and send the user's spoken sentence to Gemini / Sapphire
        try {
          if (recognitionRef.current) recognitionRef.current.stop();
        } catch (_) {}
        handleSendMessage(route.cleanQuery || trimmed);
      };

      recognition.onstart = () => {
        setVoiceLoopState('listening');
        setSpeechErrorMsg(null);
      };

      recognition.onresult = (e: any) => {
        // Echo filter: ignore any audio if Sapphire is speaking or during post-speech grace period
        if (isSpeakingRef.current || Date.now() < ignoreAudioUntilRef.current) {
          return;
        }

        let finalTranscript = '';
        let interim = '';

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          } else {
            interim += e.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
          // Set silence debounce: if user speaks and pauses for 1.4s, process the speech automatically
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (interim.trim() && !isSpeakingRef.current && !isStreamingRef.current && Date.now() >= ignoreAudioUntilRef.current) {
              processSpokenPhrase(interim);
            }
          }, 1400);
        }

        if (finalTranscript.trim()) {
          clearTimeout(silenceTimerRef.current);
          processSpokenPhrase(finalTranscript);
        }
      };

      recognition.onerror = (e: any) => {
        clearTimeout(silenceTimerRef.current);
        if (e.error === 'not-allowed') {
          setMicPermissionState('denied');
          setSpeechErrorMsg('Microphone access was denied. Please allow microphone permissions in your browser.');
          onShowToast('Microphone access blocked — please enable mic permission', 'error');
          setIsContinuousMode(false);
          isContinuousModeRef.current = false;
          setVoiceLoopState('standby');
          return;
        }

        // For transient errors like no-speech or network, auto-retry if continuous mode or wake word is active
        if ((isContinuousModeRef.current || wakeWordActiveRef.current) && !isSpeakingRef.current && !isStreamingRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if ((isContinuousModeRef.current || wakeWordActiveRef.current) && !isSpeakingRef.current && !isStreamingRef.current) {
              try {
                recognition.start();
              } catch (_) {}
            }
          }, 300);
        }
      };

      recognition.onend = () => {
        clearTimeout(silenceTimerRef.current);
        // KEEP-ALIVE: If continuous mode or wake word is on and we are not speaking or streaming, keep listening!
        if ((isContinuousModeRef.current || wakeWordActiveRef.current) && !isStreamingRef.current && !isSpeakingRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if ((isContinuousModeRef.current || wakeWordActiveRef.current) && !isStreamingRef.current && !isSpeakingRef.current) {
              try {
                recognition.start();
              } catch (_) {
                startSpeechCapture();
              }
            }
          }, 200);
        } else if (!isContinuousModeRef.current && !wakeWordActiveRef.current && !isSpeakingRef.current) {
          setVoiceLoopState('standby');
          stopAudioLevelMonitoring();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setVoiceLoopState('listening');
    } catch (_) {
      if ((isContinuousModeRef.current || wakeWordActiveRef.current) && !isSpeakingRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => startSpeechCapture(), 400);
      } else {
        setVoiceLoopState('standby');
      }
    }
  }, [handleSendMessage, onShowToast, speakText, startAudioLevelMonitoring, stopAudioLevelMonitoring, sendAudioBlobForTranscription]);

  // Stop Speech Capture
  const stopSpeechCapture = useCallback((clearMedia = true) => {
    clearTimeout(restartTimerRef.current);
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
      mediaRecorderRef.current = null;
    }
    setIsRecordingAudio(false);
    stopAudioLevelMonitoring();
    if (clearMedia && audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    setVoiceLoopState('standby');
    setInterimTranscript('');
  }, [stopAudioLevelMonitoring]);

  // Handle Diagnostic Audio & TTS Test
  const handleTestVoiceTTS = useCallback(() => {
    chime.playWakeChime();
    speakText("Sapphire voice synthesis online. Audio output is fully operational.", () => {
      onShowToast("Voice audio test completed successfully!", "success");
    });
  }, [speakText, onShowToast]);

  // Simulate "Hey Sapphire" Wake Word
  const handleSimulateWakeWord = useCallback(() => {
    chime.playWakeChime();
    onShowToast("🎙️ 'Hey Sapphire' Trigger Simulated!", "success");
    const wakeReply = "I'm listening, Damone. What do you need?";
    speakText(wakeReply, () => {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => {
        chime.playListeningChime();
        startSpeechCapture();
      }, 400);
    });
  }, [speakText, startSpeechCapture, onShowToast]);

  // Test full voice command flow (e.g. "Hey Sapphire, report system status")
  const handleTestVoiceCommand = useCallback((cmdText: string) => {
    chime.playWakeChime();
    onShowToast(`🎙️ Voice Command: "${cmdText}"`, "info");
    handleSendMessage(cmdText);
  }, [handleSendMessage, onShowToast]);

  // Interactive 3-Second Microphone Diagnostic Test
  const handleTestMic = useCallback(async () => {
    if (testMicRunning) return;
    setTestMicRunning(true);
    setTestMicOutput('Requesting microphone access and recording 3 seconds of sample audio...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startAudioLevelMonitoring(stream);
      const testChunks: Blob[] = [];
      const testRecorder = new MediaRecorder(stream);
      testRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) testChunks.push(e.data);
      };
      testRecorder.start(100);

      setTimeout(async () => {
        testRecorder.stop();
        stream.getTracks().forEach(t => t.stop());
        stopAudioLevelMonitoring();
        const testBlob = new Blob(testChunks, { type: 'audio/webm' });
        if (testBlob.size < 500) {
          setTestMicOutput('⚠️ Audio was recorded, but volume was very low or silent. Please check your mic input levels in system settings.');
          setTestMicRunning(false);
          return;
        }
        setTestMicOutput('Analyzing recorded audio with Gemini STT engine...');
        const reader = new FileReader();
        reader.readAsDataURL(testBlob);
        reader.onloadend = async () => {
          try {
            const res = await fetch('/api/voice/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: reader.result as string, mimeType: testBlob.type || 'audio/webm' })
            });
            const data = await res.json();
            if (data.success && data.transcript) {
              setTestMicOutput(`✅ Microphone Verified! Detected Speech: "${data.transcript}"`);
              onShowToast('Microphone test passed!', 'success');
            } else {
              setTestMicOutput(`✅ Hardware OK (${(testBlob.size / 1024).toFixed(1)} KB audio captured). Ready for commands.`);
            }
          } catch (e) {
            setTestMicOutput(`✅ Hardware OK (${(testBlob.size / 1024).toFixed(1)} KB captured).`);
          } finally {
            setTestMicRunning(false);
          }
        };
      }, 3000);
    } catch (err: any) {
      setTestMicOutput(`❌ Microphone Error: ${err.message || 'Permission denied'}. Click the lock icon in your browser to enable.`);
      setTestMicRunning(false);
    }
  }, [testMicRunning, startAudioLevelMonitoring, stopAudioLevelMonitoring, onShowToast]);

  // Toggle Continuous Conversation Mode (The requested dedicated button)
  const toggleContinuousMode = () => {
    if (isContinuousMode) {
      setIsContinuousMode(false);
      isContinuousModeRef.current = false;
      stopSpeechCapture(true);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
      chime.playPauseChime();
      onShowToast('Continuous Conversation Mode: OFF', 'info');
    } else {
      setIsContinuousMode(true);
      isContinuousModeRef.current = true;
      chime.playWakeChime();
      onShowToast('Continuous Conversation Mode: ON — I speak, she speaks, non-stop!', 'success');
      startSpeechCapture();
    }
  };

  // Single Mic Click handler
  const handleMicClick = () => {
    if (isSpeakingRef.current) {
      handleInterrupt();
      return;
    }
    if (voiceLoopState === 'listening') {
      stopSpeechCapture(true);
    } else {
      chime.playListeningChime();
      startSpeechCapture();
    }
  };

  // Auto-start listening on mount when wakeWordActive or isContinuousMode is active
  useEffect(() => {
    if (wakeWordActive || isContinuousMode) {
      const timer = setTimeout(() => {
        startSpeechCapture();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [wakeWordActive, isContinuousMode, startSpeechCapture]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(restartTimerRef.current);
      clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceLoopState('standby');
  };

  // Copy Code Snippet
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    onShowToast('Code copied to clipboard', 'info');
  };

  // Manual Save Current Conversation
  const handleManualSaveConversation = async () => {
    setIsSavingConv(true);
    try {
      const res = await fetch('/api/conversations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentConvId,
          title: currentConvTitle,
          messages,
          mode: isContinuousMode ? 'hands_free_voice' : 'chat',
          tags: ['💾 Manually Stored', '💎 Sapphire']
        })
      });
      const data = await res.json();
      if (data.ok) {
        chime.playSaveChime();
        onShowToast('Conversation stored securely in persistent storage', 'success');
        fetchSavedData();
      }
    } catch (_) {
      onShowToast('Failed to save conversation', 'error');
    } finally {
      setIsSavingConv(false);
    }
  };

  // Extract & Save Files from Chat
  const handleExtractAndSaveFiles = async () => {
    setIsExtractingFiles(true);
    try {
      const res = await fetch('/api/files/extract-from-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      if (data.ok) {
        chime.playSaveChime();
        onShowToast(`Saved ${data.savedCount} code/text files from conversation into storage!`, 'success');
        fetchSavedData();
        setActiveTab('files');
      }
    } catch (_) {
      onShowToast('Failed to extract files', 'error');
    } finally {
      setIsExtractingFiles(false);
    }
  };

  // Load a Saved Conversation
  const handleLoadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      const data = await res.json();
      if (data.ok && data.conversation) {
        setCurrentConvId(data.conversation.id);
        setCurrentConvTitle(data.conversation.title);
        setMessages(data.conversation.messages || []);
        onShowToast(`Loaded "${data.conversation.title}"`, 'info');
      }
    } catch (_) {
      onShowToast('Error loading conversation', 'error');
    }
  };

  // Start a New Conversation
  const handleNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    setCurrentConvId(newId);
    setCurrentConvTitle('New Session');
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'ai',
        text: "New session initialized. All memory and plugins are ready. What are we working on?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tags: ['💎 FRESH SESSION']
      }
    ]);
    onShowToast('Started new conversation session', 'info');
  };

  // Export Chat
  const handleExportChat = (format: 'md' | 'json' = 'md') => {
    const filename = `${currentConvTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.${format}`;
    let content = '';

    if (format === 'json') {
      content = JSON.stringify({ id: currentConvId, title: currentConvTitle, messages }, null, 2);
    } else {
      content = `# ${currentConvTitle}\n\n**Exported:** ${new Date().toLocaleString()}\n\n---\n\n` +
        messages.map(m => `### ${m.role === 'user' ? '👤 You' : '💎 Sapphire'} (${m.time})\n\n${m.text}\n`).join('\n---\n\n');
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    chime.playSaveChime();
    onShowToast(`Exported transcript as ${format.toUpperCase()}`, 'success');
  };

  // Add Custom File manually
  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      onShowToast('Please provide a file name', 'warn');
      return;
    }
    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFileName.trim(),
          content: newFileContent,
          fileType: newFileName.endsWith('.py') || newFileName.endsWith('.sh') || newFileName.endsWith('.js') || newFileName.endsWith('.ts') ? 'code' : 'text'
        })
      });
      const data = await res.json();
      if (data.ok) {
        onShowToast(`File ${newFileName} saved to persistent storage`, 'success');
        setNewFileName('');
        setNewFileContent('');
        setIsAddFileOpen(false);
        fetchSavedData();
      }
    } catch (_) {
      onShowToast('Error saving file', 'error');
    }
  };

  return (
    <div className="grid h-[calc(100vh-3.5rem)] w-full grid-cols-1 overflow-hidden lg:grid-cols-[260px_1fr_300px]">
      
      {/* LEFT SIDEBAR: Plugins & Voice Controls */}
      <aside className="hidden flex-col border-r border-[#262626] bg-[#0c0c0c] lg:flex">
        {/* Plugins Header */}
        <div className="flex items-center justify-between border-b border-[#262626] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[#a3a3a3]">
          <span>🔌 Active Plugins</span>
          <span className="text-[10px] text-[#E0FF25]">{plugins.filter(p => p.on).length} ON</span>
        </div>

        {/* Plugin Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {plugins.map(plugin => (
            <div
              key={plugin.id}
              className="flex items-center justify-between rounded-lg border border-transparent p-2 transition hover:border-[#262626] hover:bg-[#141414]"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{ backgroundColor: `${plugin.color}22`, border: `1px solid ${plugin.color}44` }}
                >
                  {plugin.icon}
                </div>
                <div className="flex flex-col truncate">
                  <span className="truncate text-xs font-bold uppercase tracking-wider text-white">{plugin.name}</span>
                  <span className="truncate text-[10px] text-[#737373]">{plugin.desc}</span>
                </div>
              </div>

              {/* Toggle switch */}
              <button id="btn-sapphirepage-1"
                onClick={() => onTogglePlugin(plugin.id)}
                className={`relative h-4 w-7 shrink-0 rounded-full transition ${
                  plugin.on ? 'bg-[#E0FF25]' : 'bg-[#262626]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
                    plugin.on ? 'left-3.5 bg-black' : 'left-0.5 bg-[#a3a3a3]'
                  }`}
                />
              </button>
            </div>
          ))}

          <button id="btn-sapphirepage-2"
            onClick={onOpenInstallPlugin}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#262626] py-2 text-xs font-bold uppercase tracking-wider text-[#E0FF25] transition hover:border-[#E0FF25]/60 hover:bg-[#E0FF25]/10"
          >
            <Plus className="h-3.5 w-3.5" /> Install Plugin
          </button>
        </div>

        {/* VOICE ENGINE & HANDS-FREE SECTION */}
        <div className="border-t border-[#262626] bg-[#070707] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#a3a3a3]">
              🎙️ Voice Engine
            </span>
            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
              isContinuousMode ? 'bg-[#E0FF25] text-black animate-pulse' : 'bg-[#262626] text-[#a3a3a3]'
            }`}>
              {isContinuousMode ? 'HANDS-FREE ON' : 'PUSH TO TALK'}
            </span>
          </div>

          {/* Continuous Mode Toggle Button */}
          <button id="btn-sapphirepage-3"
            onClick={toggleContinuousMode}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-xs font-black uppercase tracking-wider transition ${
              isContinuousMode
                ? 'border-[#E0FF25] bg-[#E0FF25] text-black shadow-lg shadow-[#E0FF25]/20'
                : 'border-[#262626] bg-[#141414] text-[#E0FF25] hover:border-[#E0FF25]/50'
            }`}
          >
            {isContinuousMode ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" /> Pause Conversation Mode
              </>
            ) : (
              <>
                <Radio className="h-3.5 w-3.5" /> Start Conversation Mode
              </>
            )}
          </button>

          {/* Mic Visualizer & Status */}
          <div className="flex flex-col items-center gap-2 rounded-lg border border-[#262626] bg-[#0e0e0e] p-3">
            <button id="btn-sapphirepage-4"
              onClick={handleMicClick}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl transition-all ${
                voiceLoopState === 'listening'
                  ? 'border-[#E0FF25] bg-[#E0FF25]/20 text-[#E0FF25] animate-pulse shadow-lg shadow-[#E0FF25]/30'
                  : voiceLoopState === 'speaking'
                  ? 'border-[#0a84ff] bg-[#0a84ff]/20 text-[#0a84ff]'
                  : 'border-[#262626] bg-[#181818] text-[#a3a3a3] hover:border-[#E0FF25] hover:text-white'
              }`}
            >
              <Mic className="h-5 w-5" />
            </button>

            {/* Audio Waveform */}
            <div className="flex h-5 items-center gap-1">
              {[0.1, 0.2, 0.3, 0.4, 0.2, 0.1, 0.3].map((delay, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all ${
                    voiceLoopState === 'listening'
                      ? 'h-4 bg-[#E0FF25] animate-pulse'
                      : voiceLoopState === 'speaking'
                      ? 'h-3 bg-[#0a84ff] animate-bounce'
                      : 'h-1.5 bg-[#262626]'
                  }`}
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>

            <div className="text-center font-mono text-[10px] uppercase tracking-wider text-[#a3a3a3]">
              {voiceLoopState === 'listening' ? (
                <span className="text-[#E0FF25] font-bold animate-pulse">● Listening (Speak now)...</span>
              ) : voiceLoopState === 'speaking' ? (
                <span className="text-[#0a84ff] font-bold">🔊 Sapphire Speaking...</span>
              ) : voiceLoopState === 'processing' ? (
                <span className="text-amber-400 font-bold">⚡ Thinking...</span>
              ) : (
                <span>Say "Hey Sapphire" anytime</span>
              )}
            </div>
          </div>

          {/* Voice Selector & Tuning */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">TTS Voice</label>
              <button id="btn-sapphirepage-5"
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="text-[10px] font-mono text-[#E0FF25] hover:underline"
              >
                {showVoiceSettings ? 'Hide Tuning' : 'Tune Voice'}
              </button>
            </div>

            <select
              value={selectedVoiceName}
              onChange={e => handleVoiceChange(e.target.value)}
              className="w-full rounded-md border border-[#262626] bg-[#141414] px-2.5 py-1.5 font-mono text-[11px] text-white outline-none focus:border-[#E0FF25]"
            >
              <optgroup label="🌟 Curated Kokoro Voices">
                <option value="Samantha">Samantha (Warm, Natural & Expressive)</option>
                <option value="af_sarah">af_sarah (Kokoro Expressive Female)</option>
                <option value="af_bella">af_bella (Kokoro Gentle & Soft)</option>
                <option value="af_nicole">af_nicole (Kokoro Clear & Crisp)</option>
                <option value="af_sky">af_sky (Kokoro Empathetic)</option>
                <option value="am_adam">am_adam (Kokoro Confident Male)</option>
                <option value="am_michael">am_michael (Kokoro Direct Male)</option>
                <option value="bf_emma">bf_emma (Kokoro British Female)</option>
              </optgroup>
              {availableVoices.length > 0 && (
                <optgroup label="💻 System & Browser Voices">
                  {availableVoices.map((v, idx) => (
                    <option key={`voice_${v.name}_${v.lang}_${v.voiceURI || idx}`} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <button id="btn-sapphirepage-6"
              onClick={() => {
                speakText("Hey! I'm Sapphire. Your voice engine is configured and ready.");
                onShowToast(`Testing voice: ${selectedVoiceName}`, 'info');
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[#262626] bg-[#181818] py-1.5 font-mono text-[10px] font-black uppercase text-[#E0FF25] hover:border-[#E0FF25]/50 transition"
            >
              <Volume2 className="h-3.5 w-3.5" /> Test Selected Voice
            </button>

            {/* Pitch and Speed Tuning Sliders */}
            {showVoiceSettings && (
              <div className="space-y-2 rounded-lg border border-[#262626] bg-[#101010] p-2.5 text-[10px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-[#a3a3a3]">
                    <span>Pitch:</span>
                    <span className="font-mono text-[#E0FF25]">{voicePitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={voicePitch}
                    onChange={e => handlePitchChange(parseFloat(e.target.value))}
                    className="w-full accent-[#E0FF25]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[#a3a3a3]">
                    <span>Speed / Rate:</span>
                    <span className="font-mono text-[#E0FF25]">{voiceRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={voiceRate}
                    onChange={e => handleRateChange(parseFloat(e.target.value))}
                    className="w-full accent-[#E0FF25]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Capabilities */}
        <div className="border-t border-[#262626] p-2 space-y-1 max-h-36 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#737373]">
            ⚡ Quick Actions
          </div>
          {[
            { label: '🤖 AI Pipeline Check', prompt: 'Run status check on all model endpoints and active neural pipelines' },
            { label: '📊 Summarize All Data', prompt: 'Summarize our recent memories, files, and server health status' },
            { label: '💾 Save All Files', prompt: 'Extract and persist all code blocks into the permanent workspace files' }
          ].map((cap, i) => (
            <button id="btn-sapphirepage-7"
              key={i}
              onClick={() => handleSendMessage(cap.prompt)}
              className="w-full truncate rounded-md bg-[#141414] px-2 py-1.5 text-left font-mono text-[10px] font-bold uppercase text-[#a3a3a3] transition hover:bg-[#1f1f1f] hover:text-white"
            >
              {cap.label}
            </button>
          ))}
        </div>
      </aside>

      {/* CENTER CHAT AREA */}
      <main className="flex h-full flex-col overflow-hidden bg-[#050505]">
        {/* Chat Topbar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#262626] bg-[#0c0c0c] px-3 sm:px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="truncate text-xs font-black uppercase tracking-wider text-white">
              {currentConvTitle}
            </span>
            <span className="hidden rounded-md border border-[#E0FF25]/40 bg-[#E0FF25]/10 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-[#E0FF25] sm:inline">
              NeuroCore v3
            </span>

            {/* DEDICATED CONTINUOUS CONVERSATION TOP BUTTON */}
            <button id="btn-sapphirepage-8"
              onClick={toggleContinuousMode}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition ${
                isContinuousMode
                  ? 'border border-[#E0FF25] bg-[#E0FF25] text-black shadow-lg shadow-[#E0FF25]/25 animate-pulse'
                  : 'border border-[#262626] bg-[#141414] text-[#E0FF25] hover:border-[#E0FF25]/60 hover:bg-[#1a1a1a]'
              }`}
            >
              {isContinuousMode ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Conversation: ACTIVE (Non-Stop)</span>
                </>
              ) : (
                <>
                  <Radio className="h-3.5 w-3.5 text-[#E0FF25]" />
                  <span>Continuous Conversation</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Save indicator */}
            <span className="hidden items-center gap-1 text-[10px] font-mono uppercase text-[#737373] md:flex mr-2">
              <CheckCircle2 className="h-3 w-3 text-[#E0FF25]" /> Auto-Saved
            </span>

            {/* Mute/Unmute TTS */}
            <button id="btn-sapphirepage-9"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? 'Voice output enabled — click to mute' : 'Voice output muted — click to enable'}
              className={`rounded-md border p-1.5 text-xs transition ${
                ttsEnabled
                  ? 'border-[#E0FF25]/50 bg-[#E0FF25]/10 text-[#E0FF25]'
                  : 'border-[#262626] bg-[#141414] text-[#737373]'
              }`}
            >
              {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>

            {/* Save Files Button */}
            <button id="btn-sapphirepage-10"
              onClick={handleExtractAndSaveFiles}
              disabled={isExtractingFiles}
              title="Extract all generated code blocks and save them to persistent files"
              className="hidden items-center gap-1 rounded-md border border-[#262626] bg-[#141414] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25] sm:flex"
            >
              <FolderDown className="h-3.5 w-3.5 text-[#E0FF25]" />
              <span>Save Files</span>
            </button>

            {/* Save Conversation Snapshot */}
            <button id="btn-sapphirepage-11"
              onClick={handleManualSaveConversation}
              disabled={isSavingConv}
              title="Store conversation snapshot into persistent database"
              className="hidden items-center gap-1 rounded-md border border-[#262626] bg-[#141414] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25] sm:flex"
            >
              <Save className="h-3.5 w-3.5 text-[#E0FF25]" />
              <span>Save Chat</span>
            </button>

            {/* Export Markdown */}
            <button id="btn-sapphirepage-12"
              onClick={() => handleExportChat('md')}
              title="Export chat transcript as Markdown"
              className="flex items-center gap-1 rounded-md border border-[#262626] bg-[#141414] p-1.5 text-[#a3a3a3] transition hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            {/* New Session */}
            <button id="btn-sapphirepage-13"
              onClick={handleNewConversation}
              title="Start a fresh conversation"
              className="flex items-center gap-1 rounded-md border border-[#262626] bg-[#141414] p-1.5 text-[#a3a3a3] transition hover:text-[#E0FF25]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* CONTINUOUS DUPLEX AUDIO HUD BANNER */}
        {isContinuousMode && (
          <div className="border-b border-[#E0FF25]/40 bg-[#0c1404] px-4 py-2.5 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {/* Visual Audio Waveform */}
                <div className="flex h-5 items-center gap-1">
                  {[0.1, 0.25, 0.4, 0.2, 0.35, 0.15, 0.3].map((delay, idx) => (
                    <span
                      key={idx}
                      className={`w-1 rounded-full transition-all ${
                        voiceLoopState === 'listening'
                          ? 'h-5 bg-[#E0FF25] animate-pulse'
                          : voiceLoopState === 'speaking'
                          ? 'h-4 bg-[#0a84ff] animate-bounce'
                          : 'h-1.5 bg-[#E0FF25]/40'
                      }`}
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black uppercase tracking-wider text-[#E0FF25]">
                      {voiceLoopState === 'listening' && '🟢 Listening... (Speak freely)'}
                      {voiceLoopState === 'processing' && '⚡ Sapphire reasoning...'}
                      {voiceLoopState === 'speaking' && '🔊 Sapphire is speaking...'}
                      {voiceLoopState === 'standby' && '🔁 Conversation loop armed'}
                    </span>
                    <span className="rounded bg-black px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#a3a3a3]">
                      Continuous Hands-Free
                    </span>
                  </div>
                  <span className="text-[10px] text-[#a3a3a3]">
                    {voiceLoopState === 'speaking'
                      ? 'Listening will automatically resume the second she finishes speaking (or tap Interrupt).'
                      : 'You speak, she speaks, she listens — continuously open until you turn it off.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {voiceLoopState === 'speaking' && (
                  <button id="btn-sapphirepage-14"
                    onClick={handleInterrupt}
                    className="rounded border border-amber-400/80 bg-amber-500/20 px-2.5 py-1 text-[10px] font-black uppercase text-amber-300 hover:bg-amber-500/30 transition"
                  >
                    ✋ Interrupt & Speak
                  </button>
                )}

                <button id="btn-sapphirepage-15"
                  onClick={toggleContinuousMode}
                  className="rounded border border-[#E0FF25] bg-[#E0FF25] px-3 py-1 font-mono text-[10px] font-black uppercase text-black hover:bg-[#ccff00] transition"
                >
                  Turn Off
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voice & Hardware Diagnostics Bar */}
        <div className="border-b border-[#262626] bg-[#0f0f0f] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {/* Live Mic Level Visualizer */}
            <div className="flex items-center gap-1.5 bg-[#181818] border border-[#262626] rounded px-2 py-0.5" title={`Mic Volume Level: ${micVolumeLevel}%`}>
              <span className="font-mono text-[9px] font-bold text-[#737373] uppercase">Mic Level:</span>
              <div className="flex items-end gap-0.5 h-3.5 w-12 bg-black/50 rounded px-0.5 py-0.5">
                {[20, 40, 60, 80, 100].map((threshold, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-sm transition-all duration-75 ${
                      micVolumeLevel >= threshold
                        ? threshold > 70 ? 'bg-amber-400 h-full' : 'bg-[#E0FF25] h-full'
                        : 'bg-[#262626] h-1'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[9px] font-bold text-[#E0FF25] w-6 text-right">
                {micVolumeLevel}%
              </span>
            </div>

            {/* Mic Permission Status Badge */}
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
              micPermissionState === 'granted'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : micPermissionState === 'denied'
                ? 'border-red-500/40 bg-red-500/10 text-red-400 animate-pulse'
                : 'border-[#262626] bg-[#141414] text-[#a3a3a3]'
            }`}>
              <ShieldCheck className="h-3 w-3" />
              <span>Mic: {micPermissionState === 'granted' ? 'Allowed' : micPermissionState === 'denied' ? 'Blocked (Click Help)' : 'Ready'}</span>
            </span>

            {isTranscribingAudio && (
              <span className="inline-flex items-center gap-1 rounded border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-blue-300 animate-pulse">
                <Brain className="h-3 w-3" /> Gemini STT Transcribing...
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Test "Hey Sapphire" Wake Word Trigger */}
            <button
              id="btn-simulate-wakeword"
              type="button"
              onClick={handleSimulateWakeWord}
              title="Simulate speaking 'Hey Sapphire' to test wake word trigger and response"
              className="flex items-center gap-1 rounded border border-[#E0FF25]/40 bg-[#E0FF25]/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#E0FF25] hover:bg-[#E0FF25] hover:text-black transition active:scale-95 shadow-[0_0_8px_rgba(224,255,37,0.15)]"
            >
              <Sparkles className="h-3 w-3" />
              <span>Test "Hey Sapphire"</span>
            </button>

            {/* Test Spoken Command */}
            <button
              id="btn-test-voice-cmd"
              type="button"
              onClick={() => handleTestVoiceCommand("Hey Sapphire, report system health and status")}
              title="Test a voice command: 'Hey Sapphire, report system health and status'"
              className="hidden sm:flex items-center gap-1 rounded border border-[#262626] bg-[#141414] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#a3a3a3] hover:border-[#E0FF25] hover:text-[#E0FF25] transition active:scale-95"
            >
              <Mic className="h-3 w-3 text-[#E0FF25]" />
              <span>Test Command</span>
            </button>

            {/* Test TTS Voice Output */}
            <button
              id="btn-test-tts-voice"
              type="button"
              onClick={handleTestVoiceTTS}
              title="Test audio synthesis through your speakers"
              className="flex items-center gap-1 rounded border border-[#262626] bg-[#141414] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#a3a3a3] hover:border-[#E0FF25] hover:text-[#E0FF25] transition active:scale-95"
            >
              <Volume2 className="h-3 w-3 text-[#E0FF25]" />
              <span>Test Speaker</span>
            </button>

            {/* Test Microphone Input */}
            <button
              id="btn-test-mic-input"
              type="button"
              onClick={handleTestMic}
              disabled={testMicRunning}
              title="Run 3-second hardware mic check with Gemini STT engine"
              className={`flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-black uppercase transition active:scale-95 ${
                testMicRunning
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 animate-pulse'
                  : 'border-[#262626] bg-[#141414] text-[#a3a3a3] hover:border-[#E0FF25] hover:text-[#E0FF25]'
              }`}
            >
              <Activity className="h-3 w-3 text-[#E0FF25]" />
              <span>{testMicRunning ? 'Testing Mic...' : 'Test Mic'}</span>
            </button>

            {/* Toggle Diagnostics Panel */}
            <button
              id="btn-toggle-voice-diag"
              type="button"
              onClick={() => setShowVoiceDiagnostic(!showVoiceDiagnostic)}
              className="rounded border border-[#262626] bg-[#141414] p-1 text-[#737373] hover:text-white"
              title="Toggle Voice Diagnostic Info"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Test Mic Output Card */}
        {testMicOutput && (
          <div className="border-b border-[#262626] bg-[#121212] px-4 py-2 text-xs flex items-center justify-between text-white font-mono">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#E0FF25]" />
              <span>{testMicOutput}</span>
            </div>
            <button
              onClick={() => setTestMicOutput(null)}
              className="text-[#737373] hover:text-white font-bold text-[10px] uppercase ml-4"
            >
              Clear
            </button>
          </div>
        )}

        {/* Speech Diagnostic & Troubleshooting Drawer */}
        {showVoiceDiagnostic && (
          <div className="border-b border-[#262626] bg-[#0d0d0d] p-3 text-xs text-[#a3a3a3] space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] font-black uppercase text-white">
              <div className="flex items-center gap-1.5">
                <Headphones className="h-4 w-4 text-[#E0FF25]" />
                <span>Sapphire Voice & Speech Pipeline Diagnostics</span>
              </div>
              <button onClick={() => setShowVoiceDiagnostic(false)} className="text-[#737373] hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[10px]">
              <div className="p-2 rounded bg-[#141414] border border-[#262626]">
                <div className="text-[#737373] font-bold">1. WAKE WORD TRIGGER</div>
                <div className="text-white mt-1">Say <strong>"Hey Sapphire"</strong> followed by any command (e.g. <em>"Hey Sapphire, what is our status?"</em>).</div>
              </div>
              <div className="p-2 rounded bg-[#141414] border border-[#262626]">
                <div className="text-[#737373] font-bold">2. NON-STOP CONVERSATION</div>
                <div className="text-white mt-1">Click <strong>"Continuous Conversation"</strong> or say <em>"Hey Sapphire, start conversation mode"</em> to talk back-and-forth indefinitely without clicking.</div>
              </div>
              <div className="p-2 rounded bg-[#141414] border border-[#262626]">
                <div className="text-[#737373] font-bold">3. MIC PERMISSIONS</div>
                <div className="text-white mt-1">If the mic doesn't respond, click the <strong>lock icon 🔒</strong> in your browser's address bar and set Microphone to <strong>"Allow"</strong>.</div>
              </div>
            </div>
          </div>
        )}

        {/* Microphone Permission Warning if blocked */}
        {speechErrorMsg && (
          <div className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️ {speechErrorMsg}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestMic}
                className="rounded bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black hover:bg-amber-400"
              >
                Request Permission
              </button>
              <button id="btn-sapphirepage-16"
                onClick={() => setSpeechErrorMsg(null)}
                className="text-amber-400 hover:text-white font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Message Feed */}
        <div ref={chatScrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 text-sm ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                  msg.role === 'user'
                    ? 'border border-[#262626] bg-[#181818] text-white'
                    : 'border border-[#E0FF25]/50 bg-[#0c0c0c] text-[#E0FF25]'
                }`}
              >
                {msg.role === 'user' ? 'YOU' : '💎'}
              </div>

              {/* Bubble */}
              <div className="flex max-w-[85%] flex-col">
                <div
                  className={`rounded-lg px-4 py-3 leading-relaxed ${
                    msg.role === 'user'
                      ? 'border border-[#262626] bg-[#141414] text-white'
                      : 'border border-[#262626] bg-[#0c0c0c] text-[#f5f5f5]'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed sm:text-sm">
                    {msg.text || (
                      <span className="inline-flex items-center gap-1 text-[#a3a3a3]">
                        <span className="animate-pulse">●</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                      </span>
                    )}
                  </div>

                  {/* Message Tags */}
                  {msg.tags && msg.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[#1f1f1f] pt-2">
                      {msg.tags.map((tag, i) => (
                        <span
                          key={`${msg.id}_tag_${tag}_${i}`}
                          className="rounded border border-[#262626] bg-[#141414] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#a3a3a3]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <span
                  className={`mt-1 px-1 font-mono text-[10px] uppercase text-[#737373] ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {msg.role === 'user' ? 'User' : 'Sapphire'} · {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* Real-time Interim Voice Transcript indicator */}
          {interimTranscript && (
            <div className="flex gap-3 text-sm flex-row-reverse animate-pulse">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E0FF25] bg-[#E0FF25]/20 font-black text-[#E0FF25] text-xs">
                MIC
              </div>
              <div className="rounded-lg border border-[#E0FF25]/50 bg-[#141414] px-4 py-3 text-xs italic text-[#E0FF25]">
                "{interimTranscript}..."
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-[#262626] bg-[#0c0c0c] p-3 sm:p-4">
          {/* Quick Voice & OpenClaw Command Shortcuts */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
            <span className="font-mono font-bold uppercase text-[#737373] tracking-wider text-[9px] mr-1">🎙️ Spoken Commands:</span>
            {[
              { label: '🎙️ "Hey Sapphire, status"', cmd: 'Hey Sapphire, report system and engine status' },
              { label: '🎙️ "Start conversation mode"', cmd: 'Hey Sapphire, start conversation mode' },
              { label: '🎙️ "List workspace files"', cmd: 'Hey Sapphire, list my permanent workspace files' },
              { label: '🎙️ "Run health check"', cmd: 'Hey Sapphire, run a diagnostic health check on all systems' },
              { label: '⚡ openclaw status', cmd: 'openclaw status' },
              { label: '📡 ping-sapphire', cmd: 'ping-sapphire' }
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSendMessage(item.cmd)}
                className="rounded border border-[#262626] bg-[#141414] px-2 py-0.5 font-mono text-[#a3a3a3] transition hover:border-[#E0FF25]/50 hover:bg-[#1a1a1a] hover:text-[#E0FF25] active:scale-95 whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col rounded-lg border border-[#262626] bg-[#141414] p-2 transition focus-within:border-[#E0FF25]">
            <textarea
              ref={textareaRef}
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              placeholder={isContinuousMode ? "Continuous Mode active — speak aloud or type here..." : "Message Sapphire, say 'Hey Sapphire', or click the mic..."}
              className="max-h-32 min-h-[40px] w-full resize-none bg-transparent px-2 text-xs text-white placeholder-[#737373] outline-none sm:text-sm font-sans"
            />

            <div className="mt-2 flex items-center justify-between border-t border-[#1f1f1f] pt-2">
              <div className="flex items-center gap-2">
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  className="rounded-md border border-[#262626] bg-[#0c0c0c] px-2 py-1 font-mono text-[11px] font-bold text-[#a3a3a3] outline-none hover:text-white"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash ⚡ (Sapphire Neural Stream)</option>
                  <option value="neurocore-v3">NeuroCore AI Engine 🧠 (Primary)</option>
                  <option value="llama3.2:1b">Ollama Llama 3.2:1b ⚡ (Local Fallback)</option>
                  <option value="deepseek-r1">Ollama DeepSeek-R1 🧠 (Local Fallback)</option>
                  <option value="codellama">Ollama CodeLlama 💻 (Local Fallback)</option>
                  <option value="mistral">Ollama Mistral 7B 🚀 (Local Fallback)</option>
                </select>

                {/* Quick Toggle for Continuous Conversation */}
                <button id="btn-sapphirepage-17"
                  type="button"
                  onClick={toggleContinuousMode}
                  className={`hidden sm:flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition ${
                    isContinuousMode
                      ? 'border border-[#E0FF25] bg-[#E0FF25] text-black shadow-sm'
                      : 'border border-[#262626] bg-[#181818] text-[#a3a3a3] hover:border-[#E0FF25]/50 hover:text-[#E0FF25]'
                  }`}
                >
                  <Radio className={`h-3 w-3 ${isContinuousMode ? 'animate-pulse text-black' : 'text-[#E0FF25]'}`} />
                  <span>{isContinuousMode ? 'Non-Stop Mode: ON' : 'Continuous Chat'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {isSpeakingRef.current && (
                  <button id="btn-sapphirepage-18"
                    type="button"
                    onClick={handleInterrupt}
                    className="flex h-8 items-center gap-1 rounded-md bg-amber-500/20 px-2 text-[10px] font-black uppercase text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  >
                    Interrupt
                  </button>
                )}

                <button id="btn-sapphirepage-19"
                  type="button"
                  onClick={handleMicClick}
                  title={voiceLoopState === 'listening' ? 'Listening now — click to pause' : 'Click to start voice capture'}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                    voiceLoopState === 'listening'
                      ? 'bg-[#E0FF25] text-black font-black animate-pulse shadow-md shadow-[#E0FF25]/30'
                      : 'bg-[#262626] text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>

                {isStreaming ? (
                  <button id="btn-sapphirepage-20"
                    type="button"
                    onClick={handleStopStreaming}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white transition hover:bg-red-600"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                ) : (
                  <button id="btn-sapphirepage-21"
                    type="button"
                    onClick={() => handleSendMessage()}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E0FF25] text-black font-black shadow-md transition hover:bg-[#ccff00]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Saved Conversations, Persistent Files & Permanent Memories */}
      <aside className="hidden flex-col border-l border-[#262626] bg-[#0c0c0c] lg:flex">
        {/* Tabs */}
        <div className="flex border-b border-[#262626] bg-[#070707]">
          <button id="btn-sapphirepage-22"
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition ${
              activeTab === 'conversations'
                ? 'border-b-2 border-[#E0FF25] bg-[#141414] text-[#E0FF25]'
                : 'text-[#737373] hover:text-[#a3a3a3]'
            }`}
          >
            💬 Chats ({savedConversations.length})
          </button>

          <button id="btn-sapphirepage-23"
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition ${
              activeTab === 'files'
                ? 'border-b-2 border-[#E0FF25] bg-[#141414] text-[#E0FF25]'
                : 'text-[#737373] hover:text-[#a3a3a3]'
            }`}
          >
            📁 Files ({savedFiles.length})
          </button>

          <button id="btn-sapphirepage-24"
            onClick={() => setActiveTab('memories')}
            className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition ${
              activeTab === 'memories'
                ? 'border-b-2 border-[#E0FF25] bg-[#141414] text-[#E0FF25]'
                : 'text-[#737373] hover:text-[#a3a3a3]'
            }`}
          >
            🧠 Memory ({memories.length})
          </button>
        </div>

        {/* TAB 1: SAVED CONVERSATIONS */}
        {activeTab === 'conversations' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#262626] p-2 bg-[#0c0c0c]">
              <span className="font-mono text-[10px] uppercase font-bold text-[#737373]">
                Stored Transcripts
              </span>
              <button id="btn-sapphirepage-25"
                onClick={handleNewConversation}
                className="flex items-center gap-1 rounded bg-[#1f1f1f] px-2 py-1 font-mono text-[10px] font-black uppercase text-[#E0FF25] hover:bg-[#262626]"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {/* Current Active Session Card */}
              <div className="rounded-lg border border-[#E0FF25]/40 bg-[#E0FF25]/10 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase text-[#E0FF25] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E0FF25] animate-pulse"></span>
                    Current Live
                  </span>
                  <span className="font-mono text-[9px] text-[#a3a3a3]">{messages.length} msgs</span>
                </div>
                <div className="mt-1 truncate font-bold text-white">{currentConvTitle}</div>
                <div className="mt-2 flex gap-1">
                  <button id="btn-sapphirepage-26"
                    onClick={handleManualSaveConversation}
                    className="flex-1 rounded bg-black py-1 text-center font-mono text-[9px] font-black uppercase text-[#E0FF25] hover:bg-[#181818]"
                  >
                    Save Snapshot
                  </button>
                  <button id="btn-sapphirepage-27"
                    onClick={() => handleExportChat('md')}
                    className="rounded bg-black px-2 py-1 font-mono text-[9px] text-[#a3a3a3] hover:text-white"
                  >
                    Export .md
                  </button>
                </div>
              </div>

              {/* Past Stored Conversations */}
              {savedConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleLoadConversation(conv.id)}
                  className={`cursor-pointer rounded-lg border p-2.5 text-xs transition ${
                    conv.id === currentConvId
                      ? 'border-[#E0FF25]/50 bg-[#181818]'
                      : 'border-[#262626] bg-[#141414] hover:border-[#E0FF25]/30 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-bold text-white">{conv.title}</span>
                    <span className="font-mono text-[9px] text-[#737373]">{conv.messageCount || conv.messages?.length || 0} msgs</span>
                  </div>
                  <div className="mt-1 text-[10px] text-[#737373]">
                    {new Date(conv.updatedAt).toLocaleDateString()} · {conv.mode === 'hands_free_voice' ? '🎙️ Voice' : '💬 Chat'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PERSISTENT FILES */}
        {activeTab === 'files' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#262626] p-2 bg-[#0c0c0c]">
              <span className="font-mono text-[10px] uppercase font-bold text-[#737373]">
                Files & Code Artifacts
              </span>
              <button id="btn-sapphirepage-28"
                onClick={() => setIsAddFileOpen(true)}
                className="flex items-center gap-1 rounded bg-[#1f1f1f] px-2 py-1 font-mono text-[10px] font-black uppercase text-[#E0FF25] hover:bg-[#262626]"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>

            <div className="p-2 border-b border-[#262626] bg-[#070707]">
              <button id="btn-sapphirepage-29"
                onClick={handleExtractAndSaveFiles}
                disabled={isExtractingFiles}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E0FF25]/40 bg-[#E0FF25]/10 py-1.5 font-mono text-[10px] font-black uppercase text-[#E0FF25] hover:bg-[#E0FF25]/20"
              >
                <FolderDown className="h-3.5 w-3.5" /> Extract & Store Chat Code
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {savedFiles.map(file => (
                <div key={file.id} className="rounded-lg border border-[#262626] bg-[#141414] p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate font-mono font-bold text-white">
                      <FileCode className="h-3.5 w-3.5 text-[#E0FF25]" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <a
                      href={`/api/files/download/${file.id}`}
                      download={file.name}
                      className="rounded bg-[#1f1f1f] p-1 text-[#a3a3a3] hover:text-[#E0FF25]"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="mt-1 font-mono text-[9px] text-[#737373]">
                    {file.size} bytes · {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PERMANENT MEMORIES */}
        {activeTab === 'memories' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#262626] p-2 bg-[#0c0c0c]">
              <span className="font-mono text-[10px] uppercase font-bold text-[#737373]">
                Permanent Neural Knowledge
              </span>
              <span className="font-mono text-[10px] text-[#E0FF25]">{memories.length} slots</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {memories.map((mem, i) => (
                <div key={mem.id || `sapphire_mem_${i}_${mem.title || ''}`} className="rounded-lg border border-[#262626] bg-[#141414] p-2.5 text-xs">
                  <div className="font-black uppercase text-white flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E0FF25]" />
                    {mem.title}
                  </div>
                  <p className="mt-1 font-sans text-[11px] leading-relaxed text-[#a3a3a3]">{mem.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Diagnostics Footer */}
        <div className="border-t border-[#262626] p-3 space-y-1.5 bg-[#070707] font-mono text-xs">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#737373]">
            📊 System Health
          </div>
          <div className="flex justify-between text-[#a3a3a3]">
            <span>Status</span>
            <span className="font-black text-[#E0FF25]">Live 24/7 ✓</span>
          </div>
          <div className="flex justify-between text-[#a3a3a3]">
            <span>Hands-Free Loop</span>
            <span className="font-bold text-white">{isContinuousMode ? 'ACTIVE 🟢' : 'STANDBY ⚪'}</span>
          </div>
          <div className="flex justify-between text-[#a3a3a3]">
            <span>Stored Transcripts</span>
            <span className="font-bold text-white">{savedConversations.length}</span>
          </div>
          <div className="flex justify-between text-[#a3a3a3]">
            <span>Processed Tokens</span>
            <span className="font-bold text-white">{tokenCount.toLocaleString()}</span>
          </div>
        </div>
      </aside>

      {/* Manual File Creation Modal */}
      {isAddFileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-[#262626] bg-[#0c0c0c] p-5 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              💾 Save File to Persistent Storage
            </h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#a3a3a3]">File Name</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  placeholder="e.g. deploy_worker.sh, script.py, notes.md"
                  className="mt-1 w-full rounded border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#E0FF25]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#a3a3a3]">Content</label>
                <textarea
                  value={newFileContent}
                  onChange={e => setNewFileContent(e.target.value)}
                  placeholder="Paste script or content..."
                  rows={6}
                  className="mt-1 w-full rounded border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#E0FF25]"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button id="btn-sapphirepage-30"
                onClick={() => setIsAddFileOpen(false)}
                className="rounded border border-[#262626] px-3 py-1.5 font-mono text-xs uppercase text-[#a3a3a3] hover:text-white"
              >
                Cancel
              </button>
              <button id="btn-sapphirepage-31"
                onClick={handleCreateFile}
                className="rounded bg-[#E0FF25] px-4 py-1.5 font-mono text-xs font-black uppercase text-black hover:bg-[#ccff00]"
              >
                Save File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
