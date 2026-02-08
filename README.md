# VoteSphere – Secure Online Voting System

VoteSphere is a full‑stack secure online voting platform that simulates end‑to‑end encrypted elections with verifiable audit trails. It is designed for housing societies, colleges, and internal organizational elections where **fairness, transparency, and privacy** are critical.

---

## 🔍 Problem Statement

Traditional paper‑based or basic online voting systems often suffer from:

- Lack of transparency – voters cannot verify that their vote was counted.
- Risk of tampering – ballot boxes or databases can be manipulated.
- Privacy concerns – admins may see who voted for whom.
- Poor auditability – no public, tamper‑evident log of all ballots.

VoteSphere demonstrates how a modern e‑voting system can enforce **one‑person‑one‑vote**, protect voter privacy, and still allow public verification of results.

---

## ✨ Key Features

### 1. Voter Kiosk (Client‑Side Encryption)

- Mock identity verification with Voter ID.
- Candidate selection for a specific election (e.g., Society Chairperson 2026).
- Client‑side “encryption” panel that shows:
  - `plaintext_choice`
  - `public_key_id`
  - `ciphertext` (simulated)
- Encrypted ballot is sent to the backend; plaintext vote is never stored.
- Voter receives a **Ballot ID + QR code + receipt hash** for later verification.

### 2. Admin Dashboard (Secure Monitoring)

- Restricted admin view with a simple login gate.
- Real‑time stats:
  - Total registered voters (demo value).
  - Votes cast (fetched from backend `/api/votes`).
  - Turnout percentage with smooth animation.
- Conceptual tamper‑proof ledger timeline (blocks with hashes).

### 3. Public Audit Portal (End‑to‑End Verifiability)

- Anyone can:
  - Search their **ballot hash** from the receipt.
  - Confirm that the encrypted ballot was included in the ledger.
- Public table of **all ballot hashes** with block ID, timestamp, and status.
- No candidate or voter identity is revealed – only hashes.

---

## 🏗️ Architecture Overview

VoteSphere follows a simple 3‑tier architecture:

1. **Frontend (Client)**  
   - React + Vite single‑page application.  
   - Hosted as a static site on Render.  
   - Communicates with backend via REST (`fetch`).

2. **Backend API (Server)**  
   - Node.js + Express service.  
   - Exposes endpoints like:
     - `GET /api/health` – health check.
     - `GET /api/votes` – list all stored ballots.
     - `POST /api/votes` – submit a new encrypted ballot.
   - Uses CORS to allow the hosted frontend to call the API.

3. **Data Layer (Ledger Storage)**  
   - Simple append‑only JSON file (`server/data/votes.json`).  
   - Each entry stores:
     - `electionId`, `encryptedBallot`, `choiceId`, `auditHash`, `timestamp`.
   - Designed as a “ledger” abstraction that can later be replaced with a
     database or blockchain without changing the API contract.

A more detailed explanation lives in [`docs/architecture.md`](docs/architecture.md) (you can create this file next).

---

## 🌐 Live Demo

- **Frontend (React app)**:  
  `https://votesphere-frontend-pdua.onrender.com`

- **Backend API (Express)**:  
  `https://votesphere-api-7925.onrender.com`

> Note: Free Render instances may sleep on inactivity; the first request can take a few seconds to respond.

---

## 🧰 Tech Stack

**Frontend**

- React + Vite
- React Router
- CSS modules / custom CSS for UI
- `qrcode.react` for QR code generation

**Backend**

- Node.js
- Express
- CORS
- File‑based JSON storage (`fs` module)

**DevOps / Hosting**

- GitHub for version control
- Render Web Service for the API
- Render Static Site for the frontend
- Environment variables (`VITE_API_URL`) for configurable API base URL

---

## 🚀 Getting Started (Local Setup)

### 1. Clone the repository

```bash
git clone https://github.com/eshaan-eshaan/votesphere.git
cd votesphere
