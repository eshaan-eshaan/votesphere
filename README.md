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
- The election key is generated once and stored in the database, **encrypted** with a key derived from `JWT_SECRET`, so it survives restarts with no setup. If `JWT_SECRET` is ever changed while ballots exist, the server refuses to start rather than orphan them (restore the old secret, or set `ELECTION_PRIVATE_KEY`).

## Architecture

```
Browser (React + Vite)                      Server (Node + Express + Prisma)
  Kiosk · Audit · Admin · Landing   HTTPS     /api/election  phases, codes, ring, keys
  lrs ring keys + signing          ───────▶   /api/votes     verify, store, public ledger
  RSA-OAEP encryption (Web Crypto)            /api/auth      admin login (JWT + cookies)
                                              /api/stats     aggregate tally (admin)
                                                    │
                                              PostgreSQL (Prisma): Member, Credential,
                                              RingMember, Vote, Election, Admin
```

## Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, React Router 7, Three.js, Framer Motion |
| **Backend** | Node.js 22, Express 5, Prisma 5 |
| **Database** | PostgreSQL (free Neon tier on Render; any Postgres works) via Prisma migrations |
| **Crypto** | Linkable Ring Signatures (`lrs`), RSA-OAEP-4096 (Web Crypto / Node crypto), bcrypt, JWT |
| **Deployment** | Render.com |

## Quick start with Docker (recommended)

One command runs the app and its PostgreSQL database on your machine, with no accounts and nothing else to install:

```bash
npm run docker:up        # creates .env with random secrets, builds, and starts everything
```

Then open **http://localhost:5000**, go to `/admin-login`, choose *Create Account*, and use the setup key the command printed (it is also in `.env`). Data lives in a Docker volume, so it survives `docker compose down` and restarts; `docker compose down -v` wipes it. To allow the *Reset election* button, put your admin email in `SUPERADMIN_EMAILS` in `.env` and run `docker compose up -d`.

This setup is for local use and demos (the database password is a throwaway and the database port is bound to `127.0.0.1`). For a public link, deploy to Render with a hosted database (below).

## Run it locally without Docker for the app

You still need a PostgreSQL database. Docker is the quickest way to get one:

```bash
docker run -d --name votesphere-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=votesphere -p 5433:5432 postgres:16-alpine
npm install && npm install --prefix server
cp server/.env.example server/.env      # set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/votesphere, JWT_SECRET, ADMIN_SETUP_KEY
npm start --prefix server               # applies migrations, seeds the roll; API on :5000
npm run dev                             # frontend on :5173
```

Then open `/admin-login`, create an admin with your `ADMIN_SETUP_KEY`, issue codes, and walk the phases. With the API running, `npm run smoke --prefix server -- http://localhost:5000 <ADMIN_SETUP_KEY>` runs an end-to-end API check (it changes the election state, so use a throwaway database).

## Deploy on Render with a free Postgres

1. Create a free project at [neon.tech](https://neon.tech) and copy its **direct** (non-pooled) connection string, keeping `?sslmode=require`.
2. In the Render dashboard, open the service, then **Environment**, and add `DATABASE_URL` with that string. (`JWT_SECRET` and `ADMIN_SETUP_KEY` are generated by `render.yaml`; read `ADMIN_SETUP_KEY` there to register the first admin.)
3. Deploy. The build runs `prisma migrate deploy` (it never drops data); the server seeds the roll and creates the election key on first start. Data and the key then persist across restarts and redeploys.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | **Required.** PostgreSQL connection string. |
| `JWT_SECRET` | **Required.** Signs admin tokens; also keys the voting-code hashes and the election-key encryption. Do not change it once an election has ballots. |
| `ADMIN_SETUP_KEY` | Required to register admin accounts (registration is disabled if unset). Auto-generated on Render. |
| `SUPERADMIN_EMAILS` | Optional comma-separated admin emails allowed to reset the election. |
| `ELECTION_PRIVATE_KEY` | Optional PEM that overrides the database-stored election key. Normally leave unset. |
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
- **Free-tier hosting limits.** Data is persistent (PostgreSQL), but Render's free web service sleeps when idle and takes about a minute to wake, and the free Neon database also auto-suspends (the server retries startup while it wakes). This is not a high-availability setup.
- **Synthetic electorate; simulated email.** Names, flats, and masked Aadhaar/phone values are fictional.
- **Git history.** Earlier commits included `server/dev.db` and `server/data/votes.json` (a broken `.gitignore` rule, since fixed); the files remain tracked and a history cleanup is planned. Do not commit local database files.

See [docs/adr/ADR-001](docs/adr/ADR-001-voter-registry-and-synthetic-electorate.md) for the design reasoning and measured library behaviour.

## Links

- **Live Demo**: [eshaan-guliani-votesphere-api.onrender.com](https://eshaan-guliani-votesphere-api.onrender.com)
- **Kiosk** `/kiosk` · **Audit** `/audit` · **Admin** `/admin-login`

## 📜 License

MIT License © 2026
