const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// middleware
app.use(cors());
app.use(express.json());

// path to JSON file
const DATA_FILE = path.join(__dirname, "data", "votes.json");

// helper: read all votes
function readVotes() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading votes.json:", err);
    return [];
  }
}

// helper: write all votes
function writeVotes(votes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(votes, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing votes.json:", err);
  }
}

// health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/votes → return all votes (admin/audit)
app.get("/api/votes", (req, res) => {
  const votes = readVotes();
  res.json(votes);
});

// POST /api/votes → append new vote
app.post("/api/votes", (req, res) => {
  const { electionId, encryptedBallot, choiceId, auditHash } = req.body;

  if (!electionId || !encryptedBallot || !choiceId) {
    return res.status(400).json({ error: "Missing required vote fields" });
  }

  const votes = readVotes();

  const vote = {
    id: "vote_" + Date.now() + "_" + Math.random().toString(16).slice(2),
    electionId,
    encryptedBallot,
    choiceId,
    auditHash: auditHash || null,
    castAt: new Date().toISOString(),
  };

  votes.push(vote);
  writeVotes(votes);

  res.status(201).json({ ok: true, vote });
});

// optional: GET /api/stats → aggregate counts by choiceId
app.get("/api/stats", (req, res) => {
  const votes = readVotes();
  const counts = {};

  for (const v of votes) {
    const key = v.choiceId || "UNKNOWN";
    counts[key] = (counts[key] || 0) + 1;
  }

  res.json({ total: votes.length, byChoice: counts });
});

app.listen(PORT, () => {
  console.log(`VoteSphere API listening at http://localhost:${PORT}`);
});
