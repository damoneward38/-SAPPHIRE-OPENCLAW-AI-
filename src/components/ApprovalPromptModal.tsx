import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCode2, 
  Cpu, 
  X 
} from 'lucide-react';
import { GovernanceResult } from '../types';

interface ApprovalPromptModalProps {
  isOpen: boolean;
  result: GovernanceResult | null;
  onAuthorize: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const ApprovalPromptModal: React.FC<ApprovalPromptModalProps> = ({
  isOpen,
  result,
  onAuthorize,
  onReject,
  onClose,
}) => {
  if (!isOpen || !result) return null;

  const action = result.action;
  const risk = result.risk;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-amber-500/50 bg-[#0e0d0a] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-black">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Six 686 Governance Approval Gate
              </h3>
              <p className="text-[10px] text-amber-200/70">
                Action paused. Owner authorization required before execution.
              </p>
            </div>
          </div>

          <button id="btn-approvalpromptmodal-1"
            onClick={onClose}
            className="rounded p-1 text-[#737373] hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Action Details */}
          <div className="rounded-xl border border-[#262626] bg-[#141414] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[#737373]">Agent Request</span>
              <span className="rounded bg-[#262626] px-2 py-0.5 font-mono text-[10px] text-[#E0FF25]">
                {action.agentId}
              </span>
            </div>

            <div className="font-bold text-white text-sm">
              {action.description}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="text-[#a3a3a3]">
                Capability: <strong className="text-white font-mono">{action.capability}</strong>
              </div>
              <div className="text-[#a3a3a3]">
                Action Type: <strong className="text-white font-mono uppercase">{action.type}</strong>
              </div>
            </div>

            {action.target && (
              <div className="flex items-center gap-1 text-[11px] text-[#a3a3a3] border-t border-[#262626] pt-2">
                <FileCode2 className="h-3.5 w-3.5 text-[#E0FF25]" />
                <span>Target: <code className="text-white font-mono">{action.target}</code></span>
              </div>
            )}
          </div>

          {/* Risk Scoring */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300">Risk Assessment:</span>
              <span className="font-mono font-black text-amber-400 text-xs">
                Score: {risk.score.toFixed(2)} ({risk.level})
              </span>
            </div>

            <div className="space-y-1">
              {risk.reasons.map((reason, idx) => (
                <div key={`approval_risk_${idx}_${reason.slice(0, 15)}`} className="flex items-start gap-1.5 text-[11px] text-amber-200/80">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#262626] bg-[#121212] p-4">
          <button id="btn-approvalpromptmodal-2"
            onClick={onReject}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-black uppercase text-red-400 hover:bg-red-500/20 transition"
          >
            <XCircle className="h-4 w-4" />
            Reject & Block
          </button>

          <button id="btn-approvalpromptmodal-3"
            onClick={onAuthorize}
            className="flex items-center gap-1.5 rounded-lg bg-[#E0FF25] px-5 py-2 text-xs font-black uppercase text-black hover:bg-[#ccff00] transition shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4" />
            Authorize & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
