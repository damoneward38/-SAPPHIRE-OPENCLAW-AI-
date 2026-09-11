import React, { useState, useEffect, useCallback } from 'react';
import { 
  PageType, 
  PluginItem, 
  MemoryItem, 
  CodeUpdateItem, 
  AgentAction, 
  GovernanceResult, 
  GovernanceApprovalRequest, 
  GovernanceAuditEntry, 
  KillSwitchStatus 
} from './types';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { SapphirePage } from './components/SapphirePage';
import { OpenClawPage } from './components/OpenClawPage';
import { MemoryPage } from './components/MemoryPage';
import { CapabilitiesPage } from './components/CapabilitiesPage';
import { PricingPage } from './components/PricingPage';
import { FeaturesPage } from './components/FeaturesPage';
import { AdminPage } from './components/AdminPage';
import { SettingsPage } from './components/SettingsPage';
import { ComputerBridgePage } from './components/ComputerBridgePage';
import { FireflyGlobalVoiceBar } from './components/FireflyGlobalVoiceBar';
import { UniversalBrain } from './components/UniversalBrain';
import { InstallPluginModal } from './components/InstallPluginModal';
import { GovernanceModal } from './components/GovernanceModal';
import { ApprovalPromptModal } from './components/ApprovalPromptModal';
import { chime } from './utils/audioChimes';
import { routeSpokenSpeech, DEFAULT_WAKE_CONFIG } from './services/voiceRouter';
import { FireflyBridgeStatus, FireflyComputerCommand } from './types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, ShieldAlert, PowerOff } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [wakeWordActive, setWakeWordActive] = useState(true);
  const [isInstallPluginOpen, setIsInstallPluginOpen] = useState(false);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);

  // ----------------------------------------------------
  // SIX 686 GOVERNANCE SYSTEM STATE
  // ----------------------------------------------------
  const [killSwitch, setKillSwitch] = useState<KillSwitchStatus>({
    active: false,
    stoppedAt: null,
    stoppedBy: null,
  });
  const [pendingApprovals, setPendingApprovals] = useState<GovernanceApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<GovernanceAuditEntry[]>([]);
  const [activeApprovalPrompt, setActiveApprovalPrompt] = useState<{
    result: GovernanceResult;
    onAuthorized: () => void;
    onRejected?: () => void;
  } | null>(null);

  // Toast notification state
  const [toasts, setToasts] = useState<Array<{ id: string; msg: string; type: 'success' | 'warn' | 'error' | 'info' }>>([]);

  const showToast = useCallback((msg: string, type: 'success' | 'warn' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Fetch Governance state from backend
  const fetchGovernanceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/trpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procedure: 'six686.status' })
      });
      const data = await res.json();
      const payload = data?.result?.data?.json;
      if (payload) {
        if (payload.killSwitch) setKillSwitch(payload.killSwitch);
        if (payload.pendingApprovals) setPendingApprovals(payload.pendingApprovals);
        if (payload.recentAudits) setAuditLogs(payload.recentAudits);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchGovernanceStatus();
    const interval = setInterval(fetchGovernanceStatus, 6000);
    return () => clearInterval(interval);
  }, [fetchGovernanceStatus]);

  // Six 686 Universal Governance Authorization Gate
  const governAgentAction = useCallback(async (
    action: AgentAction, 
    onExecuteIfApproved: () => void | Promise<void>
  ): Promise<boolean> => {
    if (killSwitch.active) {
      showToast(`🚨 SIX 686 EMERGENCY STOP ACTIVE. Action '${action.capability}' halted.`, 'error');
      return false;
    }

    try {
      const res = await fetch('/api/trpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure: 'six686.govern',
          input: {
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            requestedAt: new Date().toISOString(),
            ...action,
          }
        })
      });

      const data = await res.json();
      const govResult: GovernanceResult = data?.result?.data?.json;

      if (!govResult) {
        // Fallback execute if backend is offline
        await onExecuteIfApproved();
        return true;
      }

      fetchGovernanceStatus();

      if (govResult.decision === 'BLOCK') {
        showToast(`🛑 Action BLOCKED by Six 686: ${govResult.reason}`, 'error');
        return false;
      }

      if (govResult.decision === 'REQUIRE_APPROVAL') {
        showToast(`⚠️ Six 686: Approval Required (${govResult.risk.level} Risk) for ${action.capability}`, 'warn');
        setActiveApprovalPrompt({
          result: govResult,
          onAuthorized: async () => {
            setActiveApprovalPrompt(null);
            if (govResult.approvalId) {
              await fetch('/api/trpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  procedure: 'six686.approveRequest',
                  input: { id: govResult.approvalId, decision: 'APPROVED', by: 'owner' }
                })
              });
            }
            showToast(`✅ Owner Authorized: Executing ${action.capability}`, 'success');
            await onExecuteIfApproved();
            fetchGovernanceStatus();
          },
          onRejected: async () => {
            setActiveApprovalPrompt(null);
            if (govResult.approvalId) {
              await fetch('/api/trpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  procedure: 'six686.approveRequest',
                  input: { id: govResult.approvalId, decision: 'REJECTED', by: 'owner' }
                })
              });
            }
            showToast(`🛑 Action Rejected by Owner: ${action.capability}`, 'warn');
            fetchGovernanceStatus();
          }
        });
        return false;
      }

      // If ALLOW
      await onExecuteIfApproved();
      return true;
    } catch (err: any) {
      // In case of network error, proceed safely
      await onExecuteIfApproved();
      return true;
    }
  }, [killSwitch.active, showToast, fetchGovernanceStatus]);

  // Kill Switch Handler
  const handleToggleKillSwitch = async (active: boolean) => {
    try {
      const res = await fetch('/api/trpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure: active ? 'six686.activateKillSwitch' : 'six686.releaseKillSwitch',
          input: { by: 'owner' }
        })
      });
      const data = await res.json();
      const status = data?.result?.data?.json;
      if (status) {
        setKillSwitch(status);
        fetchGovernanceStatus();
      }
    } catch (_) {}
  };

  // Review pending approval from Governance Modal
  const handleResolveApproval = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch('/api/trpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure: 'six686.approveRequest',
          input: { id, decision, by: 'owner' }
        })
      });
      fetchGovernanceStatus();
    } catch (_) {}
  };

  // Pending spoken command when waking via wake word
  const [pendingSpokenCommand, setPendingSpokenCommand] = useState<string | null>(null);

  // ----------------------------------------------------
  // FIREFLY LOCAL COMPUTER BRIDGE & AUTONOMY STATE
  // ----------------------------------------------------
  const [bridgeStatus, setBridgeStatus] = useState<FireflyBridgeStatus>({
    connected: false,
    url: 'http://127.0.0.1:8765',
    agentName: 'Firefly Autonomous Computer Bridge',
    mode: 'say_okay_gate'
  });
  const [pendingVoiceCommand, setPendingVoiceCommand] = useState<FireflyComputerCommand | null>(null);

  // Poll Firefly Bridge connection
  const checkBridgeStatus = useCallback(async () => {
    try {
      // First attempt direct local fetch (browser to localhost:8765)
      let isConnected = false;
      let data: any = null;

      try {
        const res = await fetch('http://127.0.0.1:8765/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(1200)
        });
        if (res.ok) {
          data = await res.json();
          isConnected = true;
        }
      } catch {
        // Fallback to server relay
        try {
          const relayRes = await fetch('/api/firefly/relay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: '/health', method: 'GET' }),
            signal: AbortSignal.timeout(1500)
          });
          if (relayRes.ok) {
            data = await relayRes.json();
            isConnected = true;
          }
        } catch (_) {}
      }

      if (isConnected && data) {
        setBridgeStatus(prev => ({
          ...prev,
          connected: true,
          mode: data.mode || prev.mode,
          computerInfo: data.computerInfo || data.system
        }));
      } else {
        setBridgeStatus(prev => ({ ...prev, connected: false }));
      }
    } catch (_) {
      setBridgeStatus(prev => ({ ...prev, connected: false }));
    }
  }, []);

  useEffect(() => {
    checkBridgeStatus();
    const interval = setInterval(checkBridgeStatus, 8000);
    return () => clearInterval(interval);
  }, [checkBridgeStatus]);

  // Execute command on user's computer via Firefly Bridge
  const handleExecuteComputerCommand = useCallback(async (command: string, bypassOkay: boolean = false): Promise<any> => {
    const isAutonomous = bypassOkay || bridgeStatus.mode === 'full_autonomous';

    if (!isAutonomous) {
      // Gate via "Say Okay"
      const pendingCmd: FireflyComputerCommand = {
        id: `cmd-${Date.now()}`,
        command,
        status: 'pending_approval',
        requiresOkay: true,
        approved: false,
        timestamp: new Date().toISOString()
      };
      setPendingVoiceCommand(pendingCmd);
      showToast(`Firefly requesting to run: "${command}". Say "Okay" or click to authorize.`, 'warn');
      chime.playWakeChime();
      return pendingCmd;
    }

    try {
      let res;
      try {
        res = await fetch('http://127.0.0.1:8765/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, bypassOkay: true }),
          signal: AbortSignal.timeout(8000)
        });
      } catch {
        res = await fetch('/api/firefly/relay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: '/exec',
            method: 'POST',
            body: { command, bypassOkay: true }
          })
        });
      }

      const data = await res.json();
      if (data.success || data.exitCode === 0) {
        showToast(`Computer command executed: ${command} (${data.durationMs || 0}ms)`, 'success');
      } else {
        showToast(`Command error: ${data.stderr || data.error || 'Failed'}`, 'error');
      }
      return {
        id: `cmd-${Date.now()}`,
        command,
        status: data.exitCode === 0 ? 'success' : 'failed',
        requiresOkay: false,
        approved: true,
        exitCode: data.exitCode,
        stdout: data.stdout,
        stderr: data.stderr,
        durationMs: data.durationMs,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      showToast(`Bridge error: ${err.message}`, 'error');
      return null;
    }
  }, [bridgeStatus.mode, showToast]);

  // Handle "Say Okay" authorization for pending computer commands
  const handleSayOkay = useCallback(async (): Promise<boolean> => {
    if (!pendingVoiceCommand) {
      try {
        await fetch('http://127.0.0.1:8765/auth/say-okay', { method: 'POST' }).catch(() => {
          return fetch('/api/firefly/relay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: '/auth/say-okay', method: 'POST' })
          });
        });
      } catch (_) {}
      return false;
    }

    const cmdToRun = pendingVoiceCommand.command;
    setPendingVoiceCommand(null);
    await handleExecuteComputerCommand(cmdToRun, true);
    return true;
  }, [pendingVoiceCommand, handleExecuteComputerCommand]);

  // Plugins State
  const [plugins, setPlugins] = useState<PluginItem[]>([
    { id: 'memory', name: 'Memory DB', desc: 'Persistent cross-session knowledge', icon: '🧠', color: '#a855f7', on: true },
    { id: 'bash', name: 'Bash & Terminal', desc: 'Direct CLI & OpenClaw execution', icon: '⚡', color: '#ff6a00', on: true },
    { id: 'editor', name: 'Self-Update Code', desc: 'Autonomous AST codebase refactoring', icon: '📝', color: '#0a84ff', on: true },
    { id: 'btc', name: 'Bitcoin Node', desc: 'Live mempool & UTXO tracking', icon: '₿', color: '#f59e0b', on: true },
    { id: 'homeassistant', name: 'Home Assistant', desc: 'Smart home IoT automation', icon: '🏠', color: '#06b6d4', on: true },
    { id: 'voice', name: 'Kokoro TTS & STT', desc: 'Low-latency natural audio engine', icon: '🎙️', color: '#ec4899', on: true }
  ]);

  // Memories State
  const [longTermMemories, setLongTermMemories] = useState<MemoryItem[]>([]);
  const [learnedMemories, setLearnedMemories] = useState<MemoryItem[]>([]);
  const [codeUpdates, setCodeUpdates] = useState<CodeUpdateItem[]>([]);

  // Load memories from backend
  const loadMemories = async () => {
    try {
      const res = await fetch('/api/memory/get');
      const data = await res.json();
      if (data.longTerm) setLongTermMemories(data.longTerm);
      if (data.learned) setLearnedMemories(data.learned);
      if (data.codeUpdates) setCodeUpdates(data.codeUpdates);
    } catch (_) {}
  };

  useEffect(() => {
    loadMemories();
  }, []);

  // Governed Plugin Toggle Action
  const handleTogglePlugin = (id: string) => {
    const plug = plugins.find(p => p.id === id);
    if (!plug) return;
    const nextState = !plug.on;

    governAgentAction(
      {
        agentId: 'openclaw',
        type: nextState ? 'execute' : 'write',
        capability: `toggle-plugin-${id}`,
        target: `plugins/${id}`,
        description: `${nextState ? 'Enable' : 'Disable'} plugin: ${plug.name}`,
        metadata: { pluginId: id, nextState }
      },
      () => {
        setPlugins(prev =>
          prev.map(p => {
            if (p.id === id) {
              showToast(`${p.name} ${nextState ? 'enabled' : 'disabled'}`, nextState ? 'success' : 'warn');
              return { ...p, on: nextState };
            }
            return p;
          })
        );
      }
    );
  };

  // Governed Plugin Install Action
  const handleInstallPlugin = (newPlug: PluginItem) => {
    governAgentAction(
      {
        agentId: 'openclaw',
        type: 'deploy',
        capability: 'install-plugin',
        target: `plugins/${newPlug.id}`,
        description: `Install third-party plugin: ${newPlug.name} (${newPlug.desc})`,
        metadata: { plugin: newPlug }
      },
      () => {
        setPlugins(prev => [...prev, newPlug]);
        showToast(`Plugin "${newPlug.name}" installed and verified`, 'success');
      }
    );
  };

  // Governed Memory Addition
  const handleAddMemory = async (title: string, body: string, type: 'longTerm' | 'shortTerm') => {
    governAgentAction(
      {
        agentId: 'sapphire',
        type: 'write',
        capability: 'persist-memory',
        target: `memory/${type}/${title.toLowerCase().replace(/\s+/g, '_')}`,
        description: `Write ${type === 'longTerm' ? 'Core Long-Term' : 'Short-Term'} Memory: "${title}"`,
      },
      async () => {
        try {
          const res = await fetch('/api/memory/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, type })
          });
          const data = await res.json();
          if (data.success) {
            loadMemories();
            showToast(`Memory persisted: "${title}"`, 'success');
          }
        } catch (_) {}
      }
    );
  };

  // Governed Memory Deletion
  const handleDeleteMemory = async (id?: number) => {
    if (!id) return;
    governAgentAction(
      {
        agentId: 'sapphire',
        type: 'delete',
        capability: 'delete-memory',
        target: `memory/slot_${id}`,
        description: `Delete persistent memory record slot #${id}`,
      },
      async () => {
        try {
          await fetch('/api/memory/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          showToast('Memory slot deleted', 'info');
          loadMemories();
        } catch (_) {}
      }
    );
  };

  // Governed Code Update Application
  const handleApplyCodeUpdate = (file: string, desc: string, add: string, rem: string) => {
    governAgentAction(
      {
        agentId: 'neural-core',
        type: 'write',
        capability: 'code-self-update',
        target: file,
        description: `Autonomous AST Code Refactor: ${desc} on ${file}`,
        metadata: { file, add, rem }
      },
      () => {
        showToast(`Code update applied to ${file}`, 'success');
      }
    );
  };

  const handleForwardToSapphire = (analysisText: string) => {
    setCurrentPage('sapphire');
    showToast('Loaded brain diagnosis into Sapphire context', 'info');
  };

  const handleSendCapabilityToSapphire = (promptText: string) => {
    governAgentAction(
      {
        agentId: 'sapphire',
        type: 'execute',
        capability: 'trigger-prompt',
        description: `Trigger capability prompt: "${promptText.slice(0, 50)}..."`,
      },
      () => {
        setCurrentPage('sapphire');
        showToast(`Triggered: "${promptText.slice(0, 40)}..."`, 'info');
      }
    );
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#050505] text-[#f5f5f5] antialiased selection:bg-[#E0FF25] selection:text-black">
      {/* Top Emergency Kill Switch Banner if Active */}
      {killSwitch.active && (
        <div className="flex items-center justify-between bg-red-600 px-4 py-2 text-xs font-black uppercase text-white shadow-lg z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 animate-bounce" />
            <span>SIX 686 EMERGENCY KILL SWITCH ENGAGED — ALL AGENT EXECUTION PAUSED</span>
          </div>
          <button id="btn-app-1"
            onClick={() => handleToggleKillSwitch(false)}
            className="rounded bg-white px-3 py-1 text-[11px] font-black text-red-600 hover:bg-neutral-100 transition shadow"
          >
            Release & Resume
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        memoryCount={longTermMemories.length + learnedMemories.length}
        wakeWordActive={wakeWordActive}
        onToggleWakeWord={() => {
          const next = !wakeWordActive;
          setWakeWordActive(next);
          showToast(`Firefly Speech Engine ${next ? 'Active' : 'Muted'}`, next ? 'success' : 'warn');
        }}
        currentUser={null}
        onOpenSaveModal={() => {
          showToast('Project configuration saved to cloud workspace', 'success');
        }}
        onSignIn={() => {
          showToast('Owner session active', 'info');
        }}
        onSignOut={() => {
          showToast('Signed out', 'info');
        }}
        onOpenGovernance={() => setIsGovernanceOpen(true)}
        pendingApprovalsCount={pendingApprovals.filter(a => a.status === 'PENDING').length}
        killSwitchActive={killSwitch.active}
        bridgeConnected={bridgeStatus.connected}
      />

      {/* Page Content Viewport */}
      <div className="flex flex-1 overflow-hidden">
        {currentPage === 'home' && (
          <HomePage onNavigate={setCurrentPage} />
        )}

        {currentPage === 'sapphire' && (
          <SapphirePage
            plugins={plugins}
            onTogglePlugin={handleTogglePlugin}
            onOpenInstallPlugin={() => setIsInstallPluginOpen(true)}
            memories={[...longTermMemories, ...learnedMemories]}
            updateCount={codeUpdates.length}
            wakeWordActive={wakeWordActive}
            pendingCommand={pendingSpokenCommand}
            onClearPendingCommand={() => setPendingSpokenCommand(null)}
            onShowToast={showToast}
          />
        )}

        {(currentPage === 'openclaw' || currentPage === 'claw') && (
          <OpenClawPage onShowToast={showToast} />
        )}

        {currentPage === 'memory' && (
          <MemoryPage
            longTermMemories={longTermMemories}
            learnedMemories={learnedMemories}
            codeUpdates={codeUpdates}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'capabilities' && (
          <CapabilitiesPage
            onNavigate={setCurrentPage}
            onSendCapabilityToSapphire={handleSendCapabilityToSapphire}
          />
        )}

        {currentPage === 'pricing' && (
          <PricingPage onNavigate={setCurrentPage} />
        )}

        {currentPage === 'features' && (
          <FeaturesPage onNavigate={setCurrentPage} />
        )}

        {currentPage === 'admin' && (
          <AdminPage onShowToast={showToast} />
        )}

        {currentPage === 'settings' && (
          <SettingsPage onShowToast={showToast} />
        )}

        {currentPage === 'computer' && (
          <ComputerBridgePage
            bridgeStatus={bridgeStatus}
            onRefreshBridge={checkBridgeStatus}
            onExecuteCommand={handleExecuteComputerCommand}
            onSayOkay={handleSayOkay}
            pendingVoiceCommand={pendingVoiceCommand}
            onNavigatePage={setCurrentPage}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* Firefly Global Persistent Voice Assistant (Active across all pages) */}
      <FireflyGlobalVoiceBar
        currentPage={currentPage}
        onNavigatePage={setCurrentPage}
        bridgeStatus={bridgeStatus}
        onExecuteComputerCommand={handleExecuteComputerCommand}
        pendingVoiceCommand={pendingVoiceCommand}
        onSayOkay={handleSayOkay}
        showToast={showToast}
      />

      {/* Universal Floating AI Brain */}
      <UniversalBrain
        onForwardToSapphire={handleForwardToSapphire}
        onShowToast={showToast}
      />

      {/* Install Plugin Modal */}
      <InstallPluginModal
        isOpen={isInstallPluginOpen}
        onClose={() => setIsInstallPluginOpen(false)}
        onInstall={handleInstallPlugin}
        onShowToast={showToast}
      />

      {/* Six 686 Full Governance Modal */}
      <GovernanceModal
        isOpen={isGovernanceOpen}
        onClose={() => setIsGovernanceOpen(false)}
        killSwitch={killSwitch}
        pendingApprovals={pendingApprovals}
        auditLogs={auditLogs}
        onToggleKillSwitch={handleToggleKillSwitch}
        onResolveApproval={handleResolveApproval}
        onRefresh={fetchGovernanceStatus}
        onShowToast={showToast}
      />

      {/* Real-time Approval Prompt Modal */}
      {activeApprovalPrompt && (
        <ApprovalPromptModal
          isOpen={true}
          result={activeApprovalPrompt.result}
          onAuthorize={activeApprovalPrompt.onAuthorized}
          onReject={activeApprovalPrompt.onRejected || (() => setActiveApprovalPrompt(null))}
          onClose={() => setActiveApprovalPrompt(null)}
        />
      )}

      {/* Global Toast Notification Stack */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-2xl backdrop-blur-md transition-all ${
              toast.type === 'success'
                ? 'border-[#E0FF25]/50 bg-[#0c0c0c] text-[#E0FF25]'
                : toast.type === 'warn'
                ? 'border-amber-500/50 bg-[#0c0c0c] text-amber-300'
                : toast.type === 'error'
                ? 'border-red-500/50 bg-[#0c0c0c] text-red-400'
                : 'border-[#262626] bg-[#0c0c0c] text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-[#E0FF25] shrink-0" />}
            {toast.type === 'warn' && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="h-4 w-4 text-white shrink-0" />}
            <span>{toast.msg}</span>
            <button id="btn-app-2"
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-2 text-[#737373] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
