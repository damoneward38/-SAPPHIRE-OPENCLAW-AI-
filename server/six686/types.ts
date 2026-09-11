export type AgentId =
  | "neural-core"
  | "sapphire"
  | "openclaw"
  | string;

export type ActionType =
  | "read"
  | "write"
  | "execute"
  | "delete"
  | "network"
  | "git"
  | "deploy"
  | "system";

export type Decision =
  | "ALLOW"
  | "REQUIRE_APPROVAL"
  | "BLOCK";

export interface AgentAction {
  id: string;
  agentId: AgentId;
  type: ActionType;
  capability: string;
  target?: string;
  description: string;
  metadata?: Record<string, unknown>;
  requestedAt: string;
}

export interface RiskAssessment {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasons: string[];
}

export interface GovernanceResult {
  action: AgentAction;
  risk: RiskAssessment;
  decision: Decision;
  approvalId?: string;
  reason: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  agentId: AgentId;
  actionId: string;
  capability: string;
  target?: string;
  riskScore: number;
  decision: Decision;
  result?: "SUCCESS" | "FAILED" | "BLOCKED" | "PENDING";
  message: string;
}

export interface PendingApproval {
  id: string;
  action: AgentAction;
  risk: RiskAssessment;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
  reviewedAt?: string;
}
