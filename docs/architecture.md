# VoteSphere Architecture

How the system works today. Design reasoning and measured library behaviour are in [ADR-001](adr/ADR-001-voter-registry-and-synthetic-electorate.md).

## Overview

A single Render web service: an Express API that also serves the built React app. Data lives in PostgreSQL (free Render Postgres in production, which expires after 30 days; any Postgres works) through Prisma, applied with committed migrations. The electorate is a synthetic 50-flat housing society seeded at boot from `server/seed/voters.synthetic.json`.

```
Browser (React + Vite)                         Server (Node 22 + Express 5 + Prisma 5)
  /kiosk  voters: register key, vote             /api/election  state, public key, ring, register-key
  /audit  public ledger + ballot check           /api/votes     verify + store, public ledger
  /admin  Returning Officer dashboard            /api/auth      admin login (JWT + HttpOnly cookies)
  lrs ring keys, ring signing                    /api/stats     aggregate tally (admin only)
  Web Crypto RSA-OAEP encryption                 PostgreSQL: Election, ElectionKey, Member, Credential,
                                                             RingMember, Vote, Admin, RefreshToken
```

## Election lifecycle

`DRAFT` -> (admin issues voting codes) -> `REGISTRATION` -> (admin freezes the ring) -> `VOTING` -> `CLOSED`

1. **Setup.** The admin issues one single-use voting code per eligible member (`VS-XXXX-XXXX-XXXX-XXXX-XXXXC`, 100 random bits). Only an HMAC of each code is stored; the plaintext is shown once as a distribution sheet. Email delivery is simulated.
2. **Key registration.** A voter pastes their code at `/kiosk`. Their browser generates a ring key pair (`lrs`), sends only the public key, and keeps the private key in `localStorage` (with a downloadable backup). The server burns the code and stores the public key in `RingMember` with no link to the code or the member.
3. **Freeze.** The admin opens voting (at least 3 keys required). The registered keys become the **ring**, sorted canonically; its hash is stored. No more keys can join.
4. **Voting.** The browser encrypts the candidate id with the election's RSA-OAEP-4096 public key, fetches the frozen ring, signs the ciphertext with a linkable ring signature, and posts `{electionId, encryptedBallot, signature, ringHash}`.
5. **Server checks** (`server/routes/votes.js`): election is VOTING; ciphertext has the right length; signature is in canonical form and has one component per ring member plus two; it verifies against the **server's own** frozen ring; the ballot decrypts to a real candidate; the key image is unique (database constraint, so races return 409). The ballot is stored with no identity, a time rounded to 15 minutes, and a random id.
6. **Close and tally.** `GET /api/stats` (admin) is sealed while voting is open (it returns only the ballot count and decrypts nothing, so a running tally cannot leak or sway voters). Once the election is `CLOSED` it decrypts ballots in aggregate. `GET /api/votes` and `/api/votes/:ballotId` publish the ledger and per-ballot proofs for re-verification.

## Why the server derives the ring

Measured on `lrs` 0.1.5: the key image changes with the ring's exact members and order; re-cased or zero-padded signatures still verify; and `verify` accepts rings of one, duplicates and garbage keys. So the server never trusts a client ring: it freezes one canonical ring of validated, subgroup-checked public keys and rejects non-canonical signatures. This also keeps requests small (a 46-voter ballot is about 10 KB).

## Anonymity and trust

- A ballot carries no voter identity; the ring signature hides which registered voter signed. Credentials and ring keys are stored unlinked, and registration and ballot times are bucketed to 15 minutes.
- The server holds the election private key, so it can read any single ballot it chooses to decrypt. This is **not** end-to-end encryption; the server must be trusted to tally honestly. It is also trusted not to correlate request timing across registration and voting.
- Whoever controls a voter's code can register their key (a bearer credential). A supervised kiosk and ID check mitigate this; the demo does not enforce them.

## Admin and security

- Admin accounts: bcrypt (cost 12), JWT access tokens (15 min) with rotating refresh tokens in HttpOnly cookies. Registration requires `ADMIN_SETUP_KEY` (compared in constant time); the server refuses to start without `JWT_SECRET`.
- Rate limits: failed auth attempts (10 / 15 min; `/me` exempt), failed code redemptions (20 / 15 min), general API (300 / 15 min). Static assets are not limited.
- `SUPERADMIN_EMAILS` grants the role needed to reset the election and delete votes.

## Known limits

- **Persistence.** Everything, including the election private key, lives in PostgreSQL. The key is stored encrypted (AES-256-GCM) under a key derived from `JWT_SECRET`; if `JWT_SECRET` changes while ballots exist, the server refuses to start rather than orphan them. `ELECTION_PRIVATE_KEY` can override the stored key. Free-tier hosts sleep when idle and the free database auto-suspends, so first requests can be slow; startup retries while the database wakes.
- `lrs` is early-stage, unaudited, and uses a 768-bit group.
- One post (President) and one election; the synthetic roll is fictional.
