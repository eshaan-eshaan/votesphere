// Shared candidate list for the demo "Society Chairperson Election 2026".
// Single source of truth for both the Kiosk ballot and the Admin results panel.
export const candidates = [
  { id: "c1", name: "Alice Johnson", party: "Progressive Future", color: "#3b82f6" },
  { id: "c2", name: "Bob Smith", party: "Liberty Alliance", color: "#ef4444" },
  { id: "c3", name: "Carol Davis", party: "Green Vison", color: "#22c55e" },
  { id: "c4", name: "David Wilson", party: "Tech Forward", color: "#a855f7" }
];

export const getCandidateById = (id) => candidates.find((c) => c.id === id);
