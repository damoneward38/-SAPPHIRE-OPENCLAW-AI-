import { randomUUID } from "crypto";
import type { AuditEntry } from "./types";

const ledger: AuditEntry[] = [];

export function writeAudit(
  entry: Omit<AuditEntry, "id" | "timestamp">
): AuditEntry {
  const record: AuditEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  ledger.push(record);
  if (ledger.length > 2000) {
    ledger.shift();
  }

  return record;
}

export function getAuditLog(limit = 100): AuditEntry[] {
  return ledger.slice(-limit).reverse();
}

export function findAuditByAction(actionId: string): AuditEntry[] {
  return ledger.filter(
    (entry) => entry.actionId === actionId
  );
}

// Alias for backward-compat
export const recordAudit = writeAudit;
export const getAuditLedger = getAuditLog;
