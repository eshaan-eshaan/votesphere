# 🗳️ VoteSphere

> **Secure End-to-End Encrypted Electronic Voting System with Linkable Ring Signatures**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://eshaan-guliani-votesphere-api.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://react.dev/)

---

## 🔍 Problem Statement

Traditional voting systems face a fundamental dilemma:

| Challenge | Issue |
|-----------|-------|
| **Paper Ballots** | No verifiability, prone to tampering |
| **Simple E-Voting** | Lacks cryptographic security |
| **Blockchain Voting** | Often sacrifices anonymity for transparency |
| **Digital Signatures** | Links vote directly to voter identity |

**The Core Question:** How can we achieve **voter anonymity** AND **vote verifiability** simultaneously?

---

## ✨ Solution: Linkable Ring Signatures

VoteSphere implements **Linkable Ring Signatures (LRS)** — a cryptographic technique that enables:

- 🔐 **Anonymous Signing** — Vote within a group without revealing identity
- 🔗 **Double-Vote Detection** — Key images detect duplicate votes
- ✅ **Public Verification** — Anyone can verify vote authenticity

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React + Vite                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │
│  │  │ Landing  │  │  Kiosk   │  │  Audit   │  │  Admin  │ │    │
│  │  │  (3D)    │  │  Voting  │  │  Portal  │  │Dashboard│ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │    │
│  │                      │                                   │    │
│  │              ┌───────┴───────┐                          │    │
│  │              │  LRS Library  │  ← Client-side crypto    │    │
│  │              └───────────────┘                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Node.js + Express + Prisma                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │ /api/votes   │  │ /api/auth    │  │ /api/admin   │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │  SQLite / Prisma  │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite 7, Three.js, Framer Motion |
| **Backend** | Node.js 22, Express 5, Prisma 5 |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Security** | LRS, JWT, bcrypt, AES-256 |
| **Deployment** | Render.com |

---

## 🚀 Key Features

- **🗳️ Anonymous Voting** — Linkable Ring Signatures ensure voter privacy
- **🔒 E2E Encryption** — Ballots encrypted with AES-256
- **📜 Public Audit Ledger** — Verify your vote without revealing identity
- **📱 QR Code Receipts** — Scannable ballot verification
- **📊 Admin Dashboard** — Real-time election monitoring
- **🎨 3D Visualizations** — Interactive Three.js landing page

---

## 📁 Project Structure

```
votesphere/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── context/           # Auth context
│   └── pages/             # Page components
├── server/                 # Express backend
│   ├── prisma/            # Database schema
│   └── server.js          # API server
├── render.yaml            # Deployment config
└── vite.config.js         # Build config
```

---

## 🔗 Links

- **Live Demo**: [eshaan-guliani-votesphere-api.onrender.com](https://eshaan-guliani-votesphere-api.onrender.com)
- **Kiosk**: `/kiosk` — Cast a vote
- **Audit**: `/audit` — Verify your ballot
- **Admin**: `/admin-login` — Dashboard access

---

## 📜 License

MIT License © 2026
