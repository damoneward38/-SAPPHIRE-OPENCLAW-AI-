import { randomUUID } from "crypto";

import {
  type AgentAction,
  type GovernanceResult,
} from "./types";

import { assertSystemActive, getKillSwitchStatus } from "./killSwitch";
import { assessRisk } from "./riskEngine";
import { evaluatePolicy } from "./policyEngine";
import { createApproval } from "./approvalGate";
import { writeAudit } from "./auditLedger";

export function createAction(
  input: Omit<AgentAction, "id" | "requestedAt">
): AgentAction {
  return {
    id: randomUUID(),
    requestedAt: new Date().toISOString(),
    ...input,
  };
}

export async function governAction(
  action: AgentAction
): Promise<GovernanceResult> {
  const ks = getKillSwitchStatus();
  if (ks.active) {
    writeAudit({
      agentId: action.agentId,
      actionId: action.id,
      capability: action.capability,
      target: action.target,
      riskScore: 1.0,
      decision: "BLOCK",
      result: "BLOCKED",
      message: `Emergency stop active. Blocked by kill switch.`,
    });

    return {
      action,
      risk: {
        score: 1.0,
        level: "CRITICAL",
        reasons: ["Emergency Kill Switch is currently ACTIVE."],
      },
      decision: "BLOCK",
      reason: "Emergency kill switch is active.",
    };
  }

  const risk迷 = assessRisk(action);
  const risk = risk迷;

  const policy = evaluatePolicy(action, risk);

  let approvalId: string | undefined;

  if (policy.decision === "REQUIRE_APPROVAL") {
    const approval = createApproval(action.id, {
      description: action.description,
      capability: action.capability,
      target: action.target,
      agentId: action.agentId,
      riskScore: risk.score,
      riskLevel: risk.level,
    });
    approvalId = approval.id;
  }

  writeAudit({
    agentId: action.agentId,
    actionId: action.id,
    capability: action.capability,
    target: action.target,
    riskScore: risk.score,
    decision: policy.decision,
    result:
      policy.decision === "ALLOW"
        ? "SUCCESS"
        : policy.decision === "BLOCK"
          ? "BLOCKED"
          : "PENDING",
    message: policy.reason,
  });

  return {
    action,
    risk,
    decision: policy.decision,
    approvalId,
    reason: policy.reason,
  };
}

// Backward-compat class wrapper
export class Six686Governor {
  static assessAndAuthorize(action: AgentAction): GovernanceResult {
    const ksInt = getKillSwitchStatus();
    if (ksInt.active) {
      writeAudit({
        agentId: action.agentId,
        actionId: action.id,
        capability: action.capability,
        target: action.target,
        riskScore: 1.0,
        decision: "BLOCK",
        result: "BLOCKED",
        message: `Halted by Emergency Kill Switch.`,
      });
      return {
        action,
        risk: {
          score: 1.0,
          level: "CRITICAL",
          reasons: ["Emergency Kill Switch is active"],
        },
        decision: "BLOCK",
        reason: "Emergency kill switch is active.",
      };
    }

    const risk = assessRisk(action);
    const policy = evaluatePolicy(action, risk);
    let approvalId: string | undefined;
    if (policy.decision === "REQUIRE_APPROVAL") {
      const approval = createApproval(action.id, {
        description: action.description,
        capability: action.capability,
        target: action.target,
        agentId: action.agentId,
        riskScore: risk.score,
        riskLevel: risk.level,
      });
      approvalId = approval.id;
    }

    writeAudit({
      agentId: action.agentId,
      actionId: action.id,
      capability: action.capability,
      target: action.target,
      riskScore: risk.score,
      decision: policy.decision,
      result: policy.decision === "ALLOW" ? "SUCCESS" : policy.decision === "REQUIRE_APPROVAL" ? "PENDING" : "BLOCKED",
      message: policy.reason,
    });

    return {
      action,
      risk,
      decision: policy.decision,
      approvalId,
      reason: policy.reason,
    };
  }
}
