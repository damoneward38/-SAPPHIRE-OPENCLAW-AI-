import type { AgentAction, RiskAssessment } from "./types";

const HIGH_RISK_CAPABILITIES = [
  "delete",
  "deploy",
  "push-main",
  "system-command",
  "shell",
  "terminal",
];

const CRITICAL_PATTERNS = [
  "rm -rf /",
  "format disk",
  "erase disk",
  "delete all",
];

export function assessRisk(action: AgentAction): RiskAssessment {
  let score = 0.1;
  const reasons: string[] = [];

  const description =
    `${action.description} ${action.target ?? ""}`.toLowerCase();

  if (
    action.type === "delete" ||
    action.type === "system"
  ) {
    score += 0.45;
    reasons.push("Destructive or system-level action.");
  }

  if (
    action.type === "deploy" ||
    action.type === "network"
  ) {
    score += 0.3;
    reasons.push("External or production-facing action.");
  }

  if (
    HIGH_RISK_CAPABILITIES.some((item) =>
      action.capability.toLowerCase().includes(item)
    )
  ) {
    score += 0.25;
    reasons.push("High-impact capability detected.");
  }

  if (
    CRITICAL_PATTERNS.some((pattern) =>
      description.includes(pattern)
    )
  ) {
    score = 1;
    reasons.push("Critical destructive pattern detected.");
  }

  score = Math.min(1, Number(score.toFixed(2)));

  let level: RiskAssessment["level"];

  if (score >= 0.9) {
    level = "CRITICAL";
  } else if (score >= 0.65) {
    level = "HIGH";
  } else if (score >= 0.35) {
    level = "MEDIUM";
  } else {
    level = "LOW";
  }

  return {
    score,
    level,
    reasons:
      reasons.length > 0
        ? reasons
        : ["Routine low-risk operation."],
  };
}
