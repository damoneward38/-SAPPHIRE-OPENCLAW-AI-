import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X, 
  RefreshCw, 
  PowerOff, 
  Terminal, 
  Activity, 
  Lock,
  Eye,
  FileCode2,
  Cpu
} from 'lucide-react';
import { 
  GovernanceApprovalRequest, 
  GovernanceAuditEntry, 
  KillSwitchStatus,
  AgentAction 
} from '../types';

interface GovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  killSwitch: KillSwitchStatus;
  pendingApprovals: GovernanceApprovalRequest[];
  auditLogs: GovernanceAuditEntry[];
  onToggleKillSwitch: (active: boolean) => void;
  onResolveApproval: (id: string, decision: 'APPROVED' | 'REJECTED') => void;
  onRefresh: () => void;
  onShowToast: (msg: string, type: 'success' | 'warn' | 'error' | 'info') => void;
}

export const GovernanceModal: React.FC<GovernanceModalProps> = ({
  isOpen,
  onClose,
  killSwitch,
  pendingApprovals,
  auditLogs,
  onToggleKillSwitch,
  onResolveApproval,
  onRefresh,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'ledger' | 'policies' | 'killswitch'>('approvals');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const pendingList = pendingApprovals.filter(a => a.status === 'PENDING');
  
  const filteredAuditLogs = auditLogs.filter(log => {
    if (filterAgent !== 'all' && log.agentId !== filterAgent) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.capability.toLowerCase().includes(q) ||
        (log.target && log.target.toLowerCase().includes(q)) ||
        log.message.toLowerCase().includes(q) ||
        log.agentId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col rounded-2xl border border-[#262626] bg-[#0c0c0c] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#262626] bg-[#121212] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              killSwitch.active 
                ? 'border-red-500/50 bg-red-500/10 text-red-400' 
                : 'border-[#E0FF25]/40 bg-[#E0FF25]/10 text-[#E0FF25]'
            }`}>
              {killSwitch.active ? <ShieldAlert className="h-5 w-5 animate-pulse" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-black tracking-wider text-white">SIX 686 GOVERNANCE CORE</h2>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                  killSwitch.active ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-[#E0FF25]/20 text-[#E0FF25] border border-[#E0FF25]/40'
                }`}>
                  {killSwitch.active ? 'EMERGENCY HALT' : 'SYSTEM ARMED & ACTIVE'}
                </span>
              </div>
              <p className="text-[11px] text-[#737373]">
                Mandatory agent verification layer for Neural Core, Sapphire, and OpenClaw
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button id="btn-governancemodal-1"
              onClick={onRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#181818] px-3 py-1.5 text-xs font-bold text-[#a3a3a3] hover:border-[#E0FF25] hover:text-white transition"
              title="Refresh Governance State"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync</span>
            </button>

            <button id="btn-governancemodal-2"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#737373] hover:bg-[#262626] hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Quick Status */}
        <div className="flex items-center justify-between border-b border-[#262626] bg-[#0e0e0e] px-6">
          <div className="flex gap-2">
            <button id="btn-governancemodal-3"
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'approvals'
                  ? 'border-[#E0FF25] text-[#E0FF25]'
                  : 'border-transparent text-[#737373] hover:text-[#a3a3a3]'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Approval Gate</span>
              {pendingList.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-black">
                  {pendingList.length}
                </span>
              )}
            </button>

            <button id="btn-governancemodal-4"
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'ledger'
                  ? 'border-[#E0FF25] text-[#E0FF25]'
                  : 'border-transparent text-[#737373] hover:text-[#a3a3a3]'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Audit Ledger</span>
              <span className="rounded bg-[#1c1c1c] px-1.5 py-0.5 text-[10px] text-[#737373]">
                {auditLogs.length}
              </span>
            </button>

            <button id="btn-governancemodal-5"
              onClick={() => setActiveTab('policies')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'policies'
                  ? 'border-[#E0FF25] text-[#E0FF25]'
                  : 'border-transparent text-[#737373] hover:text-[#a3a3a3]'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Safety Policies</span>
            </button>

            <button id="btn-governancemodal-6"
              onClick={() => setActiveTab('killswitch')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'killswitch'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-[#737373] hover:text-red-400/80'
              }`}
            >
              <PowerOff className="h-4 w-4" />
              <span>Emergency Kill Switch</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-[#737373]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Policy Engine: <strong>Active</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E0FF25]"></span>
              <span>Risk Engine: <strong>Real-Time</strong></span>
            </div>
          </div>
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: APPROVAL GATE */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Pending Approval Queue</h3>
                  <p className="text-[11px] text-[#737373]">
                    High-impact agent operations paused by Six 686 awaiting explicit owner authorization.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#a3a3a3]">
                  {pendingList.length} {pendingList.length === 1 ? 'Action' : 'Actions'} Requiring Review
                </span>
              </div>

              {pendingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#262626] bg-[#0f0f0f] py-16 text-center">
                  <CheckCircle2 className="h-10 w-10 text-[#E0FF25]/60 mb-2" />
                  <h4 className="text-sm font-bold text-white">All Clear — No Pending Approvals</h4>
                  <p className="max-w-md text-xs text-[#737373] mt-1">
                    Every recent action was either automatically evaluated as safe (ALLOW) or already reviewed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingList.map(item => {
                    const action = item.action;
                    const risk = item.risk;
                    const meta = item.metadata;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-amber-500/30 bg-[#121008] p-5 transition hover:border-amber-500/60"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-amber-400 border border-amber-500/40">
                                REQUIRE APPROVAL
                              </span>
                              <span className="rounded bg-[#262626] px-2 py-0.5 font-mono text-[10px] text-white">
                                Agent: {action?.agentId || (meta?.agentId as string) || 'openclaw'}
                              </span>
                              <span className="rounded bg-[#1a1a1a] px-2 py-0.5 font-mono text-[10px] text-[#a3a3a3]">
                                Capability: {action?.capability || (meta?.capability as string) || 'action'}
                              </span>
                              <span className="text-[10px] text-[#737373] font-mono">
                                {new Date(item.createdAt).toLocaleTimeString()}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-white">
                              {action?.description || (meta?.description as string) || 'Requested system operation'}
                            </h4>

                            {action?.target && (
                              <div className="flex items-center gap-1.5 text-xs text-[#a3a3a3]">
                                <FileCode2 className="h-3.5 w-3.5 text-[#E0FF25]" />
                                <span>Target: <code className="text-white font-mono">{action.target}</code></span>
                              </div>
                            )}

                            {risk && risk.reasons && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {risk.reasons.map((r, i) => (
                                  <span key={`${item.id}_risk_${i}_${r.slice(0, 15)}`} className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300 border border-red-500/20">
                                    ⚠️ {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button id="btn-governancemodal-7"
                              onClick={() => {
                                onResolveApproval(item.id, 'APPROVED');
                                onShowToast(`Action authorized and dispatched`, 'success');
                              }}
                              className="flex items-center gap-1.5 rounded-lg bg-[#E0FF25] px-4 py-2 text-xs font-black uppercase text-black hover:bg-[#ccff00] transition shadow-lg"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Authorize
                            </button>

                            <button id="btn-governancemodal-8"
                              onClick={() => {
                                onResolveApproval(item.id, 'REJECTED');
                                onShowToast(`Action rejected and blocked`, 'warn');
                              }}
                              className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-black uppercase text-red-400 hover:bg-red-500/20 transition"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIT LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Immutable Audit Ledger</h3>
                  <p className="text-[11px] text-[#737373]">
                    Cryptographically stamped log of every governed request, risk score, and execution result.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterAgent}
                    onChange={e => setFilterAgent(e.target.value)}
                    className="rounded-lg border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#E0FF25]"
                  >
                    <option value="all">All Agents</option>
                    <option value="sapphire">Sapphire</option>
                    <option value="openclaw">OpenClaw</option>
                    <option value="neural-core">Neural Core</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs text-white outline-none focus:border-[#E0FF25]"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] overflow-hidden">
                <div className="max-h-[460px] overflow-y-auto divide-y divide-[#1f1f1f]">
                  {filteredAuditLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#737373]">
                      No audit entries found matching filter.
                    </div>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <div key={log.id} className="p-3.5 hover:bg-[#121212] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                              log.decision === 'ALLOW' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : log.decision === 'REQUIRE_APPROVAL'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {log.decision}
                            </span>
                            <span className="font-mono text-xs text-white font-bold">
                              {log.agentId}
                            </span>
                            <span className="text-[11px] text-[#a3a3a3]">
                              → {log.capability}
                            </span>
                            {log.target && (
                              <span className="font-mono text-[10px] text-[#737373] max-w-[200px] truncate">
                                ({log.target})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8c8c8c] pl-1">{log.message}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div>
                            <div className="text-[10px] font-mono text-[#a3a3a3]">
                              Risk: <span className={log.riskScore >= 0.65 ? 'text-red-400 font-bold' : log.riskScore >= 0.35 ? 'text-amber-400' : 'text-emerald-400'}>{log.riskScore}</span>
                            </div>
                            <div className="text-[9px] font-mono text-[#525252]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                            log.result === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' :
                            log.result === 'BLOCKED' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'
                          }`}>
                            {log.result || 'RECORDED'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY POLICIES */}
          {activeTab === 'policies' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Active Governance Policies</h3>
                <p className="text-[11px] text-[#737373]">
                  Hard-coded invariants evaluated against every capability before dispatch.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Inviolable Block Rules (BLOCK)</span>
                  </div>
                  <ul className="text-xs text-[#a3a3a3] space-y-1.5 pl-4 list-disc">
                    <li>Self-modification or disabling of Governor policies</li>
                    <li>Disabling or altering the Audit Ledger</li>
                    <li>Disabling or bypassing the Kill Switch</li>
                    <li>Destructive patterns: <code className="text-red-400 font-mono">rm -rf /</code>, <code className="text-red-400 font-mono">format disk</code></li>
                    <li>Risk assessment score ≥ 0.90 (CRITICAL)</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Lock className="h-4 w-4" />
                    <span>Human Approval Gates (REQUIRE_APPROVAL)</span>
                  </div>
                  <ul className="text-xs text-[#a3a3a3] space-y-1.5 pl-4 list-disc">
                    <li>High-impact actions with risk score ≥ 0.65 (HIGH)</li>
                    <li>Destructive file deletions and mass removals</li>
                    <li>Production deployments and external network tunnels</li>
                    <li>Direct shell commands with elevated impact</li>
                    <li>Git push to main / release branches</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Autonomous Execution (ALLOW)</span>
                  </div>
                  <ul className="text-xs text-[#a3a3a3] space-y-1.5 pl-4 list-disc">
                    <li>Routine read-only analysis and AST code parsing</li>
                    <li>Context generation and conversational synthesis</li>
                    <li>Transient memory indexing and local caching</li>
                    <li>Non-destructive local sandbox plugin tasks</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E0FF25]">
                    <Cpu className="h-4 w-4" />
                    <span>Agent Identity Enforcement</span>
                  </div>
                  <p className="text-xs text-[#a3a3a3]">
                    Every request must authenticate with a known Agent ID (<code className="text-white font-mono">sapphire</code>, <code className="text-white font-mono">openclaw</code>, or <code className="text-white font-mono">neural-core</code>) before risk scoring begins.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMERGENCY KILL SWITCH */}
          {activeTab === 'killswitch' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500 bg-red-500/20 text-red-400">
                    <PowerOff className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-red-300">
                      Six 686 Master Emergency Stop
                    </h3>
                    <p className="text-xs text-red-200/70">
                      Instantly severs all agent execution capabilities, terminal commands, and tool dispatches across all modules.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-[#262626] bg-[#0c0c0c] p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Current Status:</span>
                    <span className={`font-mono font-bold ${killSwitch.active ? 'text-red-400' : 'text-emerald-400'}`}>
                      {killSwitch.active ? '🚨 EMERGENCY STOP ENGAGED' : '✅ SYSTEM NOMINAL / OPERATIONAL'}
                    </span>
                  </div>
                  {killSwitch.stoppedAt && (
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Halted At:</span>
                      <span className="font-mono text-white">{new Date(killSwitch.stoppedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {killSwitch.stoppedBy && (
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Triggered By:</span>
                      <span className="font-mono text-white">{killSwitch.stoppedBy}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {killSwitch.active ? (
                    <button id="btn-governancemodal-9"
                      onClick={() => {
                        onToggleKillSwitch(false);
                        onShowToast('Emergency Kill Switch released. System operational.', 'success');
                      }}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-emerald-400 transition shadow-xl"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Release Kill Switch & Resume System
                    </button>
                  ) : (
                    <button id="btn-governancemodal-10"
                      onClick={() => {
                        onToggleKillSwitch(true);
                        onShowToast('🚨 EMERGENCY STOP ACTIVATED. All agent operations halted.', 'error');
                      }}
                      className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-red-700 transition shadow-xl shadow-red-950"
                    >
                      <PowerOff className="h-4 w-4" />
                      ENGAGE EMERGENCY KILL SWITCH
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="flex items-center justify-between border-t border-[#262626] bg-[#101010] px-6 py-3 text-xs text-[#737373]">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Active Agent: <strong className="text-white">Sapphire & OpenClaw</strong></span>
            <span>•</span>
            <span>Version: <strong className="text-[#E0FF25]">Six-686.v1</strong></span>
          </div>

          <button id="btn-governancemodal-11"
            onClick={onClose}
            className="rounded-lg bg-[#262626] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#333] transition"
          >
            Close Governance Center
          </button>
        </div>
      </div>
    </div>
  );
};
