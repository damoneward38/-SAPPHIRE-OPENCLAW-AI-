import React from 'react';
import { PageType, AppUser } from '../types';
import { 
  Sparkles, 
  Bot, 
  Terminal, 
  Brain, 
  Settings, 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  Home, 
  FolderDown, 
  Mic, 
  User, 
  LogOut,
  Laptop
} from 'lucide-react';

interface NavbarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  memoryCount: number;
  wakeWordActive: boolean;
  onToggleWakeWord: () => void;
  currentUser: AppUser | null;
  onOpenSaveModal: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenGovernance?: () => void;
  pendingApprovalsCount?: number;
  killSwitchActive?: boolean;
  bridgeConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  memoryCount,
  wakeWordActive,
  onToggleWakeWord,
  currentUser,
  onOpenSaveModal,
  onSignIn,
  onSignOut,
  onOpenGovernance,
  pendingApprovalsCount = 0,
  killSwitchActive = false,
  bridgeConnected = false,
}) => {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[#262626] bg-[#050505]/95 px-4 backdrop-blur-md">
      {/* Brand Logo */}
      <div 
        onClick={() => onNavigate('home')} 
        className="flex cursor-pointer items-center gap-1.5 text-xs font-black uppercase tracking-widest transition hover:opacity-90 sm:text-sm"
      >
        <span className="text-[#E0FF25]">💎 Sapphire</span>
        <span className="text-[#525252]">/</span>
        <span className="text-white">🦾 OpenClaw</span>
      </div>

      {/* Nav Tabs */}
      <nav className="hidden items-center gap-1 md:flex">
        <button id="btn-navbar-1"
          onClick={() => onNavigate('home')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'home'
              ? 'bg-[#181818] text-[#E0FF25] shadow-sm'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </button>

        <button id="btn-navbar-2"
          onClick={() => onNavigate('features')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'features'
              ? 'bg-[#181818] text-[#E0FF25]'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#E0FF25]" />
          Features
        </button>

        <button id="btn-navbar-3"
          onClick={() => onNavigate('pricing')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'pricing'
              ? 'bg-[#181818] text-[#E0FF25]'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5 text-[#E0FF25]" />
          Pricing
        </button>

        <button id="btn-navbar-4"
          onClick={() => onNavigate('sapphire')}
          className={`flex items-center gap-1.5 rounded-md border-b-2 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'sapphire'
              ? 'border-[#E0FF25] bg-[#181818] text-[#E0FF25]'
              : 'border-transparent text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-[#E0FF25]" />
          Sapphire
        </button>

        <button id="btn-navbar-5"
          onClick={() => onNavigate('memory')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'memory'
              ? 'bg-[#181818] text-[#E0FF25]'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <Brain className="h-3.5 w-3.5 text-[#E0FF25]" />
          Memory
        </button>

        <button id="btn-navbar-6"
          onClick={() => onNavigate('claw')}
          className={`flex items-center gap-1.5 rounded-md border-b-2 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'claw' || currentPage === 'openclaw'
              ? 'border-[#E0FF25] bg-[#181818] text-[#E0FF25]'
              : 'border-transparent text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <Terminal className="h-3.5 w-3.5 text-[#E0FF25]" />
          OpenClaw
        </button>

        <button id="btn-navbar-7"
          onClick={() => onNavigate('capabilities')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'capabilities'
              ? 'bg-[#181818] text-[#E0FF25]'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-[#E0FF25]" />
          Capabilities
        </button>

        <button id="btn-navbar-8"
          onClick={() => onNavigate('computer')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'computer'
              ? 'bg-[#181818] text-[#E0FF25] border border-[#E0FF25]/40'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <Laptop className={`h-3.5 w-3.5 ${bridgeConnected ? 'text-emerald-400' : 'text-[#E0FF25]'}`} />
          Computer
          {bridgeConnected ? (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        <button id="btn-navbar-9"
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
            currentPage === 'settings'
              ? 'bg-[#181818] text-[#E0FF25]'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </button>

        {currentUser?.role === 'admin' && (
          <button id="btn-navbar-10"
            onClick={() => onNavigate('admin')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition ${
              currentPage === 'admin'
                ? 'bg-[#181818] text-[#E0FF25]'
                : 'text-[#E0FF25]/80 hover:bg-[#141414] hover:text-[#E0FF25]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </button>
        )}
      </nav>

      {/* Right Badges & Controls */}
      <div className="flex items-center gap-2">
        {/* 24/7 Live Status */}
        <div className="flex items-center gap-1.5 rounded-md border border-[#262626] bg-[#0e0e0e] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E0FF25] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E0FF25]"></span>
          </span>
          <span className="hidden sm:inline">Live 24/7</span>
        </div>

        {/* Wake Word Indicator */}
        <button id="btn-navbar-wake-word"
          onClick={onToggleWakeWord}
          title={wakeWordActive ? 'Wake word active — say "Hey Sapphire"' : 'Click to enable "Hey Sapphire" wake word'}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            wakeWordActive
              ? 'border-[#E0FF25]/50 bg-[#E0FF25]/10 text-[#E0FF25]'
              : 'border-[#262626] bg-[#0e0e0e] text-[#737373] hover:text-[#a3a3a3]'
          }`}
        >
          <Mic className={`h-3 w-3 ${wakeWordActive ? 'text-[#E0FF25]' : 'text-[#737373]'}`} />
          <span className="hidden sm:inline">{wakeWordActive ? 'Wake On' : 'Wake Off'}</span>
        </button>

        {/* Memory Counter Badge */}
        <button id="btn-navbar-11"
          onClick={() => onNavigate('memory')}
          className="flex items-center gap-1.5 rounded-md border border-[#262626] bg-[#0e0e0e] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E0FF25] transition hover:border-[#E0FF25]/50"
        >
          <Brain className="h-3 w-3" />
          <span className="font-black">{memoryCount}</span>
          <span className="hidden sm:inline">Memories</span>
        </button>

        {/* Six 686 Governance Badge */}
        <button id="btn-navbar-12"
          onClick={onOpenGovernance}
          title="Six 686 Governance Engine & Verification Layer"
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            killSwitchActive
              ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse'
              : pendingApprovalsCount > 0
              ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
              : 'border-[#262626] bg-[#0e0e0e] text-[#a3a3a3] hover:border-[#E0FF25]/50 hover:text-white'
          }`}
        >
          <ShieldCheck className={`h-3 w-3 ${killSwitchActive ? 'text-red-400' : pendingApprovalsCount > 0 ? 'text-amber-400' : 'text-[#E0FF25]'}`} />
          <span className="font-mono">Six 686</span>
          {pendingApprovalsCount > 0 && (
            <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[8px] font-black text-black">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* Save Snippet / Project */}
        <button id="btn-navbar-13"
          onClick={onOpenSaveModal}
          className="hidden items-center gap-1.5 rounded-md border border-[#262626] bg-[#0e0e0e] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25] sm:flex"
        >
          <FolderDown className="h-3.5 w-3.5" />
          Save Project
        </button>

        {/* User Badge */}
        {currentUser ? (
          <div className="flex items-center gap-2 rounded-md border border-[#262626] bg-[#0e0e0e] py-0.5 pl-2.5 pr-1.5 text-xs font-bold">
            <span className="flex h-2 w-2 rounded-full bg-[#E0FF25]"></span>
            <span className="max-w-[100px] truncate font-extrabold text-white sm:max-w-[140px]">
              {currentUser.name}
            </span>
            <button id="btn-navbar-14"
              onClick={onSignOut}
              title="Sign out"
              className="rounded p-1 text-[#737373] transition hover:bg-[#262626] hover:text-white"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button id="btn-navbar-15"
            onClick={onSignIn}
            className="flex items-center gap-1.5 rounded-md bg-[#E0FF25] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-black transition hover:bg-[#ccff00]"
          >
            <User className="h-3.5 w-3.5" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
