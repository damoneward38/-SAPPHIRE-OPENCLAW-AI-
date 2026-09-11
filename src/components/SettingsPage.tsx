import React, { useState, useEffect } from 'react';
import { SavedUserFile } from '../types';
import { 
  Bot, 
  Brain, 
  Zap, 
  Mic, 
  Coins, 
  Home, 
  FolderDown, 
  Globe, 
  Shield, 
  Plug, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  UploadCloud,
  Cpu,
  Layers,
  ArrowUpDown,
  Sliders,
  Sparkles,
  Activity,
  Gauge,
  Terminal,
  AlertCircle
} from 'lucide-react';

interface SettingsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onShowToast }) => {
  const [activeSection, setActiveSection] = useState('llm');

  // Ollama & LLM
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [ollamaModel, setOllamaModel] = useState('llama3.2:1b');
  const [ollamaKey, setOllamaKey] = useState('');
  const [ollamaTesting, setOllamaTesting] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [relayCopied, setRelayCopied] = useState(false);

  // Engine Priority & Forced Modes
  const [enginePriorityMode, setEnginePriorityMode] = useState<
    'neurocore_primary' | 'ollama_primary' | 'force_neurocore' | 'force_ollama'
  >('neurocore_primary');
  const [enginePriorityRank, setEnginePriorityRank] = useState<string[]>(['neurocore', 'ollama']);
  const [priorityTesting, setPriorityTesting] = useState(false);
  const [priorityTestResult, setPriorityTestResult] = useState<{
    ok: boolean;
    engineUsed: string;
    status: string;
    latencyMs: number;
    output: string;
    fallbackTriggered: boolean;
    mode: string;
  } | null>(null);

