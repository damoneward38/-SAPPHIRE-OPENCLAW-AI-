import React, { useState, useEffect } from 'react';
import { PageType } from '../types';
import { Sparkles, Terminal, Bot, Zap, ArrowRight, Brain, Clock, Shield, Plug } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: PageType) => void;
  memoryCount?: number;
  updateCount?: number;
  totalMessages?: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  memoryCount = 6,
  updateCount = 3,
  totalMessages = 28,
}) => {
  const [uptimeSeconds, setUptimeSeconds] = useState(128);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-start gap-8 overflow-y-auto px-4 py-8 sm:px-6">
      {/* Always-on Top Banner */}
      <div className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 shadow-lg sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#E0FF25]/30 bg-[#E0FF25]/10 text-2xl text-[#E0FF25]">
            🌙
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#E0FF25] sm:text-sm">
              Always On — Never Sleeps
            </h3>
            <p className="text-xs font-medium text-[#a3a3a3] sm:text-sm">
              Sapphire runs 24/7. She remembers everything, learns from every conversation, and evolves her code.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-base font-black text-[#E0FF25] sm:text-xl">
            {formatUptime(uptimeSeconds)}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#737373]">Uptime</div>
        </div>
      </div>

      {/* Pulsing Memory Ring visual */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="animate-memory-ring flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#E0FF25]/60 bg-[#E0FF25]/10 text-4xl shadow-inner">
          🧠
        </div>
      </div>

      {/* Hero Headline */}
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl font-headline">
          <span className="text-[#E0FF25]">Sapphire</span>{' '}
          <span className="text-[#525252] font-light">+</span>{' '}
          <span className="text-white">OpenClaw</span>
        </h1>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[#a3a3a3] sm:text-sm sm:leading-relaxed">
          AI that never stops. She learns what you teach her, remembers every conversation forever, and runs terminal commands, code updates, and edge deploy pipelines.
        </p>
      </div>

      {/* Dual Cards: Sapphire & OpenClaw */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        {/* Sapphire Card */}
        <div
          onClick={() => onNavigate('sapphire')}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 transition hover:-translate-y-1 hover:border-[#E0FF25] hover:shadow-2xl hover:shadow-[#E0FF25]/10"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[#E0FF25]" />
          <div>
            <div className="mb-3 text-3xl">💎</div>
            <h2 className="text-base font-black uppercase tracking-wider text-[#E0FF25]">Sapphire</h2>
            <p className="mt-1 text-xs font-medium text-[#a3a3a3]">
              Your always-on AI assistant — voice powered, plugin driven, self-improving.
            </p>
            <div className="mt-4 flex flex-col gap-1.5 text-xs text-[#a3a3a3]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Remembers every conversation forever
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Learns from what you teach her
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Updates her own code when needed
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Voice: wake word + Kokoro TTS
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Plugins: Bitcoin, SSH, Email, HA
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#E0FF25] group-hover:underline">
            Launch Sapphire <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* OpenClaw Card */}
        <div
          onClick={() => onNavigate('claw')}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 transition hover:-translate-y-1 hover:border-[#E0FF25] hover:shadow-2xl hover:shadow-[#E0FF25]/10"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-white" />
          <div>
            <div className="mb-3 text-3xl">🦾</div>
            <h2 className="text-base font-black uppercase tracking-wider text-white">OpenClaw</h2>
            <p className="mt-1 text-xs font-medium text-[#a3a3a3]">
              Automation platform with live terminal, code editor, and full deploy pipeline.
            </p>
            <div className="mt-4 flex flex-col gap-1.5 text-xs text-[#a3a3a3]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Live terminal — run any command
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Code editor — edit & push live
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Vercel deploy + Cloudflare workers
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Neon database management
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0FF25]">▸</span> Sapphire bridge — always connected
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white group-hover:text-[#E0FF25] group-hover:underline">
            Launch OpenClaw <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* 5 Stats Row */}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#0c0c0c] p-3 text-center transition hover:border-[#E0FF25]/40">
          <div className="font-mono text-xl font-black text-[#E0FF25]">{memoryCount}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">Memories</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#0c0c0c] p-3 text-center transition hover:border-[#E0FF25]/40">
          <div className="font-mono text-xl font-black text-[#E0FF25]">24/7</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">Always On</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#0c0c0c] p-3 text-center transition hover:border-[#E0FF25]/40">
          <div className="font-mono text-xl font-black text-white">8</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">Plugins</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#0c0c0c] p-3 text-center transition hover:border-[#E0FF25]/40">
          <div className="font-mono text-xl font-black text-[#E0FF25]">{updateCount}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">Code Updates</div>
        </div>
        <div className="col-span-2 flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#0c0c0c] p-3 text-center sm:col-span-1 transition hover:border-[#E0FF25]/40">
          <div className="font-mono text-xl font-black text-[#E0FF25]">{totalMessages}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">Messages</div>
        </div>
      </div>

      {/* Bottom CTA Action Bar */}
      <div className="flex flex-wrap justify-center gap-3 pb-8">
        <button id="btn-homepage-1"
          onClick={() => onNavigate('features')}
          className="flex items-center gap-2 rounded-lg border border-[#E0FF25] bg-transparent px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-[#E0FF25] transition hover:bg-[#E0FF25] hover:text-black"
        >
          <Sparkles className="h-4 w-4" />
          See All Features
        </button>
        <button id="btn-homepage-2"
          onClick={() => onNavigate('pricing')}
          className="flex items-center gap-2 rounded-lg bg-[#E0FF25] px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-black shadow-lg transition hover:bg-[#ccff00]"
        >
          View Pricing
        </button>
        <button id="btn-homepage-3"
          onClick={() => onNavigate('sapphire')}
          className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#141414] px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
        >
          <Bot className="h-4 w-4 text-[#E0FF25]" />
          Open Sapphire
        </button>
        <button id="btn-homepage-4"
          onClick={() => onNavigate('claw')}
          className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#141414] px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
        >
          <Terminal className="h-4 w-4 text-[#E0FF25]" />
          Open OpenClaw
        </button>
      </div>
    </div>
  );
};
