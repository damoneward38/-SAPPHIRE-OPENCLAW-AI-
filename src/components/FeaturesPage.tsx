import React, { useState } from 'react';
import { PageType } from '../types';
import { ChevronDown, Bot, Terminal, Shield, ArrowRight } from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (page: PageType) => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'sap-1': true,
    'claw-1': true,
    'plat-1': true,
  });

  const toggleAccordion = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      {/* Hero Header */}
      <div className="border-b border-[#262626] bg-[#0c0c0c] px-6 py-12 text-center">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#E0FF25]">
          Complete Feature Breakdown
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl font-headline">
          <span className="text-[#E0FF25]">Sapphire</span>{' '}
          <span className="text-[#525252]">+</span>{' '}
          <span className="text-white">OpenClaw</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-xs font-medium uppercase tracking-wide text-[#a3a3a3] sm:text-sm">
          Everything this platform does — memory, voice, live terminal, code editor, deploy pipeline, and multi-agent coordination.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button id="btn-featurespage-1"
            onClick={() => onNavigate('sapphire')}
            className="rounded-lg bg-[#E0FF25] px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-black shadow-lg transition hover:bg-[#ccff00]"
          >
            Open Sapphire App
          </button>
          <button id="btn-featurespage-2"
            onClick={() => onNavigate('claw')}
            className="rounded-lg border border-[#262626] bg-[#141414] px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-lg transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
          >
            Open OpenClaw App
          </button>
          <button id="btn-featurespage-3"
            onClick={() => onNavigate('pricing')}
            className="rounded-lg border border-[#262626] bg-[#0e0e0e] px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition hover:border-[#E0FF25]"
          >
            See Pricing
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
        {/* 1. SAPPHIRE FEATURES */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E0FF25]/40 bg-[#E0FF25]/10 text-xl text-[#E0FF25]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-[#E0FF25]">Sapphire — Always-On AI Assistant</h2>
              <p className="text-xs font-medium text-[#a3a3a3]">Voice-powered, memory-driven, self-improving AI that never sleeps</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {/* Feature 1 */}
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-4"
                onClick={() => toggleAccordion('sap-1')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">🧠 Permanent Memory System</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['sap-1'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['sap-1'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Sapphire remembers every conversation you've ever had — forever. Long-term memories are stored in the database and injected into every prompt so she always knows your context.
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-[#a3a3a3]">
                    <li>Long-term memory stored in database (persists across sessions)</li>
                    <li>Auto-extracts facts from every conversation</li>
                    <li>User preference learning (tone, style, shortcuts)</li>
                    <li>Retention: 30 days / 90 days / 1 year / forever</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-5"
                onClick={() => toggleAccordion('sap-2')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">🎙️ Voice Interface (STT + TTS)</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['sap-2'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['sap-2'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Full hands-free voice control. Say "Hey Sapphire" and she activates instantly, transcribes your speech, and streams replies using Kokoro TTS voices.
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-[#a3a3a3]">
                    <li>Wake word detection ("Hey Sapphire")</li>
                    <li>STT: Faster Whisper (local) or Web Speech API</li>
                    <li>TTS: Kokoro voices — af_sarah, af_bella, am_adam</li>
                    <li>Waveform audio animation while listening</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-6"
                onClick={() => toggleAccordion('sap-3')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">⚡ Self-Improving Code Engine</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['sap-3'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['sap-3'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Sapphire can update her own code. When she identifies a way to improve her behavior, she proposes a diff, creates a backup snapshot, and applies it safely.
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-[#a3a3a3]">
                    <li>AI-proposed code updates with diff preview</li>
                    <li>Require-approval mode before applying</li>
                    <li>Automatic backup snapshots before every change</li>
                    <li>Full update history log on Memory page</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-7"
                onClick={() => toggleAccordion('sap-4')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">🔌 Dynamic Plugin System</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['sap-4'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['sap-4'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Extend Sapphire with 8 modular built-in plugins or install custom plugins from github / npm.
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-[#a3a3a3]">
                    <li>₿ Bitcoin — wallet balance, price alerts, mainnet/testnet</li>
                    <li>✉️ Email — send and read emails via AI commands</li>
                    <li>🏠 Home Assistant — smart lights, climate, automation scenes</li>
                    <li>💾 Save Files — code snippets and project drafts</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. OPENCLAW FEATURES */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E0FF25]/40 bg-[#E0FF25]/10 text-xl text-[#E0FF25]">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">OpenClaw — Automation & Dev Platform</h2>
              <p className="text-xs font-medium text-[#a3a3a3]">Live terminal, code editor, deploy pipeline, and Sapphire bridge</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-8"
                onClick={() => toggleAccordion('claw-1')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">⚡ Live Terminal Execution</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['claw-1'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['claw-1'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Interactive development terminal running in the OpenClaw workspace. Run bash commands, inspect outputs, and check exit codes.
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-[#a3a3a3]">
                    <li>Real-time command execution and stdout/stderr</li>
                    <li>Execution time tracking in milliseconds</li>
                    <li>Command history with Up/Down arrow navigation</li>
                    <li>Quick shortcuts: ls, pwd, git status, ping-sapphire</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-9"
                onClick={() => toggleAccordion('claw-2')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">📝 Server Code Editor</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['claw-2'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['claw-2'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Full file browser connected to the server filesystem. Create new files, save drafts, and push live with one click.
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-[#a3a3a3]">
                    <li>Live file tree with Python, JS, TS, Shell support</li>
                    <li>Cloud save and push-to-run pipeline</li>
                    <li>Save to snippet library for quick reuse</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-10"
                onClick={() => toggleAccordion('claw-3')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">🚀 Deploy Pipeline</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['claw-3'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['claw-3'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Deploy your code directly to Vercel edge networks or Cloudflare Workers with real-time feedback.
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-[#a3a3a3]">
                    <li>Vercel Token & Project ID integration</li>
                    <li>Cloudflare Workers Wrangler support</li>
                    <li>Deploy status & live URL verification</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-11"
                onClick={() => toggleAccordion('claw-4')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">💎 Sapphire Bridge Bus</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['claw-4'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['claw-4'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Direct zero-latency communication channel between OpenClaw dev environment and Sapphire AI assistant.
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-[#a3a3a3]">
                    <li>Live query response inline inside dashboard</li>
                    <li>Shares the same database-backed long-term memory</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. PLATFORM & SECURITY */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E0FF25]/40 bg-[#E0FF25]/10 text-xl text-[#E0FF25]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-[#E0FF25]">Platform & Infrastructure</h2>
              <p className="text-xs font-medium text-[#a3a3a3]">Auth, database, payments, and multi-agent coordination</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-12"
                onClick={() => toggleAccordion('plat-1')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">🔑 Authentication & Roles</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['plat-1'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['plat-1'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Session persistence, role-based administration (Admin vs User), and tier-based limits.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] overflow-hidden transition hover:border-[#E0FF25]/40">
              <button id="btn-featurespage-13"
                onClick={() => toggleAccordion('plat-2')}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#141414]"
              >
                <span className="flex items-center gap-2">💳 Payments & Subscriptions</span>
                <ChevronDown className={`h-4 w-4 text-[#737373] transition-transform ${openSections['plat-2'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['plat-2'] && (
                <div className="border-t border-[#262626] px-4 pb-4 pt-3 text-xs leading-relaxed text-[#a3a3a3]">
                  <p>
                    Integrated Stripe Checkout for subscriptions (Pro $12/mo, Enterprise $49/mo) plus PayPal one-time lifetime access ($29).
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Card */}
        <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-8 text-center">
          <h3 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl font-headline">Ready to deploy with Sapphire + OpenClaw?</h3>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[#a3a3a3] sm:text-sm">
            Experience an AI copilot with permanent memory, live terminal execution, and autonomous updates.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button id="btn-featurespage-14"
              onClick={() => onNavigate('pricing')}
              className="rounded-lg bg-[#E0FF25] px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-black shadow-lg transition hover:bg-[#ccff00]"
            >
              View Pricing & Plans
            </button>
            <button id="btn-featurespage-15"
              onClick={() => onNavigate('sapphire')}
              className="rounded-lg border border-[#262626] bg-[#141414] px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
            >
              Try Sapphire Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