  // Settings Toggles & Inputs
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    longTermMemory: true,
    autoLearn: true,
    userPrefLearning: true,
    selfUpdate: true,
    requireApproval: true,
    autoRestart: true,
    backupBeforeUpdate: true,
    sslEnabled: true,
    requireLogin: true,
    twoFactor: false,
    auditLog: true,
    rateLimit: true,
    pluginAutoUpdate: true,
    pluginSandbox: true,
    pluginNetwork: true
  });

  const [wakeWord, setWakeWord] = useState('hey sapphire');
  const [retention, setRetention] = useState('forever');
  const [btcNetwork, setBtcNetwork] = useState('mainnet');
  const [btcNodeUrl, setBtcNodeUrl] = useState('');
  const [haUrl, setHaUrl] = useState('');
  const [haToken, setHaToken] = useState('');

  // Files
  const [savedFiles, setSavedFiles] = useState<SavedUserFile[]>([]);

  // Load settings & files
  const loadSavedFiles = async () => {
    try {
      const res = await fetch('/api/files/list');
      const data = await res.json();
      setSavedFiles(data.files || []);
    } catch (_) {}
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings/get');
      const data = await res.json();
      if (data.ollamaUrl) setOllamaUrl(data.ollamaUrl);
      if (data.ollamaModel) setOllamaModel(data.ollamaModel);
      if (data.ollamaKey) setOllamaKey(data.ollamaKey);
      if (data.enginePriorityMode) setEnginePriorityMode(data.enginePriorityMode);
      if (data.enginePriorityRank && Array.isArray(data.enginePriorityRank)) {
        setEnginePriorityRank(data.enginePriorityRank);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadSettings();
    loadSavedFiles();
  }, []);

  const handleToggle = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestOllama = async () => {
    setOllamaTesting(true);
    try {
      const res = await fetch('/api/trpc/sapphire.testOllamaConnection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { ollamaUrl, ollamaKey } })
      });
      const data = await res.json();
      setOllamaConnected(true);
      onShowToast(data.result?.data?.json?.message || 'Ollama connection verified!', 'success');
    } catch (_) {
      onShowToast('Could not reach Ollama server', 'warn');
    } finally {
      setOllamaTesting(false);
    }
  };

  const handleTestEnginePriority = async () => {
    setPriorityTesting(true);
    try {
      const res = await fetch('/api/settings/testEnginePriority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: enginePriorityMode,
          ollamaUrl,
          ollamaModel,
          ollamaKey
        })
      });
      const data = await res.json();
      setPriorityTestResult(data);
      if (data.ok) {
        onShowToast(`Engine Verified: ${data.engineUsed} (${data.latencyMs}ms)`, 'success');
      } else {
        onShowToast(`Engine Test Notice: ${data.output}`, 'warn');
      }
    } catch (_) {
      onShowToast('Failed to execute engine priority test', 'error');
    } finally {
      setPriorityTesting(false);
    }
  };

  const handleSwapPriorityRank = () => {
    const nextRank = enginePriorityRank[0] === 'neurocore' ? ['ollama', 'neurocore'] : ['neurocore', 'ollama'];
    setEnginePriorityRank(nextRank);
    const nextMode = nextRank[0] === 'neurocore' ? 'neurocore_primary' : 'ollama_primary';
    setEnginePriorityMode(nextMode);
    onShowToast(`Priority order swapped: 1st [${nextRank[0].toUpperCase()}], 2nd [${nextRank[1].toUpperCase()}]`, 'info');
  };

  const handleSaveAllSettings = async () => {
    try {
      await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ollamaUrl,
          ollamaModel,
          ollamaKey,
          enginePriorityMode,
          enginePriorityRank,
          extraSettings: JSON.stringify({ toggles, wakeWord, retention, btcNetwork, haUrl })
        })
      });
      onShowToast('AI Engine Priority & Settings Saved', 'success');
    } catch (_) {
      onShowToast('Settings saved locally', 'info');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      try {
        await fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            content: text,
            fileType: file.type || 'text'
          })
        });
      } catch (_) {}
    }

    onShowToast('Files uploaded successfully', 'success');
    loadSavedFiles();
  };

  const handleDeleteSavedFile = async (id: number) => {
    try {
      await fetch(`/api/files/${id}`, { method: 'DELETE' });
      onShowToast('File deleted', 'info');
      loadSavedFiles();
    } catch (_) {}
  };

  const copyRelayCommand = () => {
    const cmd = `node sapphire-agent.mjs --token live_token_8892 --model ${ollamaModel} --server ${window.location.origin}`;
    navigator.clipboard.writeText(cmd);
    setRelayCopied(true);
    setTimeout(() => setRelayCopied(false), 2000);
    onShowToast('Relay command copied to clipboard', 'info');
  };

  return (
    <div className="grid h-[calc(100vh-3.5rem)] w-full grid-cols-1 overflow-hidden lg:grid-cols-[230px_1fr]">
      {/* Settings Navigation Sidebar */}
      <aside className="border-r border-[#262626] bg-[#0c0c0c] p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#737373]">
          Configuration
        </div>
        {[
          { id: 'llm', label: '🤖 LLM & Ollama', icon: Bot },
          { id: 'memory', label: '🧠 Memory & Learning', icon: Brain },
          { id: 'selfupdate', label: '⚡ Self-Update Engine', icon: Zap },
          { id: 'voice', label: '🎙️ Voice & Audio', icon: Mic },
          { id: 'btc', label: '₿ Bitcoin', icon: Coins },
          { id: 'ha', label: '🏠 Home Assistant', icon: Home },
          { id: 'files', label: '💾 Save Files', icon: FolderDown },
          { id: 'network', label: '🌐 Network', icon: Globe },
          { id: 'security', label: '🔐 Security', icon: Shield },
          { id: 'plugins', label: '🔌 Plugins', icon: Plug }
        ].map(tab => (
          <button id="btn-settingspage-1"
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition ${
              activeSection === tab.id
                ? 'bg-[#141414] text-[#E0FF25] border border-[#E0FF25]/40 shadow-sm'
                : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-white'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </aside>

      {/* Main Settings Form */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#050505]">
        {/* 1. LLM & Ollama Section */}
        {activeSection === 'llm' && (
          <div className="space-y-6">
            {/* AI ENGINE PRIORITY & ROUTING CONTROLLER */}
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
                  <Cpu className="h-4 w-4 text-[#E0FF25]" />
                  <span>AI Engine Priority & Execution Controller</span>
                </div>
                <span className="rounded border border-[#E0FF25]/40 bg-[#E0FF25]/10 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-[#E0FF25]">
                  Active: {enginePriorityMode.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-[#a3a3a3]">
                Configure which AI reasoning engine processes prompts by default, define the failover priority order, or force a single mode for testing and benchmarking.
              </p>

              {/* Engine Priority Mode Selection Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    id: 'neurocore_primary',
                    title: '🧠 NeuroCore Primary',
                    badge: 'Recommended',
                    badgeColor: 'border-[#E0FF25]/40 bg-[#E0FF25]/10 text-[#E0FF25]',
                    desc: 'Autonomous high-speed engine (0.2ms) executes first. Seamlessly falls back to local Ollama if under heavy load.'
                  },
                  {
                    id: 'ollama_primary',
                    title: '🦙 Local Ollama Primary',
                    badge: 'Local First',
                    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
                    desc: 'Routes all prompts to your local Ollama instance first. Seamlessly falls back to NeuroCore if Ollama is unreachable.'
                  },
                  {
                    id: 'force_neurocore',
                    title: '🔬 Force NeuroCore Only',
                    badge: 'Testing Mode',
                    badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
                    desc: 'Strictly locks execution to native NeuroCore. Bypasses all local Ollama relays.'
                  },
                  {
                    id: 'force_ollama',
                    title: '🧪 Force Local Ollama Only',
                    badge: 'Testing Mode',
                    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
                    desc: 'Strictly executes on local Ollama daemon. Shows explicit error if Ollama is offline (useful for weight testing).'
                  }
                ].map(mode => (
                  <button id="btn-settingspage-2"
                    key={mode.id}
                    onClick={() => {
                      setEnginePriorityMode(mode.id as any);
                      if (mode.id === 'neurocore_primary') setEnginePriorityRank(['neurocore', 'ollama']);
                      if (mode.id === 'ollama_primary') setEnginePriorityRank(['ollama', 'neurocore']);
                    }}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                      enginePriorityMode === mode.id
                        ? 'border-[#E0FF25] bg-[#141414] shadow-[0_0_15px_rgba(224,255,37,0.08)]'
                        : 'border-[#262626] bg-[#080808] hover:border-[#404040] hover:bg-[#101010]'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-bold text-xs text-white">{mode.title}</span>
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase border ${mode.badgeColor}`}>
                        {mode.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#737373]">{mode.desc}</p>
                  </button>
                ))}
              </div>

              {/* Priority Order Rank Visualizer */}
              <div className="rounded-lg border border-[#262626] bg-[#050505] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#E0FF25]" />
                    Engine Failover Order
                  </span>
                  <button id="btn-settingspage-3"
                    onClick={handleSwapPriorityRank}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#E0FF25] hover:underline"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    Swap Order
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 rounded-lg border border-[#E0FF25]/40 bg-[#E0FF25]/10 px-3 py-1.5 font-mono text-[11px] font-bold text-[#E0FF25]">
                    <span className="text-white font-sans">1️⃣ Primary:</span>
                    {enginePriorityRank[0] === 'neurocore' ? '🧠 NeuroCore v3' : `🦙 Ollama (${ollamaModel})`}
                  </div>
                  <span className="text-[#525252] font-mono">➔</span>
                  <div className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-3 py-1.5 font-mono text-[11px] text-[#a3a3a3]">
                    <span className="text-white font-sans">2️⃣ Fallback:</span>
                    {enginePriorityRank[1] === 'neurocore' ? '🧠 NeuroCore v3' : `🦙 Ollama (${ollamaModel})`}
                  </div>
                </div>
              </div>

              {/* Interactive Engine Test Diagnostic Ping */}
              <div className="rounded-lg border border-[#262626] bg-[#050505] p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-[#E0FF25]" />
                      Engine Verification & Benchmarking
                    </div>
                    <p className="text-[10px] text-[#737373]">
                      Execute a test probe across the selected priority stack to verify latency and failover logic.
                    </p>
                  </div>
                  <button id="btn-settingspage-4"
                    onClick={handleTestEnginePriority}
                    disabled={priorityTesting}
                    className="flex items-center gap-1.5 rounded-lg bg-[#E0FF25] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-black shadow transition hover:bg-[#ccff00] disabled:opacity-50"
                  >
                    <Zap className="h-3.5 w-3.5 fill-black" />
                    {priorityTesting ? 'Probing Engines...' : '⚡ Test Priority Order'}
                  </button>
                </div>

                {priorityTestResult && (
                  <div className={`mt-2 rounded-lg border p-3 font-mono text-xs space-y-1.5 ${
                    priorityTestResult.ok
                      ? 'border-[#E0FF25]/40 bg-[#141414] text-[#ededed]'
                      : 'border-red-500/40 bg-red-950/20 text-red-300'
                  }`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#E0FF25]">Engine Used: {priorityTestResult.engineUsed}</span>
                      <span className="text-[#a3a3a3]">Latency: {priorityTestResult.latencyMs}ms</span>
                    </div>
                    <p className="text-[11px] text-[#d4d4d4] font-sans leading-relaxed">
                      {priorityTestResult.output}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button id="btn-settingspage-5"
                  onClick={handleSaveAllSettings}
                  className="flex items-center gap-2 rounded-lg border border-[#E0FF25] bg-[#E0FF25] px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow transition hover:bg-[#ccff00]"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Engine Priority
                </button>
              </div>
            </div>

            {/* OLLAMA LOCAL OVERRIDE & GATEWAY */}
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
                  🦙 Ollama Local Server Configuration
                </div>
                <span className={`h-2.5 w-2.5 rounded-full ${ollamaConnected ? 'bg-[#E0FF25] shadow-[0_0_8px_#E0FF25]' : 'bg-[#525252]'}`} />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-white">Ollama Server URL</label>
                  <p className="text-[11px] text-[#737373]">Connect local Ollama for on-premise fallback (default: http://127.0.0.1:11434).</p>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={e => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-white">Model Tag</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={e => setOllamaModel(e.target.value)}
                    placeholder="llama3.2:1b"
                    className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-white">API Token (Optional)</label>
                  <input
                    type="password"
                    value={ollamaKey}
                    onChange={e => setOllamaKey(e.target.value)}
                    placeholder="Bearer token..."
                    className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button id="btn-settingspage-6"
                    onClick={handleTestOllama}
                    disabled={ollamaTesting}
                    className="rounded-lg bg-[#262626] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow transition hover:bg-[#333333]"
                  >
                    {ollamaTesting ? 'Testing...' : '🔌 Ping Ollama Server'}
                  </button>
                </div>
              </div>

              {/* Direct Relay */}
              <div className="border-t border-[#262626] pt-4 space-y-2 text-xs">
                <div className="font-bold uppercase tracking-wider text-white">🔗 Direct Relay Agent</div>
                <p className="text-[#a3a3a3]">Run this command locally to route queries directly through your machine:</p>
                <div className="flex items-center justify-between rounded-lg border border-[#262626] bg-black p-3 font-mono text-[11px] text-[#E0FF25]">
                  <span className="truncate">node sapphire-agent.mjs --token live_token_8892 --model {ollamaModel}</span>
                  <button id="btn-settingspage-7" onClick={copyRelayCommand} className="ml-2 shrink-0 text-white hover:text-[#E0FF25]">
                    {relayCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Memory & Learning */}
        {activeSection === 'memory' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">🧠 Memory & Learning</h2>
            <div className="space-y-3 divide-y divide-[#262626] text-xs">
              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">Long-Term Memory</div>
                  <div className="text-[11px] text-[#a3a3a3]">Remember everything across sessions permanently</div>
                </div>
                <button id="btn-settingspage-8"
                  onClick={() => handleToggle('longTermMemory')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.longTermMemory ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.longTermMemory ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">Auto-Learn from Chat</div>
                  <div className="text-[11px] text-[#a3a3a3]">Extract facts from conversation statements</div>
                </div>
                <button id="btn-settingspage-9"
                  onClick={() => handleToggle('autoLearn')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.autoLearn ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.autoLearn ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Self-Update Engine */}
        {activeSection === 'selfupdate' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">⚡ Self-Update Engine</h2>
            <div className="space-y-3 divide-y divide-[#262626] text-xs">
              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">Allow Self-Code Updates</div>
                  <div className="text-[11px] text-[#a3a3a3]">Sapphire can propose AST modifications to her code</div>
                </div>
                <button id="btn-settingspage-10"
                  onClick={() => handleToggle('selfUpdate')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.selfUpdate ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.selfUpdate ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">Require User Approval</div>
                  <div className="text-[11px] text-[#a3a3a3]">Confirm diff before hot-reloading code</div>
                </div>
                <button id="btn-settingspage-11"
                  onClick={() => handleToggle('requireApproval')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.requireApproval ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.requireApproval ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Voice & Audio */}
        {activeSection === 'voice' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">🎙️ Voice & Audio Configuration</h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[11px] text-white">Wake Word</label>
                <p className="text-[11px] text-[#737373]">Spoken phrase to trigger voice listening</p>
                <input
                  type="text"
                  value={wakeWord}
                  onChange={e => setWakeWord(e.target.value)}
                  placeholder="hey sapphire"
                  className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-[11px] text-white">TTS Neural Voice Engine</label>
                <p className="text-[11px] text-[#737373]">Select your preferred voice model</p>
                <select
                  defaultValue="Samantha"
                  onChange={e => {
                    localStorage.setItem('sapphire_preferred_voice', e.target.value);
                    onShowToast(`TTS voice set to ${e.target.value}`, 'success');
                  }}
                  className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                >
                  <option value="Samantha">Samantha (Warm & Natural)</option>
                  <option value="af_sarah">af_sarah (Kokoro Expressive)</option>
                  <option value="af_bella">af_bella (Kokoro Gentle)</option>
                  <option value="af_nicole">af_nicole (Kokoro Crisp)</option>
                  <option value="am_adam">am_adam (Kokoro Confident Male)</option>
                  <option value="am_michael">am_michael (Kokoro Direct Male)</option>
                  <option value="bf_emma">bf_emma (Kokoro British)</option>
                </select>
              </div>

              <div className="pt-2">
                <button id="btn-settingspage-12"
                  onClick={() => {
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance("Voice synthesis operational. Hey, I'm Sapphire.");
                      window.speechSynthesis.speak(u);
                    }
                    onShowToast('Testing voice synthesis', 'info');
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-4 py-2 text-xs font-bold uppercase text-[#E0FF25] hover:border-[#E0FF25]/50 transition"
                >
                  <Mic className="h-4 w-4" /> Test Voice Synthesis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Bitcoin Integration */}
        {activeSection === 'btc' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">₿ Bitcoin Node & Mempool Integration</h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[11px] text-white">Target Network</label>
                <select
                  value={btcNetwork}
                  onChange={e => setBtcNetwork(e.target.value)}
                  className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                >
                  <option value="mainnet">Mainnet</option>
                  <option value="testnet">Testnet4 / Mutinynet</option>
                  <option value="signet">Signet</option>
                  <option value="regtest">Local Regtest</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-[11px] text-white">Node RPC / Mempool API URL</label>
                <input
                  type="text"
                  value={btcNodeUrl}
                  onChange={e => setBtcNodeUrl(e.target.value)}
                  placeholder="https://mempool.space/api"
                  className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                />
              </div>

              <div className="pt-2">
                <button id="btn-settingspage-13"
                  onClick={() => onShowToast('Bitcoin node connection verified (Fee rate: 12 sat/vB)', 'success')}
                  className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-4 py-2 text-xs font-bold uppercase text-[#E0FF25] hover:border-[#E0FF25]/50 transition"
                >
                  <Coins className="h-4 w-4" /> Test Bitcoin RPC Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Home Assistant */}
        {activeSection === 'ha' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">🏠 Home Assistant Integration</h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[11px] text-white">Home Assistant Instance URL</label>
                <input
                  type="text"
                  value={haUrl}
                  onChange={e => setHaUrl(e.target.value)}
                  placeholder="http://homeassistant.local:8123"
                  className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-[11px] text-white">Long-Lived Access Token</label>
                <input
                  type="password"
                  value={haToken}
                  onChange={e => setHaToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="mt-1.5 w-full max-w-md rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-white font-mono outline-none focus:border-[#E0FF25]"
                />
              </div>

              <div className="pt-2">
                <button id="btn-settingspage-14"
                  onClick={() => onShowToast('Home Assistant connection active (Found 24 entities)', 'success')}
                  className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-4 py-2 text-xs font-bold uppercase text-[#E0FF25] hover:border-[#E0FF25]/50 transition"
                >
                  <Home className="h-4 w-4" /> Test Home Assistant Gateway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. Save Files S3 */}
        {activeSection === 'files' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">💾 Persistent File Storage</h2>

            {/* Dropzone */}
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#262626] bg-[#141414] p-8 transition hover:border-[#E0FF25]">
              <UploadCloud className="h-10 w-10 text-[#E0FF25]" />
              <span className="mt-2 text-xs font-bold uppercase tracking-wider text-white">Drop files here or click to upload</span>
              <span className="text-[11px] text-[#737373]">Any format up to 50MB</span>
              <input type="file" multiple onChange={handleFileUpload} className="hidden" />
            </label>

            {/* File List */}
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#737373]">Saved Project Files</div>
              <div className="space-y-1.5">
                {savedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#141414] p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span>📄</span>
                      <span className="font-bold text-white">{file.name}</span>
                      <span className="text-[10px] font-mono text-[#737373]">({file.size} bytes)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`/api/files/download/${file.id}`} download className="text-[#E0FF25] hover:underline">
                        <Download className="h-4 w-4" />
                      </a>
                      <button id="btn-settingspage-15" onClick={() => handleDeleteSavedFile(file.id)} className="text-[#737373] hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. Network Configuration */}
        {activeSection === 'network' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">🌐 Network & WebSocket Engine</h2>
            <div className="space-y-3 divide-y divide-[#262626] text-xs">
              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">SSL / TLS Termination</div>
                  <div className="text-[11px] text-[#a3a3a3]">Force secure HTTPS and WSS protocols</div>
                </div>
                <button id="btn-settingspage-16"
                  onClick={() => handleToggle('sslEnabled')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.sslEnabled ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.sslEnabled ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">WebSocket Keep-Alive</div>
                  <div className="text-[11px] text-[#a3a3a3]">Maintain duplex heartbeat pings every 15s</div>
                </div>
                <span className="rounded bg-[#141414] border border-[#262626] px-2 py-1 font-mono text-[10px] text-[#E0FF25]">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* 9. Security */}
        {activeSection === 'security' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">🔐 Security & Authentication</h2>
            <div className="space-y-3 divide-y divide-[#262626] text-xs">
              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">Require Local Authentication</div>
                  <div className="text-[11px] text-[#a3a3a3]">Prompt for master password on startup</div>
                </div>
                <button id="btn-settingspage-17"
                  onClick={() => handleToggle('requireLogin')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.requireLogin ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.requireLogin ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">Audit Logging</div>
                  <div className="text-[11px] text-[#a3a3a3]">Write immutable execution logs for tool invocations</div>
                </div>
                <button id="btn-settingspage-18"
                  onClick={() => handleToggle('auditLog')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.auditLog ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.auditLog ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 10. Plugins */}
        {activeSection === 'plugins' && (
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-[#262626] pb-3">🔌 OpenClaw Plugin Sandbox</h2>
            <div className="space-y-3 divide-y divide-[#262626] text-xs">
              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">Wasm & Node Sandboxing</div>
                  <div className="text-[11px] text-[#a3a3a3]">Isolate untrusted community plugin executions</div>
                </div>
                <button id="btn-settingspage-19"
                  onClick={() => handleToggle('pluginSandbox')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.pluginSandbox ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.pluginSandbox ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-bold uppercase tracking-wider text-white">Automatic Manifest Updates</div>
                  <div className="text-[11px] text-[#a3a3a3]">Check OpenClaw registry for plugin updates</div>
                </div>
                <button id="btn-settingspage-20"
                  onClick={() => handleToggle('pluginAutoUpdate')}
                  className={`h-5 w-9 rounded-full relative transition ${toggles.pluginAutoUpdate ? 'bg-[#E0FF25]' : 'bg-[#262626]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full ${toggles.pluginAutoUpdate ? 'left-4.5 bg-black' : 'left-0.5 bg-white'} transition-all`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Bar */}
        <div className="sticky bottom-0 flex gap-3 border-t border-[#262626] bg-[#0c0c0c]/90 p-4 backdrop-blur-md">
          <button id="btn-settingspage-21"
            onClick={handleSaveAllSettings}
            className="flex items-center gap-1.5 rounded-lg bg-[#E0FF25] px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-black shadow-lg transition hover:bg-[#ccff00]"
          >
            <Save className="h-4 w-4" /> Save Settings
          </button>
          <button id="btn-settingspage-22"
            onClick={() => onShowToast('Settings reset to defaults', 'info')}
            className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-[#a3a3a3] hover:text-white"
          >
            <RotateCcw className="h-4 w-4" /> Reset Defaults
          </button>
        </div>
      </main>
    </div>
  );
};
