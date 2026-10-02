require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const prisma = require("./db");
const { initElectionKeys, decryptChoice } = require("./election-keys");
const electionConfig = require("./election-config");
const { getElection } = require("./election-service");
const { seedRegistry } = require("./seed/load-registry");

// Import routes
const authRoutes = require("./routes/auth");
const electionRoutes = require("./routes/election");
const voteRoutes = require("./routes/votes");
const { authenticate } = require("./middleware/auth");

const app = express();
// Trust proxy - required for express-rate-limit behind Render's reverse proxy
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// ---------- Security Middleware ----------

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production",
  crossOriginEmbedderPolicy: false
}));

// CORS - Restrict origins
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));

// Body parsing. A vote carries a ring signature (about 200 bytes per ring
// member), so 64 KB leaves room for a ring of a few hundred voters.
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());

// ---------- Routes ----------

// Health check (public, not rate limited)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rate limiting - applies to the API only, so static assets never count.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    ok: false,
    error: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", limiter);

// Stricter limit on auth routes against password guessing. Only FAILED
// attempts count, and /me (called on every page load) is exempt.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many failed attempts. Please try again in 15 minutes."
  }
});
app.use(
  "/api/auth",
  (req, res, next) => (req.path === "/me" ? next() : authLimiter(req, res, next)),
  authRoutes
);

app.use("/api/election", electionRoutes);
app.use("/api/votes", voteRoutes);

// Aggregate results (authenticated only). Ballots are decrypted on the server,
// in aggregate, purely to tally them; no per-ballot choice is ever returned.
// The tally is sealed until the election is CLOSED: before that the server does
// not decrypt anything, so a running count cannot leak or sway voters.
app.get("/api/stats", authenticate, async (req, res) => {
  try {
    const election = await getElection();
    if (!election || election.status !== "CLOSED") {
      const total = await prisma.vote.count({ where: { electionId: electionConfig.ELECTION_ID } });
      return res.json({ sealed: true, status: election ? election.status : null, total });
    }

    const votes = await prisma.vote.findMany({
      where: { electionId: electionConfig.ELECTION_ID },
      select: { encryptedBallot: true }
    });
    const counts = {};
    let undecryptable = 0;

    for (const v of votes) {
      try {
        const choice = decryptChoice(v.encryptedBallot);
        counts[choice] = (counts[choice] || 0) + 1;
      } catch {
        // Encrypted under a previous (now-rotated) election key.
        undecryptable++;
      }
    }

    res.json({
      total: votes.length,
      byChoice: counts,
      undecryptable,
      accessedBy: req.admin.email
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch stats." });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const path = require("path");

  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, "../dist")));

  // Handle SPA routing, return all requests to React app
  // Express 5 requires named parameters for wildcards: {*splat}
  app.get("{*splat}", (req, res, next) => {
    // Don't serve index.html for API requests that weren't found
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}

// ---------- Error Handler ----------

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode;

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ ok: false, error: "Invalid JSON in request body" });
  }
  // Client errors raised by middleware (e.g. 413 body too large) keep their status.
  if (status >= 400 && status < 500) {
    return res.status(status).json({
      ok: false,
      error: status === 413 ? "Request body too large." : "Bad request."
    });
  }

  console.error("Unhandled server error:", err);
  res.status(500).json({
    ok: false,
    error: process.env.NODE_ENV === "production"
      ? "Unexpected server error."
      : err.message
  });
});

// ---------- Graceful Shutdown ----------

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// ---------- Start Server ----------

// Database setup runs BEFORE the server accepts traffic. A sleeping free-tier
// database can take a few seconds to wake, so connection problems are retried.
async function setUp() {
  const attempts = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      const adminCount = await prisma.admin.count();
      console.log(`Database connected. Admin count: ${adminCount}`);
      const { seeded } = await seedRegistry(prisma, electionConfig);
      console.log(seeded > 0 ? `Seeded ${seeded} synthetic voters.` : "Voter roll already present.");
      await initElectionKeys(prisma, electionConfig.ELECTION_ID);
      return;
    } catch (err) {
      if (err.fatal || attempt >= attempts) throw err;
      console.warn(`Startup attempt ${attempt}/${attempts} failed (${err.message}); retrying in 3s...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

setUp()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\nVoteSphere API running at http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}\n`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
