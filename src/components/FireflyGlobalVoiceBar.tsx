import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Laptop, 
  ChevronUp, 
  ChevronDown, 
  Volume2, 
  CheckCircle2, 
  Zap, 
  Terminal, 
  Compass,
  X
} from 'lucide-react';
import { PageType, FireflyBridgeStatus, FireflyComputerCommand } from '../types';
import { routeSpokenSpeech, DEFAULT_WAKE_CONFIG } from '../services/voiceRouter';
import { chime } from '../utils/audioChimes';

interface FireflyGlobalVoiceBarProps {
  currentPage: PageType;
  onNavigatePage: (page: PageType) => void;
  bridgeStatus: FireflyBridgeStatus;
  onExecuteComputerCommand: (command: string, bypass?: boolean) => Promise<any>;
  pendingVoiceCommand: FireflyComputerCommand | null;
  onSayOkay: () => Promise<boolean>;
  showToast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
}

export const FireflyGlobalVoiceBar: React.FC<FireflyGlobalVoiceBarProps> = ({
  currentPage,
  onNavigatePage,
  bridgeStatus,
  onExecuteComputerCommand,
  pendingVoiceCommand,
  onSayOkay,
  showToast
}) => {
  const [isListening, setIsListening] = useState<boolean>(true);
  const [isContinuous, setIsContinuous] = useState<boolean>(true);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastActionMessage, setLastActionMessage] = useState<string>('Firefly voice engine active across all pages');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const lastSpokenTextRef = useRef<string>('');
  const isContinuousRef = useRef<boolean>(isContinuous);
  const isListeningRef = useRef<boolean>(isListening);

  useEffect(() => {
    isContinuousRef.current = isContinuous;
  }, [isContinuous]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Voice feedback synthesizer (speaks aloud)
  const speakVoiceReply = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    lastSpokenTextRef.current = text.toLowerCase();
    isSpeakingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    // Pick female or pleasant voice if available
    const voices = window.speechSynthesis.getVoices();
    const fireflyVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Victoria') || 
      v.name.includes('Google UK English Female') ||
      v.name.includes('Karen') ||
      (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (fireflyVoice) utterance.voice = fireflyVoice;

    utterance.onend = () => {
      setTimeout(() => {
        isSpeakingRef.current = false;
      }, 500);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Autonomous UI Element Clicker
  const performAutonomousClick = useCallback((target: string) => {
    const cleanTarget = target.trim().toLowerCase();
    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"]'));

    let matchedElement: HTMLElement | null = null;

    // 1. Try exact text match
    for (const el of buttons) {
      const text = (el.textContent || '').trim().toLowerCase();
      if (text === cleanTarget) {
        matchedElement = el as HTMLElement;
        break;
      }
    }

    // 2. Try partial match
    if (!matchedElement) {
      for (const el of buttons) {
        const text = (el.textContent || '').trim().toLowerCase();
        if (text.includes(cleanTarget) || cleanTarget.includes(text)) {
          matchedElement = el as HTMLElement;
          break;
        }
      }
    }

    // 3. Try ID or aria-label match
    if (!matchedElement) {
      const byId = document.getElementById(cleanTarget) || 
        document.querySelector(`[aria-label*="${cleanTarget}" i]`) ||
        document.querySelector(`[title*="${cleanTarget}" i]`);
      if (byId) matchedElement = byId as HTMLElement;
    }

    if (matchedElement) {
      chime.playWakeChime();
      matchedElement.classList.add('ring-2', 'ring-[#E0FF25]', 'transition-all');
      setTimeout(() => {
        matchedElement?.classList.remove('ring-2', 'ring-[#E0FF25]');
        matchedElement?.click();
      }, 300);

      const msg = `Clicked "${target}"`;
      setLastActionMessage(msg);
      showToast(msg, 'success');
      speakVoiceReply(`Clicking ${target}`);
      return true;
    } else {
      const msg = `Could not find button or element named "${target}" to click`;
      setLastActionMessage(msg);
      showToast(msg, 'warn');
      speakVoiceReply(`I couldn't find ${target} to click`);
      return false;
    }
  }, [showToast, speakVoiceReply]);

  // Main Spoken Phrase Handler
  const handleTranscript = useCallback(async (phrase: string) => {
    if (!phrase.trim()) return;

    // Filter acoustic echo of Firefly's own speech
    if (isSpeakingRef.current) return;
    const cleanPhrase = phrase.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    if (lastSpokenTextRef.current && cleanPhrase && lastSpokenTextRef.current.includes(cleanPhrase)) {
      return;
    }

    setInterimTranscript(phrase);

    const route = routeSpokenSpeech(phrase, isContinuousRef.current, DEFAULT_WAKE_CONFIG);

    // 1. "Say Okay" / Approval Confirmation
    if (route.intent === 'say_okay_approval') {
      chime.playWakeChime();
      const approved = await onSayOkay();
      if (approved) {
        setLastActionMessage('Authorized with "Okay"! Running command...');
        showToast('Authorized: Running command on your computer', 'success');
        speakVoiceReply('Okay, executing now.');
      } else {
        setLastActionMessage('Received "Okay" - all systems standing by');
      }
      return;
    }

    // 2. Page Turn Navigation
    if (route.intent === 'page_turn' && route.targetPage) {
      chime.playWakeChime();
      const pageNames: Record<PageType, string> = {
        home: 'Home',
        sapphire: 'Sapphire AI',
        openclaw: 'OpenClaw Terminal',
        claw: 'OpenClaw Terminal',
        memory: 'Permanent Memory',
        capabilities: 'Capabilities & Plugins',
        pricing: 'Pricing Plans',
        features: 'Features Showcase',
        admin: 'Admin Console',
        settings: 'Settings',
        computer: 'Local Computer Bridge'
      };

      const readableName = pageNames[route.targetPage] || route.targetPage;
      onNavigatePage(route.targetPage);
      const msg = `Turned to ${readableName}`;
      setLastActionMessage(msg);
      showToast(msg, 'info');
      speakVoiceReply(`Turning to ${readableName}`);
      return;
    }

    // 3. Autonomous UI Click
    if (route.intent === 'ui_click' && route.clickTarget) {
      performAutonomousClick(route.clickTarget);
      return;
    }

    // 4. Local Computer Command
    if (route.intent === 'computer_exec' && route.computerCommand) {
      chime.playWakeChime();
      setLastActionMessage(`Executing on computer: ${route.computerCommand}`);
      speakVoiceReply(`Running ${route.computerCommand}. Say okay to authorize.`);
      await onExecuteComputerCommand(route.computerCommand);
      return;
    }

    // 4B. Email Assistant Intent
    if (route.intent === 'write_email') {
      chime.playWakeChime();
      onNavigatePage('computer');
      const to = route.emailTarget?.to || 'Damone';
      const subject = route.emailTarget?.subject || 'Update';
      const msg = `Firefly drafting email to ${to}...`;
      setLastActionMessage(msg);
      showToast(msg, 'info');
      speakVoiceReply(`Drafting email to ${to}. Opening Assistant Suite.`);
      return;
    }

    // 4C. Documentation Assistant Intent
    if (route.intent === 'create_doc') {
      chime.playWakeChime();
      onNavigatePage('computer');
      const topic = route.docTarget?.topic || 'Technical System';
      const msg = `Firefly authoring documentation for ${topic}...`;
      setLastActionMessage(msg);
      showToast(msg, 'info');
      speakVoiceReply(`Generating documentation for ${topic}.`);
      return;
    }

    // 4D. Google Docs Intent
    if (route.intent === 'google_docs') {
      chime.playWakeChime();
      if (route.gdocsAction === 'new') {
        const cmd = process.platform === 'win32' ? 'start https://docs.google.com/document/create' : 'open "https://docs.google.com/document/create"';
        if (bridgeStatus.connected) {
          await onExecuteComputerCommand(cmd, true);
          speakVoiceReply('Opening a new Google Doc in your computer browser.');
        } else {
          window.open('https://docs.google.com/document/create', '_blank');
          speakVoiceReply('Opening a new Google Doc in a new tab.');
        }
      } else {
        onNavigatePage('computer');
        speakVoiceReply('Opening Google Docs Hub.');
      }
      return;
    }

    // 5. Wake Word Ping (e.g. "Hey Firefly")
    if (route.intent === 'wake_ping') {
      chime.playWakeChime();
      setLastActionMessage('Firefly listening: "How can I help you, Damone?"');
      speakVoiceReply("I'm listening, Damone. I'm ready to talk, turn pages, write emails, or run commands.");
      return;
    }

    // 6. Conversational query (Ready to talk at all times - loop-shielded)
    if (route.intent === 'query' && route.cleanQuery) {
      chime.playWakeChime();
      setLastActionMessage(`Firefly processing: "${route.cleanQuery}"`);
      try {
        const res = await fetch('/api/sapphire/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: route.cleanQuery,
            history: [],
            model: 'gemini-3.8-flash'
          })
        });

        if (res.ok) {
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let fullReply = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.token) fullReply += data.token;
                  } catch (_) {}
                }
              }
            }
          }

          if (fullReply) {
            const shortVoiceSummary = fullReply.replace(/```[\s\S]*?```/g, '').split(/[.!?]\s+/)[0] || fullReply.slice(0, 140);
            setLastActionMessage(shortVoiceSummary);
            speakVoiceReply(shortVoiceSummary);
          }
        }
      } catch (err) {
        speakVoiceReply("I'm here and ready, Damone. What should we tackle next?");
      }
      return;
    }

    // 6. Stop Voice Listening
    if (route.intent === 'continuous_stop') {
      setIsContinuous(false);
      chime.playWakeChime();
      setLastActionMessage('Continuous listening paused. Say "Hey Firefly" to wake.');
      speakVoiceReply('Continuous mode paused.');
      return;
    }

    // 7. Start Voice Listening
    if (route.intent === 'continuous_start') {
      setIsContinuous(true);
      chime.playWakeChime();
      setLastActionMessage('Continuous listening active across all pages.');
      speakVoiceReply('Continuous hands-free mode enabled.');
      return;
    }

  }, [onSayOkay, onNavigatePage, performAutonomousClick, onExecuteComputerCommand, showToast, speakVoiceReply]);

  // SpeechRecognition Lifecycle (runs persistently across all pages)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isComponentMounted = true;

    const startRecognition = () => {
      if (!isComponentMounted || !isListeningRef.current) return;

      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (_) {}
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (e: any) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              handleTranscript(transcript.trim());
            } else {
              interim += transcript;
            }
          }
          if (interim) {
            setInterimTranscript(interim);
            setAudioLevel(Math.min(100, Math.floor(interim.length * 8)));
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'not-allowed') {
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          setAudioLevel(0);
          if (isComponentMounted && isListeningRef.current) {
            // Reconnect smoothly for persistent 24/7 cross-page listening
            setTimeout(() => {
              startRecognition();
            }, 300);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    };

    startRecognition();

    return () => {
      isComponentMounted = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, [handleTranscript]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      setLastActionMessage('Microphone muted');
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      setLastActionMessage('Firefly listening across all pages');
    }
  };

  return (
    <aside aria-label="Firefly Autonomous Voice Bar" className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* EXPANDED ASSISTANT TRAY */}
      {isExpanded && (
        <div className="mb-2 w-80 sm:w-96 rounded-2xl border border-[#262626] bg-[#0c0c0c]/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#E0FF25] text-black">
                <Sparkles className="h-3 w-3 stroke-[3]" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Firefly Autonomous Voice Control
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded p-1 text-[#737373] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Real-Time Transcript Display */}
          <div className="my-3 rounded-lg border border-[#1f1f1f] bg-black/60 p-2.5 font-mono text-xs">
            <div className="flex items-center justify-between text-[10px] text-[#737373]">
              <span>LIVE TRANSCRIPT</span>
              <span className="text-[#E0FF25] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E0FF25] animate-ping" />
                Active Page: {currentPage}
              </span>
            </div>
            <p className="mt-1 min-h-[28px] text-[#a3a3a3]">
              {interimTranscript ? `"${interimTranscript}"` : 'Listening for "Hey Firefly", "Turn to OpenClaw", or "Say Okay"...'}
            </p>
          </div>

          {/* Quick Page Turn Chips */}
          <div className="mb-3">
            <span className="text-[10px] font-bold uppercase text-[#737373]">Voice Page Turns</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[
                { label: 'OpenClaw', page: 'openclaw' as PageType },
                { label: 'Computer Bridge', page: 'computer' as PageType },
                { label: 'Memory', page: 'memory' as PageType },
                { label: 'Home', page: 'home' as PageType },
                { label: 'Settings', page: 'settings' as PageType }
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    onNavigatePage(item.page);
                    speakVoiceReply(`Turning to ${item.label}`);
                  }}
                  className={`rounded-md border px-2 py-1 text-[10px] font-bold transition ${
                    currentPage === item.page
                      ? 'border-[#E0FF25] bg-[#E0FF25]/10 text-[#E0FF25]'
                      : 'border-[#262626] bg-[#141414] text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  Turn to {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Computer Bridge Status Strip */}
          <div className="flex items-center justify-between rounded-lg border border-[#1f1f1f] bg-[#121212] px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <Laptop className="h-3.5 w-3.5 text-[#E0FF25]" />
              <span className="text-[11px] font-bold text-white">Local Computer Bridge:</span>
            </div>
            <button
              onClick={() => onNavigatePage('computer')}
              className={`text-[10px] font-black uppercase tracking-wider rounded px-2 py-0.5 ${
                bridgeStatus.connected 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              }`}
            >
              {bridgeStatus.connected ? '● Connected' : '○ Open Setup'}
            </button>
          </div>
        </div>
      )}

      {/* DOCKED FLOATING VOICE PILL */}
      <div className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#0c0c0c]/90 p-1.5 pl-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all hover:border-[#E0FF25]/60">
        {/* Firefly Animated Pulse Indicator */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex cursor-pointer items-center gap-2 pr-1"
        >
          <div className="relative flex h-4 w-4 items-center justify-center">
            {isListening && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E0FF25] opacity-60" />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isListening ? 'bg-[#E0FF25]' : 'bg-[#737373]'}`} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Firefly
              </span>
              <span className="text-[9px] font-bold uppercase rounded bg-[#1f1f1f] px-1 text-[#E0FF25]">
                {isListening ? 'Mic Live' : 'Muted'}
              </span>
            </div>
            <span className="text-[10px] text-[#737373] truncate max-w-[140px]">
              {interimTranscript || lastActionMessage}
            </span>
          </div>
        </div>

        {/* Turn to Computer Button */}
        <button
          onClick={() => onNavigatePage('computer')}
          title="Open Firefly Local Computer Bridge"
          className="flex items-center gap-1 rounded-full border border-[#262626] bg-[#181818] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#a3a3a3] hover:text-[#E0FF25] transition"
        >
          <Laptop className="h-3 w-3" />
          <span className="hidden sm:inline">Computer</span>
        </button>

        {/* Say Okay Button if pending */}
        {pendingVoiceCommand && (
          <button
            onClick={onSayOkay}
            className="flex items-center gap-1 rounded-full bg-[#E0FF25] px-2.5 py-1 text-[10px] font-black uppercase text-black animate-pulse hover:bg-white transition"
          >
            <CheckCircle2 className="h-3 w-3" />
            Say Okay
          </button>
        )}

        {/* Mic Toggle Button */}
        <button
          onClick={toggleListening}
          title={isListening ? 'Mute Firefly Microphone' : 'Enable Firefly Microphone'}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            isListening 
              ? 'bg-[#E0FF25] text-black hover:bg-white' 
              : 'bg-[#1f1f1f] text-[#737373] hover:text-white'
          }`}
        >
          {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>

        {/* Expand / Collapse Tray Arrow */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#737373] hover:text-white"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};
