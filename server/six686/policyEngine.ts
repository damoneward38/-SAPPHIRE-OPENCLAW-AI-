import type {
  AgentAction,
  Decision,
  RiskAssessment,
} from "./types";

const BLOCKED_CAPABILITIES = [
  "self-modify-governor",
  "disable-audit",
  "disable-kill-switch",
];

export function evaluatePolicy(
  action: AgentAction,
  risk: RiskAssessment
): { decision: Decision; reason: string } {
  const capability = action.capability.toLowerCase();

  if (
    BLOCKED_CAPABILITIES.some((blocked) =>
      capability.includes(blocked)
    )
  ) {
    return {
      decision: "BLOCK",
      reason:
        "The requested capability cannot modify or disable the governance system.",
    };
  }

  if (risk.level === "CRITICAL") {
    return {
      decision: "BLOCK",
      reason: "Critical-risk action blocked.",
    };
  }

  if (
    risk.level === "HIGH" ||
    action.type === "delete" ||
    action.type === "deploy"
  ) {
    return {
      decision: "REQUIRE_APPROVAL",
      reason:
        "High-impact action requires owner approval.",
    };
  }

  return {
    decision: "ALLOW",
    reason: "Action passed policy evaluation.",
  };
}
