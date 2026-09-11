# VoteSphere Architecture

## 1. High-Level Overview

VoteSphere is a full-stack web application for demonstrating secure, verifiable online voting. It's a single Render web service:

- **Client (Frontend)** – React + Vite single-page app.
- **Server (Backend API)** – Node.js + Express app, exposing a small REST API and serving the built frontend in production.
- **Data Layer** – SQLite via Prisma ORM (`server/prisma/schema.prisma`), with `Admin`, `Vote`, and `RefreshToken` tables.

The design goal is to demonstrate **voter anonymity** (via linkable ring signatures) and **choice secrecy** (via an election-held encryption keypair) without heavy infrastructure.

---

## 2. Main Components

### 2.1 Frontend (React + Vite)

- **Pages**
  - `Landing` – entry point with navigation to Kiosk, Admin, Audit.
  - `KioskDemo` – voter flow: identity verification, ring generation, candidate selection, client-side encryption of the choice, ring-signature signing, submission.
  - `AdminDashboard` – turnout stats, decrypted per-candidate results, and a live ballot feed.
  - `Audit` – public ledger of ballot hashes; lets a voter confirm their ballot was recorded.
  - `AdminLogin` – admin login/registration (registration requires a shared setup key).

- **Utilities**
  - `utils/ring-signature.js` – wraps the `lrs` npm package: identity generation, ring signing/verification, key-image extraction.
  - `utils/crypto.js` – Web Crypto helpers (RSA-OAEP for ballot encryption, ECDSA for signature verification demos).
  - `data/candidates.js` – shared candidate list used by both the Kiosk ballot and the Admin results panel.
  - API base URL comes from `src/config.js` (relative path in production, `http://localhost:5000` in dev).

### 2.2 Backend (Node + Express)

- **Server Entry (`server/server.js`)** – Express app with helmet, CORS, rate limiting, and:
  - `GET /api/health` – health check.
  - `GET /api/election/public-key` – the election's RSA-OAEP public key (public).
  - `GET /api/votes` – public ballot list (never includes the choice, even for admins).
  - `POST /api/votes` – cast a vote: verifies the ring signature, checks the key image for double-voting, stores the encrypted ballot.
  - `GET /api/stats` – admin-only; decrypts each ballot server-side to compute per-candidate tallies.
  - `DELETE /api/votes` – superadmin-only, for resetting demo data.
  - `/api/auth/*` – register (setup-key gated), login, refresh, logout, change-password.
- **`server/election-keys.js`** – holds the election's RSA-OAEP-4096 keypair (loaded from `ELECTION_PRIVATE_KEY` if set, else generated in memory at boot) and exposes `getPublicKeyJwk()` / `decryptChoice()`.
- **`server/config.js`** – centralizes `JWT_SECRET` / `ADMIN_SETUP_KEY` reads; the server refuses to start without `JWT_SECRET` set.
- **Data Store** – SQLite via Prisma (`server/prisma/schema.prisma`), applied on every deploy via `prisma db push` (see `render.yaml`).

---

## 3. Request & Data Flow

### 3.1 Casting a Vote (Kiosk → API → Database)

1. Voter opens the **Kiosk** page. The client fetches the election's public key from `GET /api/election/public-key`.
2. After identity "verification" (demo), the client generates a ring identity plus decoys (`lrs.gen()`), forming an anonymity ring.
3. On candidate selection, the client encrypts the candidate id with the election's public key (Web Crypto, RSA-OAEP/SHA-256) - this ciphertext is the only thing that ever leaves the browser carrying the choice.
4. The client signs the ciphertext with a linkable ring signature (`lrs.sign`) over the anonymity ring.
5. `POST /api/votes` sends `{ electionId, encryptedBallot, signature, ring }` - **no plaintext choice is ever transmitted**.
6. Server: verifies the ring signature (`lrs.verify`), extracts the key image from the signature and rejects the vote if it's already been used (double-vote protection), then stores the encrypted ballot.
7. Client displays a **Vote Receipt** with the ballot ID and a QR code encoding it.

### 3.2 Admin View (API → Dashboard)

1. Admin logs in (JWT cookie-based session).
2. `GET /api/stats` (authenticated): server decrypts every stored ballot with the election private key and returns per-candidate counts. Ballots that fail to decrypt (e.g. encrypted under a since-rotated election key) are counted separately and skipped, never crash the endpoint.
3. Dashboard renders live per-candidate results, turnout, and a feed of recent ballots (metadata only - no choice data is ever included in `GET /api/votes`, authenticated or not).

### 3.3 Public Audit

1. Anyone can open **Audit** and fetch `GET /api/votes` (unauthenticated) - ballot IDs, signatures, key images, timestamps, but never a choice.
2. A voter pastes their receipt's ballot ID to confirm it's present in the ledger.

---

## 4. Security & Privacy Design

- **Voter Anonymity** – Linkable Ring Signatures. A voter signs within a ring of decoy public keys; the signature can't be traced to a specific ring member, but a key image derived from the signer's key lets the server detect and reject a second vote from the same identity.
- **Choice Secrecy** – The candidate choice is encrypted client-side with the election's public key before it ever reaches the server. The matching private key lives only on the server (`server/election-keys.js`) and is used only to compute aggregate tallies (`GET /api/stats`), never exposed via any per-ballot endpoint.
- **Tamper-Evident Ledger** – Each ballot has a unique `ballotId` and a unique `keyImage` (enforced at the database level). The public audit ledger exposes all ballot IDs so observers can independently check for missing or duplicate entries.

---

## 5. Deployment Architecture

- Single Render **Web Service** (see `render.yaml`), built from the repo root:
  - `npm install && npm install --prefix server && cd server && npx prisma generate && npx prisma db push --accept-data-loss && cd .. && npm run build`
  - `node server/server.js` serves both the API and the built React app (`dist/`) from one origin.
- Environment variables (`render.yaml`): `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET` (auto-generated), `ADMIN_SETUP_KEY` (auto-generated).
- **Known limitation**: Render's free tier has no persistent disk, so SQLite data (and, unless `ELECTION_PRIVATE_KEY` is set, the election keypair) resets on every restart/deploy. See the README's Known Limitations section.

---

## 6. Future Architecture Enhancements

- Add persistent storage (managed Postgres, or a paid Render instance with a persistent disk) so votes and admin accounts survive restarts.
- Set a stable `ELECTION_PRIVATE_KEY` once persistence is in place, so ballots remain decryptable across restarts.
- Clean up the git history that still contains previously-committed database snapshots.
- Multi-election support, voter registration, and a security audit of the `lrs` ring-signature library before any real-world use.
