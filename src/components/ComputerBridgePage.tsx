import React, { useState, useEffect, useCallback } from 'react';
import { 
  Laptop, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  Play, 
  ShieldCheck, 
  Mic, 
  RefreshCw, 
  Zap, 
  Volume2, 
  ExternalLink,
  Code,
  Sliders,
  Radio,
  FileCode2,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { FireflyBridgeStatus, LocalComputerInfo, FireflyComputerCommand } from '../types';
import { chime } from '../utils/audioChimes';
import { FireflyAssistantSuite } from './FireflyAssistantSuite';

interface ComputerBridgePageProps {
  bridgeStatus: FireflyBridgeStatus;
  onRefreshBridge: () => void;
  onExecuteCommand: (command: string, bypassOkay?: boolean) => Promise<any>;
  onSayOkay: () => Promise<boolean>;
  pendingVoiceCommand: FireflyComputerCommand | null;
  onNavigatePage: (page: any) => void;
  onShowToast?: (msg: string, type: 'success' | 'warn' | 'error' | 'info') => void;
}

export const ComputerBridgePage: React.FC<ComputerBridgePageProps> = ({
  bridgeStatus,
  onRefreshBridge,
  onExecuteCommand,
  onSayOkay,
  pendingVoiceCommand,
  onNavigatePage,
  onShowToast = () => {}
}) => {
  const [activeMainView, setActiveMainView] = useState<'suite' | 'terminal'>('suite');
  const [activeCodeTab, setActiveCodeTab] = useState<'node' | 'python' | 'oneliner'>('node');
  const [copiedCode, setCopiedCode] = useState(false);
  const [customCommand, setCustomCommand] = useState('whoami');
  const [commandHistory, setCommandHistory] = useState<FireflyComputerCommand[]>([]);
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState<boolean>(bridgeStatus.mode === 'full_autonomous');
  const [bridgeUrl, setBridgeUrl] = useState(bridgeStatus.url || 'http://127.0.0.1:8765');
  const [nodeBridgeScript, setNodeBridgeScript] = useState<string>('');
  const [pythonBridgeScript, setPythonBridgeScript] = useState<string>('');

  // Fetch bridge script codes from server
  useEffect(() => {
    fetch('/api/firefly/bridge-code?lang=node')
      .then(r => r.text())
      .then(txt => setNodeBridgeScript(txt))
      .catch(() => {});

    fetch('/api/firefly/bridge-code?lang=python')
      .then(r => r.text())
      .then(txt => setPythonBridgeScript(txt))
      .catch(() => {});
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    chime.playWakeChime();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = (lang: 'node' | 'python') => {
    const filename = lang === 'node' ? 'firefly-bridge.js' : 'firefly-bridge.py';
    const content = lang === 'node' ? nodeBridgeScript : pythonBridgeScript;
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    chime.playWakeChime();
  };

  const handleRunTest = async (cmdToRun?: string) => {
    const cmd = cmdToRun || customCommand;
    if (!cmd.trim() || isRunningCommand) return;

    setIsRunningCommand(true);
    try {
      const result = await onExecuteCommand(cmd, autonomousMode);
      if (result) {
        setCommandHistory(prev => [result, ...prev.slice(0, 19)]);
      }
    } catch (err: any) {
      console.error('Command failed:', err);
    } finally {
      setIsRunningCommand(false);
    }
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.run.app';
  const oneLinerCmd = `curl -s "${currentHost}/api/firefly/bridge-code" | node`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#262626] pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E0FF25] text-black">
              <Laptop className="h-4 w-4 stroke-[2.5]" />
            </span>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">
              Firefly Local Computer Bridge & Full Autonomy
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#a3a3a3]">
            Voice-controlled local execution daemon. Allows Firefly to run commands, open applications, and manage files on Damone's computer with the "Say Okay" authorization handshake.
          </p>
        </div>

        {/* Status Pill & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
            bridgeStatus.connected
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${bridgeStatus.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span>{bridgeStatus.connected ? 'Bridge Connected (localhost:8765)' : 'Awaiting Local Bridge'}</span>
          </div>

          <button
            id="btn-refresh-bridge-status"
            onClick={onRefreshBridge}
            title="Refresh local bridge connection status"
            className="flex items-center gap-1.5 rounded-md border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs font-bold text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Check Connection
          </button>
        </div>
      </div>

      {/* Main Module Switcher (Assistant Suite vs. OS Bridge Daemon) */}
      <div className="mb-8 flex items-center justify-between border-b border-[#222] pb-4">
        <div className="flex items-center gap-2">
          <button
            id="btn-view-assistant-suite"
            onClick={() => setActiveMainView('suite')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
              activeMainView === 'suite'
                ? 'bg-[#E0FF25] text-black shadow-lg shadow-[#E0FF25]/20'
                : 'bg-[#111] text-neutral-400 hover:text-white border border-[#222]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Assistant Suite (Emails, Docs & Google Docs)</span>
          </button>

          <button
            id="btn-view-bridge-terminal"
            onClick={() => setActiveMainView('terminal')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
              activeMainView === 'terminal'
                ? 'bg-[#E0FF25] text-black shadow-lg shadow-[#E0FF25]/20'
                : 'bg-[#111] text-neutral-400 hover:text-white border border-[#222]'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>OS Shell & Daemon Setup</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-500 font-mono hidden sm:block">
          Continuous Microphone Active Across All Pages
        </div>
      </div>

      {/* PENDING "SAY OKAY" BANNER (VOICE HANDSHAKE) */}
      {pendingVoiceCommand && (
        <div className="mb-8 overflow-hidden rounded-xl border-2 border-[#E0FF25] bg-[#E0FF25]/10 p-5 shadow-[0_0_30px_rgba(224,255,37,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#E0FF25] text-black animate-pulse">
                <Mic className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#E0FF25] px-1.5 py-0.5 text-[10px] font-black uppercase text-black">
                    Awaiting Authorization
                  </span>
                  <span className="text-xs text-[#E0FF25]">Say "Okay" into your microphone or click below</span>
                </div>
                <h3 className="mt-1 text-sm font-black text-white">
                  Firefly is requesting to run on your computer:
                </h3>
                <code className="mt-1 block rounded bg-black/60 px-3 py-1.5 font-mono text-xs text-[#E0FF25]">
                  {pendingVoiceCommand.command}
                </code>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-say-okay-authorize"
                onClick={onSayOkay}
                className="flex items-center gap-2 rounded-lg bg-[#E0FF25] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg transition hover:bg-white hover:scale-105"
              >
                <CheckCircle2 className="h-4 w-4" />
                I Say Okay (Authorize)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: ASSISTANT SUITE */}
      {activeMainView === 'suite' && (
        <div className="mb-8">
          <FireflyAssistantSuite
            bridgeStatus={bridgeStatus}
            onExecuteComputerCommand={onExecuteCommand}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* VIEW 2: OS BRIDGE DAEMON SETUP & LIVE RUNNER */}
      {activeMainView === 'terminal' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (7 cols): Bridge Code & Step-by-Step Setup */}
        <div className="space-y-6 lg:col-span-7">
          {/* Quick Setup 1-2-3 Card */}
          <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#E0FF25]">
              <Zap className="h-4 w-4" />
              How to Give Firefly Access to Run Your Computer (HTTP)
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#1f1f1f] bg-[#080808] p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E0FF25] text-[11px] font-black text-black">1</div>
                <h4 className="mt-2 text-xs font-bold text-white">Get Bridge Code</h4>
                <p className="mt-1 text-[11px] text-[#737373]">
                  Copy the code below or run the one-liner command in your terminal.
                </p>
              </div>

              <div className="rounded-lg border border-[#1f1f1f] bg-[#080808] p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E0FF25] text-[11px] font-black text-black">2</div>
                <h4 className="mt-2 text-xs font-bold text-white">Start Daemon</h4>
                <p className="mt-1 text-[11px] text-[#737373]">
                  Run <code className="text-[#E0FF25]">node firefly-bridge.js</code>. It opens HTTP on port 8765.
                </p>
              </div>

              <div className="rounded-lg border border-[#1f1f1f] bg-[#080808] p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E0FF25] text-[11px] font-black text-black">3</div>
                <h4 className="mt-2 text-xs font-bold text-white">Say "Okay"</h4>
                <p className="mt-1 text-[11px] text-[#737373]">
                  Say commands in your mic on any page. Say "Okay" to confirm execution!
                </p>
              </div>
            </div>
          </div>

          {/* Bridge Code Block */}
          <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-[#262626] bg-[#141414] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-[#E0FF25]" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Bridge Daemon Code</span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveCodeTab('node')}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                    activeCodeTab === 'node' ? 'bg-[#E0FF25] text-black' : 'text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  Node.js (Built-in)
                </button>
                <button
                  onClick={() => setActiveCodeTab('python')}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                    activeCodeTab === 'python' ? 'bg-[#E0FF25] text-black' : 'text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  Python 3
                </button>
                <button
                  onClick={() => setActiveCodeTab('oneliner')}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                    activeCodeTab === 'oneliner' ? 'bg-[#E0FF25] text-black' : 'text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  One-Liner (cURL)
                </button>
              </div>
            </div>

            <div className="p-4">
              {activeCodeTab === 'oneliner' ? (
                <div>
                  <p className="text-xs text-[#a3a3a3]">
                    Paste this single command into your computer's terminal (Terminal / PowerShell / Bash) to download and run the bridge immediately:
                  </p>
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-[#262626] bg-black p-3">
                    <code className="font-mono text-xs text-[#E0FF25] break-all">{oneLinerCmd}</code>
                    <button
                      onClick={() => handleCopy(oneLinerCmd)}
                      className="ml-3 flex items-center gap-1 rounded bg-[#1f1f1f] px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#E0FF25] hover:text-black"
                    >
                      {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedCode ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#737373]">
                      {activeCodeTab === 'node' ? 'Native Node.js script (Zero npm install needed)' : 'Native Python 3 script (Zero pip install needed)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(activeCodeTab === 'node' ? nodeBridgeScript : pythonBridgeScript)}
                        className="flex items-center gap-1 rounded border border-[#262626] bg-[#1a1a1a] px-2.5 py-1 text-[11px] font-bold text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
                      >
                        {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedCode ? 'Copied' : 'Copy Code'}
                      </button>
                      <button
                        onClick={() => handleDownload(activeCodeTab)}
                        className="flex items-center gap-1 rounded border border-[#262626] bg-[#1a1a1a] px-2.5 py-1 text-[11px] font-bold text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
                      >
                        <Download className="h-3 w-3" />
                        Download File
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-lg border border-[#262626] bg-[#050505] p-3 font-mono text-xs text-[#a3a3a3]">
                    <pre className="whitespace-pre-wrap">
                      {activeCodeTab === 'node' ? nodeBridgeScript : pythonBridgeScript}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Voice Navigation & Cross-Page Commands Reference */}
          <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-5">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#E0FF25]">
              <Radio className="h-4 w-4" />
              Cross-Page Voice & Autonomy Voice Commands
            </h3>
            <p className="mt-1 text-xs text-[#737373]">
              Because Firefly runs her microphone continuously through every page, you can say these anywhere:
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-[#1f1f1f] bg-[#080808] p-2.5">
                <span className="text-[10px] font-bold uppercase text-[#a3a3a3]">Page Navigation</span>
                <p className="mt-0.5 font-mono text-xs text-[#E0FF25]">"Hey Firefly, turn to OpenClaw"</p>
                <p className="font-mono text-xs text-[#E0FF25]">"Hey Firefly, turn to Memory"</p>
                <p className="font-mono text-xs text-[#E0FF25]">"Hey Firefly, go to Home"</p>
              </div>

              <div className="rounded-lg border border-[#1f1f1f] bg-[#080808] p-2.5">
                <span className="text-[10px] font-bold uppercase text-[#a3a3a3]">Autonomous UI Clicking</span>
                <p className="mt-0.5 font-mono text-xs text-[#E0FF25]">"Hey Firefly, click Install Plugin"</p>
                <p className="font-mono text-xs text-[#E0FF25]">"Hey Firefly, click Governance"</p>
                <p className="font-mono text-xs text-[#E0FF25]">"Hey Firefly, click Save Project"</p>
              </div>

              <div className="rounded-lg border border-[#1f1f1f] bg-[#080808] p-2.5">
                <span className="text-[10px] font-bold uppercase text-[#a3a3a3]">Computer Shell Commands</span>
                <p className="mt-0.5 font-mono text-xs text-[#E0FF25]">"Hey Firefly, run on my computer whoami"</p>
                <p className="font-mono text-xs text-[#E0FF25]">"Hey Firefly, run on computer ls -la"</p>
                <p className="font-mono text-xs text-[#E0FF25]">"Hey Firefly, run on my computer git status"</p>
              </div>

              <div className="rounded-lg border border-[#1f1f1f] bg-[#080808] p-2.5">
                <span className="text-[10px] font-bold uppercase text-[#a3a3a3]">Authorization Handshake</span>
                <p className="mt-0.5 font-mono text-xs text-[#E0FF25]">"Say Okay"</p>
                <p className="font-mono text-xs text-[#E0FF25]">"Okay"</p>
                <p className="font-mono text-xs text-[#E0FF25]">"I say okay / Authorize"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Computer Diagnostics & Autonomous Console */}
        <div className="space-y-6 lg:col-span-5">
          {/* Host Diagnostics Card */}
          <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Laptop className="h-4 w-4 text-[#E0FF25]" />
              Local Computer Telemetry
            </h2>

            {bridgeStatus.computerInfo ? (
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-[#1f1f1f] pb-1.5">
                  <span className="text-[#737373]">Hostname</span>
                  <span className="font-mono font-bold text-white">{bridgeStatus.computerInfo.hostname}</span>
                </div>
                <div className="flex justify-between border-b border-[#1f1f1f] pb-1.5">
                  <span className="text-[#737373]">Operating System</span>
                  <span className="font-mono font-bold text-[#E0FF25]">
                    {bridgeStatus.computerInfo.platform} ({bridgeStatus.computerInfo.arch})
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#1f1f1f] pb-1.5">
                  <span className="text-[#737373]">User Account</span>
                  <span className="font-mono font-bold text-white">{bridgeStatus.computerInfo.username}</span>
                </div>
                <div className="flex justify-between border-b border-[#1f1f1f] pb-1.5">
                  <span className="text-[#737373]">Home Directory</span>
                  <span className="font-mono text-[#a3a3a3] truncate max-w-[200px]" title={bridgeStatus.computerInfo.homeDir}>
                    {bridgeStatus.computerInfo.homeDir}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#1f1f1f] pb-1.5">
                  <span className="text-[#737373]">CPU Cores</span>
                  <span className="font-mono font-bold text-white">{bridgeStatus.computerInfo.cpuCount} Cores</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[#737373]">Memory Available</span>
                  <span className="font-mono font-bold text-white">
                    {bridgeStatus.computerInfo.freeMemMb} MB free / {bridgeStatus.computerInfo.totalMemMb} MB
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-[#1f1f1f] bg-[#080808] p-4 text-center">
                <p className="text-xs text-[#737373]">
                  Waiting for connection from <code className="text-[#E0FF25]">http://127.0.0.1:8765</code>. Run the bridge script above to connect your computer.
                </p>
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={onRefreshBridge}
                    className="flex items-center gap-1.5 rounded-md bg-[#1f1f1f] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#E0FF25] hover:text-black transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Ping Bridge
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Command Runner */}
          <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-5">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Terminal className="h-4 w-4 text-[#E0FF25]" />
              Run Command on Computer
            </h3>

            {/* Quick Action Presets */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { label: 'whoami', cmd: 'whoami' },
                { label: 'List Files', cmd: 'ls -lah' },
                { label: 'Git Status', cmd: 'git status' },
                { label: 'Open VS Code', cmd: 'code .' }
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setCustomCommand(preset.cmd);
                    handleRunTest(preset.cmd);
                  }}
                  className="rounded border border-[#262626] bg-[#141414] px-2 py-1 text-[10px] font-bold text-[#a3a3a3] transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customCommand}
                onChange={e => setCustomCommand(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRunTest()}
                placeholder="e.g. whoami, dir, ls, code ."
                className="flex-1 rounded-lg border border-[#262626] bg-black px-3 py-2 font-mono text-xs text-white placeholder-[#525252] outline-none focus:border-[#E0FF25]"
              />
              <button
                onClick={() => handleRunTest()}
                disabled={isRunningCommand}
                className="flex items-center gap-1.5 rounded-lg bg-[#E0FF25] px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white disabled:opacity-50"
              >
                {isRunningCommand ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Run
              </button>
            </div>

            {/* Command History / Console Output */}
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase text-[#737373]">Recent Computer Outputs</span>
              <div className="mt-1 max-h-80 overflow-y-auto space-y-2 rounded-lg border border-[#262626] bg-black p-3 font-mono text-xs">
                {commandHistory.length === 0 ? (
                  <p className="text-center text-[11px] text-[#525252] py-4">
                    No commands executed yet. Run a command above or say "Hey Firefly, run on my computer whoami".
                  </p>
                ) : (
                  commandHistory.map((item, idx) => (
                    <div key={idx} className="border-b border-[#1a1a1a] pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#E0FF25] font-bold">$ {item.command}</span>
                        <span className={`text-[10px] ${item.exitCode === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.exitCode === 0 ? `0 (${item.durationMs}ms)` : `exit ${item.exitCode}`}
                        </span>
                      </div>
                      {item.stdout && (
                        <pre className="mt-1 text-[#a3a3a3] whitespace-pre-wrap text-[11px] max-h-36 overflow-y-auto">
                          {item.stdout}
                        </pre>
                      )}
                      {item.stderr && (
                        <pre className="mt-1 text-red-400 whitespace-pre-wrap text-[11px]">
                          {item.stderr}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
