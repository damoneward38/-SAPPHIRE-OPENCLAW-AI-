let emergencyStopped = false;
let stoppedAt: string | null = null;
let stoppedBy: string | null = null;

export function activateKillSwitch(by = "owner") {
  emergencyStopped = true;
  stoppedAt = new Date().toISOString();
  stoppedBy = by;

  return {
    active: emergencyStopped,
    stoppedAt,
    stoppedBy,
  };
}

export function releaseKillSwitch(by = "owner") {
  emergencyStopped = false;
  stoppedAt = null;
  stoppedBy = null;

  return {
    active: emergencyStopped,
    releasedBy: by,
    releasedAt: new Date().toISOString(),
  };
}

export function getKillSwitchStatus() {
  return {
    active: emergencyStopped,
    stoppedAt,
    stoppedBy,
  };
}

export function assertSystemActive() {
  if (emergencyStopped) {
    throw new Error(
      `SIX 686 EMERGENCY STOP ACTIVE. System halted at ${stoppedAt}.`
    );
  }
}
