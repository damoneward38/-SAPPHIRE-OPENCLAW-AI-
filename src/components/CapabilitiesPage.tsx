import React, { useState } from 'react';
import { PageType } from '../types';
import { ChevronRight, Zap, Bot } from 'lucide-react';

interface CapabilitiesPageProps {
  onNavigate: (page: PageType) => void;
  onSendCapabilityToSapphire: (prompt: string) => void;
}

interface CapabilityItem {
  id: string;
  emoji: string;
  title: string;
  color: string;
  glow: string;
  items: string[];
}

const CAPS_DATA: CapabilityItem[] = [
  {
    id: 'research',
    emoji: '🔍',
    title: 'Research & Information',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.3)',
    items: [
      'Search the web for real-time information & citations',
      'Read and extract from technical articles and PDFs',
      'Cross-validate facts across multiple databases',
      'Find datasets and academic benchmarks',
      'Compile comprehensive executive reports'
    ]
  },
  {
    id: 'writing',
    emoji: '✍️',
    title: 'Writing & Documents',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.3)',
    items: [
      'Write multi-chapter technical documentation',
      'Architecture design specifications & RFCs',
      'Research papers, executive briefs, release notes',
      'Output in clean Markdown, PDF, or HTML formats'
    ]
  },
  {
    id: 'data',
    emoji: '📊',
    title: 'Data Analysis & Visualization',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.3)',
    items: [
      'Process CSV, Excel, and JSON streaming datasets',
      'Run statistical modeling and anomaly detection',
      'Build charts with D3, Recharts, Plotly',
      'Deliver automated telemetry dashboards'
    ]
  },
  {
    id: 'code',
    emoji: '💻',
    title: 'Code & Software Development',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.3)',
    items: [
      'Write, debug, refactor, and test production code',
      'TypeScript, Python, JavaScript, Bash, SQL',
      'Build full-stack web applications and microservices',
      'Autonomous self-updating codebase engine'
    ]
  },
  {
    id: 'webapp',
    emoji: '🌐',
    title: 'Web Application Building',
    color: '#f472b6',
    glow: 'rgba(244,114,182,0.3)',
    items: [
      'React 19, Tailwind CSS, Express, Vite',
      'Edge API routing and database persistence',
      'Real-time streaming WebSockets and SSE',
      'One-click Vercel & Cloudflare Workers deploy'
    ]
  },
  {
    id: 'image',
    emoji: '🎨',
    title: 'Image Generation & Vision',
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.3)',
    items: [
      'Generate images from text descriptions',
      'Visual asset generation and UI mockup creation',
      'Multimodal image inspection and OCR transcription'
    ]
  },
  {
    id: 'video',
    emoji: '🎬',
    title: 'Audio & Voice Engine',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.3)',
    items: [
      'Natural Kokoro TTS voice generation',
      'Real-time Web Speech & Faster Whisper STT',
      'Wake-word detection ("Hey Sapphire")'
    ]
  },
  {
    id: 'slides',
    emoji: '📽️',
    title: 'Presentations & Decks',
    color: '#818cf8',
    glow: 'rgba(129,140,248,0.3)',
    items: [
      'Build slide decks and design system overviews',
      'Visual pitch decks for technical architectures',
      'Exportable HTML and interactive slides'
    ]
  },
  {
    id: 'browser',
    emoji: '🤖',
    title: 'Automation & CLI Execution',
    color: '#2dd4bf',
    glow: 'rgba(45,212,191,0.3)',
    items: [
      'Execute commands inside OpenClaw workspace',
      'Perform multi-step scripts and deploy workflows',
      'Automated health checks and dependency management'
    ]
  },
  {
    id: 'scheduled',
    emoji: '⏰',
    title: 'Scheduled & Autonomous Tasks',
    color: '#e879f9',
    glow: 'rgba(232,121,249,0.3)',
    items: [
      '24/7 background scheduler that never sleeps',
      'Daily Bitcoin price threshold monitoring',
      'Automated Home Assistant triggers'
    ]
  },
  {
    id: 'parallel',
    emoji: '⚡',
    title: 'Multi-Agent Collab Hub',
    color: '#00ff88',
    glow: 'rgba(0,255,136,0.3)',
    items: [
      'AI Brain (Lead & Plan) + Sapphire (Build) + OpenClaw (Execute)',
      'Simultaneous multi-step task execution',
      'Real-time pipeline message bus'
    ]
  }
];

export const CapabilitiesPage: React.FC<CapabilitiesPageProps> = ({
  onNavigate,
  onSendCapabilityToSapphire,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>('parallel');

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Banner */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-[#0d0d1f] to-[#0a0a18] p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-lg font-bold tracking-wider text-purple-200 sm:text-xl">
              CORE CAPABILITIES
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#8892a4]">
            Click any capability to inspect its functionality or dispatch a task directly to Sapphire.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {CAPS_DATA.map(cap => {
            const isOpen = expandedId === cap.id;
            return (
              <div
                key={cap.id}
                onClick={() => setExpandedId(isOpen ? null : cap.id)}
                className="cursor-pointer rounded-2xl border-2 bg-[#0a0a18] p-4 transition-all"
                style={{
                  borderColor: isOpen ? cap.color : '#1e1e3a',
                  boxShadow: isOpen ? `0 0 24px ${cap.glow}` : 'none'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cap.emoji}</span>
                    <span className="text-xs font-bold sm:text-sm" style={{ color: cap.color }}>
                      {cap.title}
                    </span>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 text-[#5a6272] transition-transform"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
                    {cap.items.map((item, idx) => (
                      <div key={`${cap.id}_item_${idx}`} className="flex items-start gap-2 text-xs text-[#8892a4]">
                        <span className="font-bold" style={{ color: cap.color }}>✓</span>
                        <span>{item}</span>
                      </div>
                    ))}

                    <div className="pt-3">
                      <button id="btn-capabilitiespage-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendCapabilityToSapphire(`Execute ${cap.title}: ${cap.items[0]}`);
                          onNavigate('sapphire');
                        }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-black transition"
                        style={{ backgroundColor: cap.color }}
                      >
                        <Bot className="h-3.5 w-3.5" /> Run in Sapphire
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 text-xs text-[#5a6272] pt-4">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>11 Core capabilities active · All autonomous subsystems online</span>
        </div>
      </div>
    </div>
  );
};
