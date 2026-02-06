// src/utils/ledger.js

const LEDGER_KEY = "votesphere_ledger";
const AUDIT_LOG_KEY = "votesphere_auditLog";

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    console.error("Storage read error for", key, e);
    return fallback;
  }
};

// ----- Ledger (encrypted ballots) -----

export const getLedger = () => {
  return readJson(LEDGER_KEY, []);
};

export const appendLedgerEntry = (entry) => {
  try {
    const current = getLedger();
    const updated = [entry, ...current]; // newest first
    localStorage.setItem(LEDGER_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Could not append ledger entry", e);
    return getLedger();
  }
};

// ----- Audit log (events) -----

export const getAuditLog = () => {
  return readJson(AUDIT_LOG_KEY, []);
};

export const appendAuditEvent = (event) => {
  try {
    const current = getAuditLog();
    const entry = {
      ts: new Date().toISOString(),
      ...event,
    };
    const updated = [entry, ...current];
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Could not append audit event", e);
    return getAuditLog();
  }
};
