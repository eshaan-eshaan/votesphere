require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const prisma = require("./db");
const lrs = require("lrs");


// Import routes
const authRoutes = require("./routes/auth");
const { authenticate, optionalAuth } = require("./middleware/auth");

const app = express();
// const prisma = new PrismaClient(); // Removed as it is now imported from ./db
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

// Rate limiting - Prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    ok: false,
    error: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth attempts per window
  message: {
    ok: false,
    error: "Too many login attempts. Please try again in 15 minutes."
  }
});

// Body parsing with size limits
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ---------- Error Handlers ----------

// JSON parse errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    console.error("Invalid JSON body:", err.message);
    return res.status(400).json({
      ok: false,
      error: "Invalid JSON in request body"
    });
  }
  next(err);
});

// ---------- Routes ----------

// Health check (public)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes (with stricter rate limiting)
app.use("/api/auth", authLimiter, authRoutes);

// ---------- Vote Routes ----------

// Get all votes (optionally authenticated - shows more data if authenticated)
app.get("/api/votes", optionalAuth, async (req, res) => {
  try {
    const votes = await prisma.vote.findMany({
      orderBy: { castAt: "desc" },
      take: 100 // Limit to last 100 votes for performance
    });

    // If authenticated, include more details
    if (req.admin) {
      res.json(votes);
    } else {
      // Public view - hide some sensitive fields
      const publicVotes = votes.map(v => ({
        ballotId: v.ballotId,
        electionId: v.electionId,
        encryptedBallot: v.encryptedBallot,
        signature: v.signature,
        keyImage: v.keyImage,
        ringSize: v.ringSize,
        castAt: v.castAt
      }));
      res.json(publicVotes);
    }
  } catch (error) {
    console.error("Error fetching votes:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch votes." });
  }
});

// Create a new vote (public - voters submit here)
// Create a new vote (public - voters submit here)
app.post("/api/votes", async (req, res) => {
  try {
    const {
      electionId,
      encryptedBallot,
      choiceId,
      signature,
      ring,
      voterIdHash // Optional now
    } = req.body || {};

    // Validation
    const errors = [];
    if (!electionId) errors.push("electionId is required.");
    if (!encryptedBallot) errors.push("encryptedBallot is required.");
    if (!choiceId) errors.push("choiceId is required.");
    if (!signature) errors.push("Ring signature is required.");
    if (!ring || !Array.isArray(ring)) errors.push("Ring public keys are required.");

    if (errors.length > 0) {
      return res.status(400).json({ ok: false, error: "Invalid vote payload.", details: errors });
    }

    // 1. Verify Ring Signature
    try {
      const isValid = lrs.verify(ring, signature, encryptedBallot);
      if (!isValid) {
        return res.status(400).json({ ok: false, error: "Invalid Ring Signature. Authentication failed." });
      }
    } catch (e) {
      console.error("Signature verification error:", e);
      return res.status(400).json({ ok: false, error: "Malformed signature or ring." });
    }

    // 2. Extract Key Image (Linkability Tag)
    const parts = signature.split("_");
    if (!parts || parts.length < 2) {
      return res.status(400).json({ ok: false, error: "Invalid signature format." });
    }
    const keyImage = parts[0];

    // 3. Double Voting Check (Linkability)
    const existingVote = await prisma.vote.findUnique({
      where: { keyImage }
    });

    if (existingVote) {
      console.warn(`Double voting attempt detected! Key Image: ${keyImage}`);
      return res.status(409).json({ ok: false, error: "Double voting detected. This identity has already cast a vote." });
    }

    // Create vote
    const ballotId = `ballot_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const vote = await prisma.vote.create({
      data: {
        ballotId,
        electionId: electionId.trim(),
        encryptedBallot: encryptedBallot.trim(),
        choiceId: choiceId.trim(),
        voterIdHash: voterIdHash || "ANONYMOUS_RING_MEMBER",
        signature: signature,
        keyImage: keyImage,
        ringSize: ring.length,
        castAt: new Date()
      }
    });

    console.log(`Vote recorded: ${ballotId} (Ring Size: ${ring.length})`);

    return res.status(201).json({ ok: true, vote, transactionHash: vote.ballotId });
  } catch (error) {
    console.error("Error storing vote:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to record vote."
    });
  }
});

// Get vote statistics (authenticated only)
app.get("/api/stats", authenticate, async (req, res) => {
  try {
    const votes = await prisma.vote.findMany();
    const counts = {};

    for (const v of votes) {
      const key = v.choiceId || "UNKNOWN";
      counts[key] = (counts[key] || 0) + 1;
    }

    res.json({
      total: votes.length,
      byChoice: counts,
      accessedBy: req.admin.email
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch stats." });
  }
});

// Delete all votes (superadmin only - for testing)
app.delete("/api/votes", authenticate, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res.status(403).json({
        ok: false,
        error: "Only superadmin can delete votes."
      });
    }

    const result = await prisma.vote.deleteMany();
    console.log(`All votes deleted by ${req.admin.email}`);

    res.json({
      ok: true,
      message: `Deleted ${result.count} votes.`
    });
  } catch (error) {
    console.error("Error deleting votes:", error);
    res.status(500).json({ ok: false, error: "Failed to delete votes." });
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

// ---------- Fallback Error Handler ----------

app.use((err, req, res, next) => {
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

app.listen(PORT, async () => {
  console.log(`\n🗳️  VoteSphere API running at http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}\n`);

  try {
    const adminCount = await prisma.admin.count();
    console.log(`✅ Database connected. Admin count: ${adminCount}`);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }

  // Keep process alive
  setInterval(() => { }, 10000);
});
