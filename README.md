# 🗳️ VoteSphere

> **An anonymous, double-vote-resistant online election for a housing society (RWA), built on Linkable Ring Signatures.**
> A demo/portfolio project with a fictional 50-flat electorate. Not a certified election system.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://eshaan-guliani-votesphere-api.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue)](https://react.dev/)

---

## What it does

VoteSphere models how an Indian **RWA (Resident Welfare Association)** election works: one flat, one vote; the registered owner votes; members with dues pending or a disputed title cannot. The electorate here is **synthetic** (`server/seed/voters.synthetic.json`): 50 flats in a fictional two-block society, 46 of them eligible.

The core problem is getting **voter anonymity** and **no double voting** at the same time. VoteSphere does this with:

- **Single-use voting codes.** The Returning Officer (admin) gives each eligible member a unique random code. It works once. (Email delivery is simulated: the admin dashboard shows a one-time distribution sheet.)
- **Ring-key registration.** A voter's browser creates a secret key and registers only the *public* half, using the code. The server stores that key with **no link to the code or the person**.
- **A frozen ring.** When the admin opens voting, the set of registered public keys is frozen into the *ring*.
- **Anonymous ballots.** The voter encrypts their choice with the election public key and signs the ciphertext as "one of the registered voters" (a Linkable Ring Signature). The ballot proves a registered voter cast it, without saying which. A *link tag* in the signature lets the server reject a second ballot from the same key.
- **A public audit ledger.** Every ballot's proof is published; anyone can re-verify it.

## Election lifecycle

`DRAFT` → issue codes → `REGISTRATION` (voters register keys) → freeze ring → `VOTING` → `CLOSED`

| Role | Does |
|---|---|
| **Returning Officer (admin)** | Issues codes, advances the phases, sees aggregate results only |
| **Voter** | Redeems a code once to register a key; casts one ballot |
| **Server** | Verifies signatures against its frozen ring, rejects repeat link tags, stores ciphertext with no identity, tallies in aggregate |
| **Auditor (anyone)** | Reads the ledger and re-verifies ballot proofs |

## How ballot secrecy actually works

- **Anonymity** comes from the ring signature, not from encryption. A ballot carries no voter identity, and ballot times are rounded to 15 minutes so they cannot be matched to registration times.
- **Choice secrecy** comes from a **server-held election keypair** (RSA-OAEP-4096). The browser encrypts the candidate id with the election's *public* key (`GET /api/election/public-key`). The server stores only ciphertext and decrypts it *in aggregate* to tally (`GET /api/stats`, admin only).
- **This is not end-to-end encryption.** The server holds the election private key, so it must be trusted to count honestly and not to look at individual ballots.
- Without `ELECTION_PRIVATE_KEY` set, the key lives in memory and **changes on every restart**, orphaning ballots cast before it. Set it for a stable key (see `server/.env.example`).

## Architecture

```
Browser (React + Vite)                      Server (Node + Express + Prisma)
  Kiosk · Audit · Admin · Landing   HTTPS     /api/election  phases, codes, ring, keys
  lrs ring keys + signing          ───────▶   /api/votes     verify, store, public ledger
  RSA-OAEP encryption (Web Crypto)            /api/auth      admin login (JWT + cookies)
                                              /api/stats     aggregate tally (admin)
                                                    │
                                              SQLite (Prisma): Member, Credential,
                                              RingMember, Vote, Election, Admin
```

## Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, React Router 7, Three.js, Framer Motion |
| **Backend** | Node.js 22, Express 5, Prisma 5 |
| **Database** | SQLite (the schema is PostgreSQL-ready; persistence is not configured, see below) |
| **Crypto** | Linkable Ring Signatures (`lrs`), RSA-OAEP-4096 (Web Crypto / Node crypto), bcrypt, JWT |
| **Deployment** | Render.com |

## Run it locally

```bash
npm install && npm install --prefix server
cp server/.env.example server/.env      # then fill in JWT_SECRET and ADMIN_SETUP_KEY
npm start --prefix server               # API on :5000 (applies the schema and seeds the roll)
npm run dev                             # frontend on :5173
```

Then open `/admin-login`, create an admin with your `ADMIN_SETUP_KEY`, issue codes, and walk the phases. With the API running, `npm run smoke --prefix server -- http://localhost:5000 <ADMIN_SETUP_KEY>` runs an end-to-end API check (it changes the election state, so use a throwaway database).

### Environment variables

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | **Required.** Signs admin tokens; also keys the voting-code hashes. The server refuses to start without it. |
| `ADMIN_SETUP_KEY` | Required to register admin accounts (registration is disabled if unset). Auto-generated on Render. |
| `SUPERADMIN_EMAILS` | Optional comma-separated admin emails allowed to reset the election. |
| `ELECTION_PRIVATE_KEY` | Optional PEM for a stable election key. |
| `CORS_ORIGIN`, `ACCESS_TOKEN_EXPIRY`, `NODE_ENV` | See `server/.env.example`. |

## Key API routes

| Route | Who | Purpose |
|---|---|---|
| `GET /api/election` | public | Phase, candidates, public counts |
| `POST /api/election/register-key` | code holder | Burn a code, register a ring public key |
| `GET /api/election/ring` | public | The frozen ring (once voting opens) |
| `POST /api/votes` | ring member | Cast an encrypted, ring-signed ballot |
| `GET /api/votes`, `/api/votes/:ballotId` | public | Ledger and per-ballot proof |
| `POST /api/election/admin/issue-codes` · `/phase` · `/reset` | admin | Run the election (`reset`: superadmin) |
| `GET /api/stats` | admin | Aggregate tally |

## Known limitations

This is a demonstration, not a production voting system.

- **Not end-to-end.** The server holds the election decryption key (see above).
- **Ring-signature library.** `lrs` is early-stage (v0.1.x) and unaudited, and uses a small 768-bit group. Fine for demonstrating the idea; not for a real election without a cryptographic audit.
- **Codes are bearer credentials.** Whoever controls a voter's code can register their key. A supervised kiosk and ID check mitigate this; the demo does not enforce it.
- **Data doesn't persist.** Render's free tier has no persistent disk, so SQLite data (votes, admins) resets on restart. The roll is re-seeded at boot. A free Postgres is the planned fix.
- **Synthetic electorate; simulated email.** Names, flats, and masked Aadhaar/phone values are fictional.
- **Git history.** Earlier commits included `server/dev.db` and `server/data/votes.json` (a broken `.gitignore` rule, since fixed); the files remain tracked and a history cleanup is planned. Do not commit local database files.

See [docs/adr/ADR-001](docs/adr/ADR-001-voter-registry-and-synthetic-electorate.md) for the design reasoning and measured library behaviour.

## Links

- **Live Demo**: [eshaan-guliani-votesphere-api.onrender.com](https://eshaan-guliani-votesphere-api.onrender.com)
- **Kiosk** `/kiosk` · **Audit** `/audit` · **Admin** `/admin-login`

## 📜 License

MIT License © 2026
