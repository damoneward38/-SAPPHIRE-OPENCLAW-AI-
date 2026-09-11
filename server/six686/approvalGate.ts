import { randomUUID } from "crypto";

export interface ApprovalRequest {
  id: string;
  actionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: Record<string, unknown>;
}

const approvals = new Map<string, ApprovalRequest>();

export function createApproval(actionId: string, metadata?: Record<string, unknown>) {
  const approval: ApprovalRequest = {
    id: randomUUID(),
    actionId,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    metadata,
  };

  approvals.set(approval.id, approval);

  return approval;
}

export function approveRequest(
  approvalId: string,
  resolvedBy = "owner"
) {
  const approval = approvals.get(approvalId);

  if (!approval) {
    throw new Error("Approval request not found.");
  }

  approval.status = "APPROVED";
  approval.resolvedAt = new Date().toISOString();
  approval.resolvedBy = resolvedBy;

  return approval;
}

export function rejectRequest(
  approvalId: string,
  resolvedBy = "owner"
) {
  const approval = approvals.get(approvalId);

  if (!approval) {
    throw new Error("Approval request not found.");
  }

  approval.status = "REJECTED";
  approval.resolvedAt = new Date().toISOString();
  approval.resolvedBy = resolvedBy;

  return approval;
}

export function getApproval(approvalId: string) {
  return approvals.get(approvalId);
}

export function getAllApprovals(): ApprovalRequest[] {
  return Array.from(approvals.values());
}
