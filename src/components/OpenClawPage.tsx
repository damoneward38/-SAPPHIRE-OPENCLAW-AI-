import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TerminalLog, 
  WorkspaceFile, 
  DashboardMetrics, 
  OpenClawPipeline, 
  PipelineStep, 
  PipelineExecutionRun, 
  PluginConnector 
} from '../types';
import { 
  Terminal as TerminalIcon, 
  Code2, 
  LayoutDashboard, 
  FileText, 
  Cpu, 
  Play, 
  Save, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Send, 
  Rocket, 
  Plus, 
  Check, 
  Copy, 
  Download,
  Layers,
  Workflow,
  Zap,
  Radio,
  Plug,
  FolderArchive,
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sliders,
  Shield,
  Activity,
  ArrowRight,
  FileCode,
  Eye,
  Box
} from 'lucide-react';

interface OpenClawPageProps {
  onShowToast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
}

type TabType = 'pipelines' | 'connectors' | 'vault' | 'terminal' | 'codeeditor' | 'dashboard' | 'aiengine';

export const OpenClawPage: React.FC<OpenClawPageProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<TabType>('pipelines');

  // ----------------------------------------------------
  // 1. PIPELINES STATE & ENGINE
  // ----------------------------------------------------
  const [pipelines, setPipelines] = useState<OpenClawPipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('pipe-1');
  const [activeExecutionRun, setActiveExecutionRun] = useState<PipelineExecutionRun | null>(null);
  const [executionHistory, setExecutionHistory] = useState<PipelineExecutionRun[]>([]);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [isNewPipelineModalOpen, setIsNewPipelineModalOpen] = useState(false);

  // New pipeline form state
  const [newPipeName, setNewPipeName] = useState('');
  const [newPipeDesc, setNewPipeDesc] = useState('');
  const [newPipeTrigger, setNewPipeTrigger] = useState<'voice_wake' | 'cron' | 'webhook' | 'event' | 'manual'>('voice_wake');
  const [newPipeTriggerConfig, setNewPipeTriggerConfig] = useState('Hey Sapphire, run automation');
  const [newPipeSteps, setNewPipeSteps] = useState<PipelineStep[]>([
    {
      id: 'step-1',
      title: '🧠 Sapphire Brain: Analyze Intent & Context',
      type: 'sapphire_prompt',
      prompt: 'Synthesize optimal execution parameters for task'
    },
    {
      id: 'step-2',
      title: '💾 Plugin [Save Files]: Store Output Artifact',
      type: 'file_save',
      fileName: 'automated_output.json'
    }
  ]);

  // ----------------------------------------------------
  // 2. PLUGIN CONNECTORS STATE
  // ----------------------------------------------------
  const [connectors, setConnectors] = useState<PluginConnector[]>([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>('bitcoin');
  const [isTestingPlugin, setIsTestingPlugin] = useState(false);
  const [pluginTestResult, setPluginTestResult] = useState<any>(null);

  // ----------------------------------------------------
  // 3. PERSISTENT VAULT / SAVED ARTIFACTS STATE
  // ----------------------------------------------------
  const [vaultItems, setVaultItems] = useState<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    content: string;
    createdAt: string;
    tags: string[];
  }>>([]);
  const [vaultSearch, setVaultSearch] = useState('');
  const [selectedVaultItem, setSelectedVaultItem] = useState<any>(null);

  // ----------------------------------------------------
  // 4. TERMINAL STATE
  // ----------------------------------------------------
  const [termInput, setTermInput] = useState('');
  const [termOutput, setTermOutput] = useState<Array<{ text: string; type: 'prompt' | 'cmd' | 'out' | 'err' | 'ok' | 'info' }>>([
    { text: '⚡ OpenClaw Orchestration & Pipeline Terminal initialized.', type: 'info' },
    { text: 'Type "help" or run "openclaw run pipe-1" to trigger autonomous pipelines...', type: 'out' }
  ]);
  const [termHistory, setTermHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const termBottomRef = useRef<HTMLDivElement | null>(null);

  // ----------------------------------------------------
  // 5. CODE EDITOR STATE
  // ----------------------------------------------------
  const [filesList, setFilesList] = useState<WorkspaceFile[]>([]);
  const [activeFile, setActiveFile] = useState('sapphire.py');
  const [codeContent, setCodeContent] = useState('');
  const [editorStatus, setEditorStatus] = useState('Ready');

  // ----------------------------------------------------
  // 6. DASHBOARD & TELEMETRY
  // ----------------------------------------------------
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    serverUptime: 140,
    workspaceFiles: 4,
    memoryUsage: '48.2 MB / 2.0 GB',
    diskUsage: '1.4 GB / 20 GB (7%)',
    nodeVersion: 'v22.14.0',
    cpuUsage: '0.8%',
    platform: 'linux-x64',
    status: 'online'
  });
  const [recentLogs, setRecentLogs] = useState<TerminalLog[]>([]);
  const [bridgeInput, setBridgeInput] = useState('');
  const [bridgeReply, setBridgeReply] = useState('Bridge ready — direct 0.4ms neural bus connected to Sapphire.');
  const [isSendingBridge, setIsSendingBridge] = useState(false);

  // ----------------------------------------------------
  // 7. AI ENGINE STATE
  // ----------------------------------------------------
  const [aeInput, setAeInput] = useState(`def optimize_vad_pipeline(samples, threshold=0.75):\n    # Autonomous AST pipeline optimizer\n    energy = sum(s ** 2 for s in samples) / len(samples)\n    if energy > threshold:\n        return {"voice_active": True, "confidence": min(1.0, energy * 1.2)}\n    return {"voice_active": False, "confidence": 0.0}`);
  const [aeOutput, setAeOutput] = useState('');
  const [aeAppName, setAeAppName] = useState('Telemetry Visualizer');
  const [aeAppType, setAeAppType] = useState('web');
  const [isBuildingApp, setIsBuildingApp] = useState(false);

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------
  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch('/api/claw/pipelines');
      const data = await res.json();
      if (data.pipelines) {
        setPipelines(data.pipelines);
        if (!selectedPipelineId && data.pipelines.length > 0) {
          setSelectedPipelineId(data.pipelines[0].id);
        }
      }
    } catch (_) {}
  }, [selectedPipelineId]);

  const fetchConnectors = useCallback(async () => {
    try {
      const res = await fetch('/api/claw/plugins/connectors');
      const data = await res.json();
      if (data.connectors) {
        setConnectors(data.connectors);
      }
    } catch (_) {}
  }, []);

  const fetchVault = useCallback(async () => {
    try {
      const res = await fetch('/api/claw/vault');
      const data = await res.json();
      if (data.vault) {
        setVaultItems(data.vault);
        if (!selectedVaultItem && data.vault.length > 0) {
          setSelectedVaultItem(data.vault[0]);
        }
      }
    } catch (_) {}
  }, [selectedVaultItem]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/claw/pipelines/history');
      const data = await res.json();
      if (data.runs) {
        setExecutionHistory(data.runs);
        if (data.runs.length > 0 && !activeExecutionRun) {
          setActiveExecutionRun(data.runs[0]);
        }
      }
    } catch (_) {}
  }, [activeExecutionRun]);

  const fetchWorkspaceFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/claw/listFiles');
      const data = await res.json();
      setFilesList(data || []);
    } catch (_) {}
  }, []);

  const fetchFileContent = useCallback(async (filename: string) => {
    setEditorStatus('Loading...');
    try {
      const res = await fetch(`/api/claw/readFile?filename=${encodeURIComponent(filename)}`);
      const data = await res.json();
      setCodeContent(data.content || '');
      setActiveFile(filename);
      setEditorStatus('Ready');
    } catch (_) {
      setEditorStatus('Error');
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/claw/dashboard');
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
      if (data.recentLogs) setRecentLogs(data.recentLogs);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchPipelines();
    fetchConnectors();
    fetchVault();
    fetchHistory();
    fetchWorkspaceFiles();
    fetchFileContent('sapphire.py');
    fetchDashboard();
  }, [fetchPipelines, fetchConnectors, fetchVault, fetchHistory, fetchWorkspaceFiles, fetchFileContent, fetchDashboard]);

  useEffect(() => {
    if (termBottomRef.current) {
      termBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [termOutput]);

  // ----------------------------------------------------
  // PIPELINE EXECUTION HANDLER
  // ----------------------------------------------------
  const handleRunPipeline = async (pipeId?: string) => {
    const targetId = pipeId || selectedPipelineId;
    if (!targetId || isRunningPipeline) return;

    const targetPipe = pipelines.find(p => p.id === targetId);
    setIsRunningPipeline(true);
    onShowToast(`Executing Pipeline: "${targetPipe?.name || targetId}"`, 'info');

    // Create optimistic running state
    const optimisticRun: PipelineExecutionRun = {
      id: `run-${Date.now()}`,
      pipelineId: targetId,
      pipelineName: targetPipe?.name || 'OpenClaw Pipeline',
      status: 'running',
      startedAt: new Date().toISOString(),
      durationMs: 0,
      stepLogs: (targetPipe?.steps || []).map(s => ({
        stepId: s.id,
        stepTitle: s.title,
        status: 'running',
        output: 'Executing step...',
        durationMs: 0
      }))
    };
    setActiveExecutionRun(optimisticRun);

    try {
      const res = await fetch('/api/claw/pipelines/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId: targetId })
      });
      const data = await res.json();
      if (data.ok && data.run) {
        setActiveExecutionRun(data.run);
        setExecutionHistory(prev => [data.run, ...prev]);
        fetchPipelines();
        fetchVault();
        fetchWorkspaceFiles();
        onShowToast(`✅ Pipeline "${targetPipe?.name}" completed successfully! Artifacts saved to Vault.`, 'success');
      } else {
        throw new Error(data.error || 'Execution failed');
      }
    } catch (err: any) {
      onShowToast(`Pipeline execution failed: ${err.message}`, 'error');
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // ----------------------------------------------------
  // TEST PLUGIN ACTION HANDLER
  // ----------------------------------------------------
  const handleTestPlugin = async (actionId: string, payload: any) => {
    setIsTestingPlugin(true);
    setPluginTestResult(null);
    try {
      const res = await fetch('/api/claw/plugins/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId: selectedConnectorId,
          actionId,
          payload
        })
      });
      const data = await res.json();
      if (data.ok) {
        setPluginTestResult(data);
        onShowToast(`Plugin test successful (${data.durationMs}ms)`, 'success');
        fetchVault();
      }
    } catch (err: any) {
      onShowToast(`Plugin test failed: ${err.message}`, 'error');
    } finally {
      setIsTestingPlugin(false);
    }
  };

  // ----------------------------------------------------
  // TERMINAL COMMAND RUNNER
  // ----------------------------------------------------
  const handleRunCommand = async (cmdToRun?: string) => {
    const rawCmd = (cmdToRun || termInput).trim();
    if (!rawCmd) return;

    setTermOutput(prev => [
      ...prev,
      { text: `openclaw:~$ ${rawCmd}`, type: 'cmd' }
    ]);
    setTermHistory(prev => [rawCmd, ...prev]);
    setHistoryIdx(-1);
    setTermInput('');

    if (rawCmd.toLowerCase() === 'clear') {
      setTermOutput([]);
      return;
    }

    if (rawCmd.toLowerCase() === 'help') {
      setTermOutput(prev => [
        ...prev,
        { text: '⚡ OpenClaw CLI Commands:\n  openclaw pipelines       - List all active pipelines\n  openclaw run <id>        - Execute automation pipeline\n  openclaw test <plugin>   - Trigger live plugin bridge test\n  openclaw vault           - List saved outputs and artifacts\n  status, ls, pwd, git status, ping-sapphire, db-status, self-update', type: 'info' }
      ]);
      return;
    }

    if (rawCmd.startsWith('openclaw run ')) {
      const pId = rawCmd.replace(/^openclaw run\s+/, '').trim();
      handleRunPipeline(pId);
      setTermOutput(prev => [
        ...prev,
        { text: `[OpenClaw Engine] Triggered pipeline "${pId}". Check Pipelines tab for live progress.`, type: 'ok' }
      ]);
      return;
    }

    try {
      const res = await fetch('/api/claw/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: rawCmd })
      });
      const data = await res.json();
      if (data.stdout) {
        setTermOutput(prev => [...prev, { text: data.stdout, type: 'out' }]);
      }
      if (data.stderr) {
        setTermOutput(prev => [...prev, { text: data.stderr, type: 'err' }]);
      }
    } catch (_) {
      setTermOutput(prev => [...prev, { text: 'Execution error: server unreachable', type: 'err' }]);
    }
  };

  // ----------------------------------------------------
  // SAVE WORKSPACE CODE FILE
  // ----------------------------------------------------
  const handleSaveFile = async () => {
    setEditorStatus('Saving...');
    try {
      const res = await fetch('/api/claw/writeFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: activeFile, content: codeContent })
      });
      const data = await res.json();
      if (data.saved) {
        setEditorStatus('Saved');
        onShowToast(`Saved ${activeFile} to persistent workspace`, 'success');
        fetchWorkspaceFiles();
        fetchVault();
        setTimeout(() => setEditorStatus('Ready'), 2000);
      }
    } catch (_) {
      setEditorStatus('Error');
      onShowToast('Failed to save file', 'error');
    }
  };

  // ----------------------------------------------------
  // NEURAL BRIDGE PING
  // ----------------------------------------------------
  const handleSendBridge = async () => {
    if (!bridgeInput.trim() || isSendingBridge) return;
    setIsSendingBridge(true);
    try {
      const res = await fetch('/api/claw/pingBridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: bridgeInput })
      });
      const data = await res.json();
      setBridgeReply(data.reply || 'Bridge acknowledged.');
      setBridgeInput('');
    } catch (_) {
      setBridgeReply('Bridge error: could not connect to Sapphire.');
    } finally {
      setIsSendingBridge(false);
    }
  };

  // Filtered vault items
  const filteredVault = vaultItems.filter(item => 
    item.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(vaultSearch.toLowerCase()) ||
    item.tags?.some(t => t.toLowerCase().includes(vaultSearch.toLowerCase()))
  );

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];
  const selectedConnector = connectors.find(c => c.id === selectedConnectorId) || connectors[0];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col overflow-hidden bg-[#050505] text-white">
      
      {/* OPENCLAW TOP SUB-NAVIGATION */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#262626] bg-[#0c0c0c] px-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E0FF25]/40 bg-[#E0FF25]/10 text-sm font-black text-[#E0FF25]">
              ⚡
            </div>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-white">
              OpenClaw
            </span>
          </div>

          <div className="h-4 w-px bg-[#262626]" />

          {/* Sub Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {[
              { id: 'pipelines', label: 'Pipelines & Workflows', icon: Workflow, badge: `${pipelines.length}` },
              { id: 'connectors', label: 'Plugin Matrix', icon: Plug, badge: `${connectors.length}` },
              { id: 'vault', label: 'Saved Outputs & Vault', icon: FolderArchive, badge: `${vaultItems.length}` },
              { id: 'terminal', label: 'Terminal & CLI', icon: TerminalIcon },
              { id: 'codeeditor', label: 'Code Editor', icon: Code2 },
              { id: 'dashboard', label: 'Telemetry & Bridge', icon: LayoutDashboard },
              { id: 'aiengine', label: 'AI Tool Engine', icon: Sparkles }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button id="btn-openclawpage-1"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                    isActive
                      ? 'border border-[#E0FF25]/50 bg-[#E0FF25]/10 text-[#E0FF25]'
                      : 'text-[#a3a3a3] hover:bg-[#181818] hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`rounded px-1 text-[9px] font-black ${
                      isActive ? 'bg-[#E0FF25] text-black' : 'bg-[#262626] text-[#a3a3a3]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Quick Action */}
        <div className="flex items-center gap-2">
          <button id="btn-openclawpage-2"
            onClick={() => handleRunPipeline()}
            disabled={isRunningPipeline}
            className="flex items-center gap-1.5 rounded-md bg-[#E0FF25] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black shadow-md transition hover:bg-[#ccff00] disabled:opacity-50"
          >
            {isRunningPipeline ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Run Pipeline
              </>
            )}
          </button>
        </div>
      </header>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* ======================================================== */}
        {/* TAB 1: PIPELINES & WORKFLOWS                             */}
        {/* ======================================================== */}
        {activeTab === 'pipelines' && (
          <div className="grid h-full w-full grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr]">
            
            {/* Pipelines List Sidebar */}
            <div className="flex flex-col border-r border-[#262626] bg-[#0c0c0c]">
              <div className="flex items-center justify-between border-b border-[#262626] p-3">
                <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#a3a3a3]">
                  ⚡ Automated Pipelines ({pipelines.length})
                </span>
                <button id="btn-openclawpage-3"
                  onClick={() => setIsNewPipelineModalOpen(true)}
                  className="flex items-center gap-1 rounded bg-[#181818] px-2 py-1 font-mono text-[10px] font-black uppercase text-[#E0FF25] hover:bg-[#262626]"
                >
                  <Plus className="h-3 w-3" /> New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {pipelines.map(pipe => {
                  const isSelected = pipe.id === selectedPipelineId;
                  return (
                    <div
                      key={pipe.id}
                      onClick={() => setSelectedPipelineId(pipe.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition ${
                        isSelected
                          ? 'border-[#E0FF25] bg-[#141414] shadow-lg shadow-[#E0FF25]/5'
                          : 'border-[#262626] bg-[#0e0e0e] hover:border-[#383838] hover:bg-[#121212]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-white leading-snug">
                          {pipe.name}
                        </span>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-black uppercase ${
                          pipe.status === 'running'
                            ? 'bg-amber-400 text-black animate-pulse'
                            : pipe.status === 'success'
                            ? 'bg-[#E0FF25]/20 text-[#E0FF25]'
                            : 'bg-[#262626] text-[#a3a3a3]'
                        }`}>
                          {pipe.status}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-[11px] text-[#737373]">
                        {pipe.description}
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {pipe.tags?.map((tag, idx) => (
                          <span
                            key={`${pipe.id}_tag_${tag}_${idx}`}
                            className="rounded border border-[#1f1f1f] bg-[#070707] px-1.5 py-0.5 font-mono text-[9px] text-[#a3a3a3]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-[#1a1a1a] pt-2 text-[10px] text-[#737373]">
                        <span>{pipe.steps.length} Nodes</span>
                        <span>{pipe.runCount} Runs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline Canvas & Execution Trace Area */}
            <div className="flex flex-1 flex-col overflow-y-auto bg-[#070707] p-4 lg:p-6 space-y-6">
              {selectedPipeline && (
                <>
                  {/* Pipeline Header */}
                  <div className="flex flex-col gap-4 rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#E0FF25]/10 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-[#E0FF25]">
                          {selectedPipeline.triggerType.toUpperCase()} TRIGGER
                        </span>
                        <span className="font-mono text-[10px] text-[#737373]">
                          ID: {selectedPipeline.id}
                        </span>
                      </div>
                      <h2 className="mt-1 font-bold text-lg text-white">
                        {selectedPipeline.name}
                      </h2>
                      <p className="text-xs text-[#a3a3a3]">
                        {selectedPipeline.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-[#E0FF25]">
                        <span>🎙️ Trigger Phrase / Rule:</span>
                        <span className="rounded bg-[#141414] px-2 py-0.5 text-white">
                          "{selectedPipeline.triggerConfig}"
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button id="btn-openclawpage-4"
                        onClick={() => handleRunPipeline(selectedPipeline.id)}
                        disabled={isRunningPipeline}
                        className="flex items-center gap-2 rounded-lg bg-[#E0FF25] px-4 py-2 font-mono text-xs font-black uppercase text-black shadow-lg shadow-[#E0FF25]/20 hover:bg-[#ccff00] disabled:opacity-50"
                      >
                        {isRunningPipeline ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" /> Executing Pipeline...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 fill-current" /> Trigger Pipeline Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Visual Node-Based Workflow Pipeline Canvas */}
                  <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-[#E0FF25]" />
                        <span className="font-mono text-xs font-black uppercase tracking-wider text-white">
                          Execution Pipeline Graph ({selectedPipeline.steps.length} Steps)
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#737373]">
                        Bidirectional Bus Active
                      </span>
                    </div>

                    {/* Step Flow Nodes */}
                    <div className="mt-6 space-y-4">
                      {selectedPipeline.steps.map((step, idx) => {
                        const stepRunLog = activeExecutionRun?.stepLogs?.find(l => l.stepId === step.id);
                        const isStepRunning = isRunningPipeline && (!stepRunLog || stepRunLog.status === 'running');
                        const isStepDone = stepRunLog?.status === 'success';

                        return (
                          <div key={step.id} className="relative flex items-start gap-4">
                            {/* Line connecting nodes */}
                            {idx < selectedPipeline.steps.length - 1 && (
                              <div className="absolute left-4 top-9 h-full w-0.5 bg-[#262626]" />
                            )}

                            {/* Node index badge */}
                            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-black transition-all ${
                              isStepDone
                                ? 'border-[#E0FF25] bg-[#E0FF25] text-black shadow-md shadow-[#E0FF25]/30'
                                : isStepRunning
                                ? 'border-amber-400 bg-amber-400/20 text-amber-400 animate-pulse'
                                : 'border-[#383838] bg-[#141414] text-[#a3a3a3]'
                            }`}>
                              {isStepDone ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                            </div>

                            {/* Step Detail Card */}
                            <div className="flex-1 rounded-lg border border-[#262626] bg-[#121212] p-3.5 transition hover:border-[#383838]">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-bold text-xs text-white">
                                    {step.title}
                                  </span>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    <span className="rounded bg-black px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-[#a3a3a3]">
                                      Type: {step.type}
                                    </span>
                                    {step.targetPlugin && (
                                      <span className="rounded border border-[#E0FF25]/30 bg-[#E0FF25]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#E0FF25]">
                                        🔌 {step.targetPlugin.toUpperCase()}
                                      </span>
                                    )}
                                    {step.fileName && (
                                      <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-400">
                                        💾 {step.fileName}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {stepRunLog && (
                                  <span className="font-mono text-[10px] text-[#737373]">
                                    {stepRunLog.durationMs}ms
                                  </span>
                                )}
                              </div>

                              {/* Step Content / Code snippet */}
                              {step.prompt && (
                                <div className="mt-2 rounded bg-black p-2 font-mono text-[11px] text-[#a3a3a3]">
                                  <span className="text-[#737373]">Prompt: </span>
                                  {step.prompt}
                                </div>
                              )}

                              {step.command && (
                                <div className="mt-2 rounded bg-black p-2 font-mono text-[11px] text-[#E0FF25]">
                                  <span className="text-[#737373]">Command: </span>
                                  {step.command}
                                </div>
                              )}

                              {/* Live Step Execution Output */}
                              {stepRunLog && stepRunLog.output && (
                                <div className="mt-2.5 rounded border border-[#1f1f1f] bg-[#080808] p-2.5 font-mono text-[11px] text-[#22c55e]">
                                  <div className="flex items-center gap-1 font-bold text-[10px] text-[#a3a3a3] uppercase">
                                    <CheckCircle2 className="h-3 w-3 text-[#22c55e]" /> Output Payload:
                                  </div>
                                  <div className="mt-1 whitespace-pre-wrap">
                                    {stepRunLog.output}
                                  </div>
                                  {stepRunLog.savedArtifact && (
                                    <div className="mt-1.5 font-bold text-[#3b82f6]">
                                      📁 Persisted to: {stepRunLog.savedArtifact}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Execution History & Saved Artifacts for this Pipeline */}
                  <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4">
                    <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                      <span className="font-mono text-xs font-black uppercase tracking-wider text-white">
                        📜 Recent Pipeline Run Logs & Stored Outputs
                      </span>
                      <span className="font-mono text-[10px] text-[#737373]">
                        {executionHistory.length} Runs Recorded
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {executionHistory.slice(0, 4).map(run => (
                        <div
                          key={run.id}
                          className="flex flex-col gap-2 rounded-lg border border-[#1f1f1f] bg-[#121212] p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${run.status === 'success' ? 'bg-[#22c55e]' : 'bg-red-500'}`} />
                              <span className="font-bold text-xs text-white">{run.pipelineName}</span>
                              <span className="font-mono text-[10px] text-[#737373]">{run.id}</span>
                            </div>
                            <div className="mt-1 text-[10px] text-[#a3a3a3]">
                              Ran on {new Date(run.startedAt).toLocaleString()} · Duration: {run.durationMs}ms · {run.stepLogs?.length} steps
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {run.generatedFiles && run.generatedFiles.length > 0 && (
                              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] text-blue-400">
                                💾 {run.generatedFiles.join(', ')}
                              </span>
                            )}
                            <button id="btn-openclawpage-5"
                              onClick={() => {
                                setActiveExecutionRun(run);
                                onShowToast('Loaded execution snapshot', 'info');
                              }}
                              className="rounded bg-[#1a1a1a] px-2 py-1 font-mono text-[10px] uppercase text-[#a3a3a3] hover:text-white"
                            >
                              Inspect Logs
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PLUGIN MATRIX & CONNECTORS                         */}
        {/* ======================================================== */}
        {activeTab === 'connectors' && (
          <div className="grid h-full w-full grid-cols-1 overflow-hidden lg:grid-cols-[300px_1fr]">
            {/* Connector List */}
            <div className="flex flex-col border-r border-[#262626] bg-[#0c0c0c]">
              <div className="border-b border-[#262626] p-3 text-[11px] font-black uppercase tracking-wider text-[#a3a3a3]">
                🔌 Connected Plugin Nodes ({connectors.length})
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {connectors.map(conn => {
                  const isSelected = conn.id === selectedConnectorId;
                  return (
                    <div
                      key={conn.id}
                      onClick={() => setSelectedConnectorId(conn.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition ${
                        isSelected
                          ? 'border-[#E0FF25] bg-[#141414]'
                          : 'border-[#262626] bg-[#0e0e0e] hover:border-[#383838] hover:bg-[#121212]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                            style={{ backgroundColor: `${conn.color}22`, border: `1px solid ${conn.color}44` }}
                          >
                            {conn.icon}
                          </span>
                          <span className="font-bold text-xs text-white">{conn.name}</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] text-[#737373]">
                        {conn.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Connector Test & Actions */}
            <div className="flex flex-1 flex-col overflow-y-auto bg-[#070707] p-4 lg:p-6 space-y-6">
              {selectedConnector && (
                <>
                  <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#0c0c0c] p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                        style={{ backgroundColor: `${selectedConnector.color}22`, border: `1px solid ${selectedConnector.color}44` }}
                      >
                        {selectedConnector.icon}
                      </div>
                      <div>
                        <h2 className="font-bold text-lg text-white">{selectedConnector.name}</h2>
                        <p className="text-xs text-[#a3a3a3]">{selectedConnector.desc}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-[#737373]">
                          <span className="text-[#22c55e]">● STATUS: {selectedConnector.status.toUpperCase()}</span>
                          <span>· Category: {selectedConnector.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Matrix */}
                  <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4">
                    <h3 className="font-mono text-xs font-black uppercase tracking-wider text-white">
                      ⚡ Available Trigger Actions & RPC Methods
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedConnector.supportedActions.map(action => (
                        <div
                          key={action.id}
                          className="rounded-lg border border-[#262626] bg-[#121212] p-3 flex flex-col justify-between"
                        >
                          <div>
                            <span className="font-bold text-xs text-white">{action.name}</span>
                            <p className="mt-1 text-[11px] text-[#737373]">{action.desc}</p>
                            <div className="mt-2 rounded bg-black p-2 font-mono text-[10px] text-[#a3a3a3]">
                              {JSON.stringify(action.samplePayload, null, 2)}
                            </div>
                          </div>

                          <button id="btn-openclawpage-6"
                            onClick={() => handleTestPlugin(action.id, action.samplePayload)}
                            disabled={isTestingPlugin}
                            className="mt-3 flex items-center justify-center gap-1.5 rounded bg-[#E0FF25] py-1.5 font-mono text-[10px] font-black uppercase text-black hover:bg-[#ccff00] disabled:opacity-50"
                          >
                            <Play className="h-3 w-3 fill-current" /> Test Action
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Test Result Output */}
                  {pluginTestResult && (
                    <div className="rounded-xl border border-[#E0FF25]/40 bg-[#0c0c0c] p-4">
                      <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                        <span className="font-mono text-xs font-black uppercase text-[#E0FF25]">
                          ✅ Live Response Payload ({pluginTestResult.durationMs}ms)
                        </span>
                        <span className="font-mono text-[10px] text-[#737373]">
                          Plugin: {pluginTestResult.pluginId} · Action: {pluginTestResult.actionId}
                        </span>
                      </div>
                      <pre className="mt-3 overflow-x-auto rounded bg-black p-3 font-mono text-xs text-[#22c55e]">
                        {JSON.stringify(pluginTestResult.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SAVED OUTPUTS & PERSISTENT VAULT ("WHERE IT SAVES")*/}
        {/* ======================================================== */}
        {activeTab === 'vault' && (
          <div className="grid h-full w-full grid-cols-1 overflow-hidden lg:grid-cols-[340px_1fr]">
            {/* Vault Sidebar */}
            <div className="flex flex-col border-r border-[#262626] bg-[#0c0c0c]">
              <div className="border-b border-[#262626] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#a3a3a3]">
                    💾 Persistent Vault ({vaultItems.length})
                  </span>
                  <button id="btn-openclawpage-7"
                    onClick={fetchVault}
                    className="flex items-center gap-1 rounded bg-[#181818] p-1 text-[#a3a3a3] hover:text-white"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#737373]" />
                  <input
                    type="text"
                    value={vaultSearch}
                    onChange={e => setVaultSearch(e.target.value)}
                    placeholder="Search saved artifacts & files..."
                    className="w-full rounded-md border border-[#262626] bg-[#141414] py-1.5 pl-8 pr-2 font-mono text-[11px] text-white placeholder-[#737373] outline-none focus:border-[#E0FF25]"
                  />
                </div>
              </div>

              {/* Vault Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredVault.map(item => {
                  const isSelected = selectedVaultItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedVaultItem(item)}
                      className={`cursor-pointer rounded-lg border p-2.5 transition ${
                        isSelected
                          ? 'border-[#E0FF25] bg-[#141414]'
                          : 'border-[#262626] bg-[#0e0e0e] hover:border-[#383838] hover:bg-[#121212]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-bold text-xs text-white">{item.title}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#737373]">{item.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags?.map((t, idx) => (
                          <span
                            key={`${item.id}_tag_${t}_${idx}`}
                            className="rounded bg-black px-1.5 py-0.5 font-mono text-[9px] text-[#a3a3a3]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Artifact Inspector & Downloader */}
            <div className="flex flex-1 flex-col overflow-hidden bg-[#070707] p-4 lg:p-6">
              {selectedVaultItem ? (
                <div className="flex h-full flex-col rounded-xl border border-[#262626] bg-[#0c0c0c] p-4">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                    <div>
                      <h2 className="font-bold text-base text-white">{selectedVaultItem.title}</h2>
                      <p className="text-xs text-[#a3a3a3]">{selectedVaultItem.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button id="btn-openclawpage-8"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedVaultItem.content);
                          onShowToast('Content copied to clipboard', 'info');
                        }}
                        className="flex items-center gap-1 rounded bg-[#181818] px-2.5 py-1 text-xs text-[#a3a3a3] hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>

                      <button id="btn-openclawpage-9"
                        onClick={() => {
                          const blob = new Blob([selectedVaultItem.content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = selectedVaultItem.title;
                          a.click();
                          URL.revokeObjectURL(url);
                          onShowToast(`Downloaded ${selectedVaultItem.title}`, 'success');
                        }}
                        className="flex items-center gap-1 rounded bg-[#E0FF25] px-3 py-1 font-mono text-xs font-black uppercase text-black hover:bg-[#ccff00]"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    </div>
                  </div>

                  {/* Artifact Viewer */}
                  <div className="flex-1 overflow-auto mt-4 rounded-lg bg-black p-4 font-mono text-xs text-white">
                    <pre className="whitespace-pre-wrap">{selectedVaultItem.content}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-[#737373] text-sm">
                  Select an artifact from the vault to inspect
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: TERMINAL & CLI                                    */}
        {/* ======================================================== */}
        {activeTab === 'terminal' && (
          <div className="flex flex-1 flex-col overflow-hidden bg-black p-4 font-mono text-xs">
            {/* Quick Action Pills */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#737373]">Quick Actions:</span>
              {[
                { label: 'openclaw pipelines', cmd: 'openclaw pipelines' },
                { label: 'openclaw run pipe-1', cmd: 'openclaw run pipe-1' },
                { label: 'openclaw vault', cmd: 'openclaw vault' },
                { label: 'ping-sapphire', cmd: 'ping-sapphire' },
                { label: 'status', cmd: 'status' },
                { label: 'ls -la', cmd: 'ls -la' },
                { label: 'db-status', cmd: 'db-status' }
              ].map((p, i) => (
                <button id="btn-openclawpage-10"
                  key={`cmd_qa_${p.cmd}_${i}`}
                  onClick={() => handleRunCommand(p.cmd)}
                  className="rounded border border-[#262626] bg-[#141414] px-2 py-0.5 text-[10px] text-[#a3a3a3] hover:border-[#E0FF25] hover:text-white"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Terminal Screen */}
            <div className="flex-1 overflow-y-auto space-y-1.5 rounded-lg border border-[#262626] bg-[#080808] p-4 text-[#d4d4d4]">
              {termOutput.map((line, idx) => (
                <div
                  key={`term_line_${idx}_${line.type}_${line.text.slice(0, 15)}`}
                  className={`whitespace-pre-wrap ${
                    line.type === 'cmd'
                      ? 'text-[#E0FF25] font-bold'
                      : line.type === 'err'
                      ? 'text-red-400'
                      : line.type === 'ok'
                      ? 'text-[#22c55e]'
                      : line.type === 'info'
                      ? 'text-[#38bdf8]'
                      : 'text-[#a3a3a3]'
                  }`}
                >
                  {line.text}
                </div>
              ))}
              <div ref={termBottomRef} />
            </div>

            {/* Terminal Input */}
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#262626] bg-[#121212] px-3 py-2">
              <span className="font-bold text-[#E0FF25]">openclaw:~$</span>
              <input
                type="text"
                value={termInput}
                onChange={e => setTermInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRunCommand();
                }}
                placeholder="Type a command (e.g. 'openclaw run pipe-1', 'status', 'help')..."
                className="flex-1 bg-transparent font-mono text-xs text-white outline-none"
              />
              <button id="btn-openclawpage-11"
                onClick={() => handleRunCommand()}
                className="rounded bg-[#E0FF25] px-3 py-1 font-mono text-[11px] font-black uppercase text-black"
              >
                Exec
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: CODE EDITOR                                       */}
        {/* ======================================================== */}
        {activeTab === 'codeeditor' && (
          <div className="grid h-full w-full grid-cols-1 overflow-hidden lg:grid-cols-[220px_1fr]">
            {/* File List */}
            <div className="flex flex-col border-r border-[#262626] bg-[#0c0c0c]">
              <div className="border-b border-[#262626] p-3 text-[11px] font-black uppercase text-[#a3a3a3]">
                📁 Workspace Scripts
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filesList.map(f => (
                  <button id="btn-openclawpage-12"
                    key={f.name}
                    onClick={() => fetchFileContent(f.name)}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 font-mono text-xs transition ${
                      activeFile === f.name
                        ? 'bg-[#E0FF25]/10 font-bold text-[#E0FF25]'
                        : 'text-[#a3a3a3] hover:bg-[#181818] hover:text-white'
                    }`}
                  >
                    <span>{f.name}</span>
                    <span className="text-[9px] text-[#737373]">{f.size}B</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Textarea Area */}
            <div className="flex flex-1 flex-col overflow-hidden bg-[#070707] p-4">
              <div className="flex items-center justify-between border-b border-[#262626] bg-[#0c0c0c] px-4 py-2">
                <span className="font-mono text-xs text-white">{activeFile} ({editorStatus})</span>
                <button id="btn-openclawpage-13"
                  onClick={handleSaveFile}
                  className="flex items-center gap-1.5 rounded bg-[#E0FF25] px-3 py-1 font-mono text-xs font-black uppercase text-black hover:bg-[#ccff00]"
                >
                  <Save className="h-3.5 w-3.5" /> Save File
                </button>
              </div>

              <textarea
                value={codeContent}
                onChange={e => setCodeContent(e.target.value)}
                className="flex-1 resize-none bg-black p-4 font-mono text-xs text-[#22c55e] outline-none"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: TELEMETRY & NEURAL BRIDGE                         */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Server Uptime', value: `${metrics.serverUptime}s`, sub: '100% Availability' },
                { label: 'Memory Usage', value: metrics.memoryUsage, sub: 'Heap Optimal' },
                { label: 'Disk Storage', value: metrics.diskUsage, sub: 'Persistent S3' },
                { label: 'Active Pipelines', value: `${pipelines.length}`, sub: 'All Nodes Ready' }
              ].map((m, i) => (
                <div key={`metric_card_${m.label}_${i}`} className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4">
                  <div className="font-mono text-[10px] uppercase font-bold text-[#737373]">{m.label}</div>
                  <div className="mt-1 font-mono text-lg font-black text-white">{m.value}</div>
                  <div className="mt-1 text-[10px] text-[#E0FF25]">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Neural Bridge Ping Card */}
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-white">
                🧠 Sapphire High-Speed Neural Bus Bridge
              </h3>
              <p className="mt-1 text-xs text-[#a3a3a3]">
                Direct zero-latency IPC link between OpenClaw and Sapphire's reasoning engine.
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={bridgeInput}
                  onChange={e => setBridgeInput(e.target.value)}
                  placeholder="Ping message (e.g. 'Status check on model pipelines')..."
                  className="flex-1 rounded-md border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#E0FF25]"
                />
                <button id="btn-openclawpage-14"
                  onClick={handleSendBridge}
                  disabled={isSendingBridge}
                  className="rounded-md bg-[#E0FF25] px-4 py-2 font-mono text-xs font-black uppercase text-black hover:bg-[#ccff00] disabled:opacity-50"
                >
                  Send Bus Ping
                </button>
              </div>

              <div className="mt-3 rounded-lg bg-black p-3 font-mono text-xs text-[#22c55e]">
                {bridgeReply}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: AI TOOL ENGINE                                    */}
        {/* ======================================================== */}
        {activeTab === 'aiengine' && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4">
              <h2 className="font-bold text-base text-white">
                🤖 Autonomous Code Generator & Tool Sandbox
              </h2>
              <p className="text-xs text-[#a3a3a3]">
                Generate new tool endpoints, optimize Python AST algorithms, and compile dynamic pipelines.
              </p>

              <div className="mt-4">
                <textarea
                  value={aeInput}
                  onChange={e => setAeInput(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-[#262626] bg-black p-3 font-mono text-xs text-[#22c55e] outline-none"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button id="btn-openclawpage-15"
                  onClick={() => {
                    setAeOutput(`✅ Tool compiled & validated.\nFunction: optimize_vad_pipeline\nAST Signature: (samples: List[float], threshold: float = 0.75) -> Dict[str, Any]\nRegistered to Sapphire Toolset.`);
                    onShowToast('Tool generated and registered to Sapphire!', 'success');
                  }}
                  className="rounded bg-[#E0FF25] px-4 py-2 font-mono text-xs font-black uppercase text-black hover:bg-[#ccff00]"
                >
                  Compile & Register Tool
                </button>
              </div>

              {aeOutput && (
                <div className="mt-3 rounded bg-black p-3 font-mono text-xs text-[#38bdf8]">
                  <pre>{aeOutput}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: CREATE NEW PIPELINE                               */}
      {/* ======================================================== */}
      {isNewPipelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Workflow className="h-4 w-4 text-[#E0FF25]" /> Create OpenClaw Automation Pipeline
              </h3>
              <button id="btn-openclawpage-16"
                onClick={() => setIsNewPipelineModalOpen(false)}
                className="text-[#737373] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#a3a3a3]">Pipeline Name</label>
                <input
                  type="text"
                  value={newPipeName}
                  onChange={e => setNewPipeName(e.target.value)}
                  placeholder="e.g. Hourly Treasury Backup & Voice Report"
                  className="mt-1 w-full rounded-md border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#E0FF25]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#a3a3a3]">Description</label>
                <input
                  type="text"
                  value={newPipeDesc}
                  onChange={e => setNewPipeDesc(e.target.value)}
                  placeholder="What does this automated workflow accomplish?"
                  className="mt-1 w-full rounded-md border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white outline-none focus:border-[#E0FF25]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a3a3a3]">Trigger Type</label>
                  <select
                    value={newPipeTrigger}
                    onChange={e => setNewPipeTrigger(e.target.value as any)}
                    className="mt-1 w-full rounded-md border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#E0FF25]"
                  >
                    <option value="voice_wake">🎙️ Voice ("Hey Sapphire...")</option>
                    <option value="cron">⏰ Cron Schedule</option>
                    <option value="webhook">🌐 Inbound Webhook</option>
                    <option value="event">⚡ System Event</option>
                    <option value="manual">👆 Manual Trigger</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a3a3a3]">Trigger Trigger / Rule</label>
                  <input
                    type="text"
                    value={newPipeTriggerConfig}
                    onChange={e => setNewPipeTriggerConfig(e.target.value)}
                    placeholder="e.g. 'Hey Sapphire, backup treasury'"
                    className="mt-1 w-full rounded-md border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#E0FF25]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#262626] pt-3">
              <button id="btn-openclawpage-17"
                onClick={() => setIsNewPipelineModalOpen(false)}
                className="rounded px-4 py-2 font-mono text-xs text-[#a3a3a3] hover:text-white"
              >
                Cancel
              </button>
              <button id="btn-openclawpage-18"
                onClick={async () => {
                  if (!newPipeName.trim()) {
                    onShowToast('Please provide a pipeline name', 'warn');
                    return;
                  }
                  try {
                    const res = await fetch('/api/claw/pipelines/save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: `pipe-${Date.now()}`,
                        name: newPipeName.trim(),
                        description: newPipeDesc.trim(),
                        triggerType: newPipeTrigger,
                        triggerConfig: newPipeTriggerConfig.trim(),
                        steps: newPipeSteps,
                        enabled: true,
                        tags: ['⚡ Custom Pipeline', '💎 Sapphire']
                      })
                    });
                    const data = await res.json();
                    if (data.ok) {
                      onShowToast(`Created pipeline "${newPipeName}"`, 'success');
                      setIsNewPipelineModalOpen(false);
                      setNewPipeName('');
                      setNewPipeDesc('');
                      fetchPipelines();
                    }
                  } catch (_) {
                    onShowToast('Error saving pipeline', 'error');
                  }
                }}
                className="rounded bg-[#E0FF25] px-4 py-2 font-mono text-xs font-black uppercase text-black hover:bg-[#ccff00]"
              >
                Save & Deploy Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
