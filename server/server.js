const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
// Use Render/Heroku-style PORT in production, 5000 locally.
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// Central error handler for malformed JSON, etc.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    console.error("Invalid JSON body:", err.message);
    return res.status(400).json({
      ok: false,
      error: "Invalid JSON in request body",
    });
  }
  next(err);
});

// ---------- File paths & helpers ----------
const DATA_FILE = path.join(__dirname, "data", "votes.json");

// small helper: validate required string fields
function isNonEmptyString(value, maxLength = 255) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function readVotes() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    if (!raw.trim()) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading votes.json:", err);
    // In a real system we might surface this as 500,
    // but for now we just treat it as "no votes".
    return [];
  }
}

function writeVotes(votes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(votes, null, 2), "utf-8");
}

// ---------- Routes ----------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get all votes (admin/audit)
app.get("/api/votes", (req, res) => {
  const votes = readVotes();
  res.json(votes);
});

// Create a new vote
app.post("/api/votes", (req, res) => {
  try {
    const { electionId, encryptedBallot, choiceId, auditHash } = req.body || {};
    const errors = [];

    if (!isNonEmptyString(electionId, 100)) {
      errors.push("electionId is required and must be a non-empty string.");
    }
    if (!isNonEmptyString(encryptedBallot, 4000)) {
      errors.push("encryptedBallot is required and must be a non-empty string.");
    }
    if (!isNonEmptyString(choiceId, 100)) {
      errors.push("choiceId is required and must be a non-empty string.");
    }
    // For verifiable audit we treat auditHash as required too.
    if (!isNonEmptyString(auditHash, 512)) {
      errors.push("auditHash is required and must be a non-empty string.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "Invalid vote payload.",
        details: errors,
      });
    }

    const votes = readVotes();

    const vote = {
      id: "vote_" + Date.now() + "_" + Math.random().toString(16).slice(2),
      electionId: electionId.trim(),
      encryptedBallot: encryptedBallot.trim(),
      choiceId: choiceId.trim(),
      auditHash: auditHash.trim(),
      castAt: new Date().toISOString(),
    };

    votes.push(vote);
    writeVotes(votes);

    return res.status(201).json({ ok: true, vote });
  } catch (err) {
    console.error("Error while storing vote:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error while storing vote.",
    });
  }
});

// Aggregate stats for admin (optional)
app.get("/api/stats", (req, res) => {
  const votes = readVotes();
  const counts = {};

  for (const v of votes) {
    const key = v.choiceId || "UNKNOWN";
    counts[key] = (counts[key] || 0) + 1;
  }

  res.json({ total: votes.length, byChoice: counts });
});

// Fallback error handler (any uncaught errors)
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ ok: false, error: "Unexpected server error." });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`VoteSphere API listening at http://localhost:${PORT}`);
});
