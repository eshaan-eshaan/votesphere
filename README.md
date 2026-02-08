# 📦 VoteSphere - Complete Project Documentation

> **A Secure End-to-End Encrypted Electronic Voting System with Linkable Ring Signatures**

---

## 📋 Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Objectives](#2-objectives)
3. [Software Requirements Specification (SRS)](#3-software-requirements-specification-srs)
4. [Product Requirements Document (PRD)](#4-product-requirements-document-prd)
5. [Architecture Summary](#5-architecture-summary)
6. [Tech Stack Summary](#6-tech-stack-summary)
7. [Key Features](#7-key-features)
8. [CV-Ready Description](#8-cv-ready-description)
9. [Presentation Slides Content](#9-presentation-slides-content)

---

## 1. Problem Statement

### 1.1 Background
Traditional voting systems face significant challenges in ensuring voter privacy while maintaining election integrity. Paper-based systems are prone to tampering and lack transparency, while existing electronic voting solutions often fail to provide cryptographic proof of vote integrity without compromising voter anonymity.

### 1.2 Problem Definition
**How can we design an electronic voting system that provides:**
- **Voter Anonymity**: No one can link a vote to a specific voter
- **Vote Verifiability**: Voters can verify their vote was counted correctly
- **Double-Vote Prevention**: No voter can cast multiple votes
- **Transparency**: All votes are publicly auditable without revealing voter identity

### 1.3 Existing Solutions & Limitations

| Solution | Limitation |
|----------|------------|
| Paper Ballots | No verifiability, prone to human error |
| Simple E-Voting | Lacks cryptographic security, can be tampered |
| Blockchain Voting | Often sacrifices anonymity for transparency |
| Traditional Digital Signatures | Links vote to voter identity |

### 1.4 Proposed Solution
**VoteSphere** implements **Linkable Ring Signatures (LRS)** - a cryptographic technique that allows:
- A voter to sign their vote anonymously within a group (ring)
- Detection of duplicate votes without revealing the voter's identity
- Public verification of vote authenticity

---

## 2. Objectives

### 2.1 Primary Objectives

| # | Objective | Success Criteria |
|---|-----------|------------------|
| O1 | Implement anonymous voting using Linkable Ring Signatures | Vote cannot be traced to voter |
| O2 | Prevent double voting cryptographically | Duplicate key images are rejected |
| O3 | Enable voter verification through audit page | Voter can verify their ballot hash |
| O4 | Provide real-time election monitoring | Admin dashboard shows live results |
| O5 | Ensure end-to-end encryption of ballots | Ballot content is encrypted at rest |

### 2.2 Secondary Objectives

- Create an intuitive, accessible voting interface
- Implement secure admin authentication with JWT tokens
- Support QR code generation for receipt verification
- Deploy as a scalable web application

### 2.3 Learning Objectives (Academic)

- Understanding of cryptographic voting protocols
- Implementation of ring signature schemes
- Full-stack web development with React and Node.js
- Database design with Prisma ORM
- Cloud deployment on Render.com

---

## 3. Software Requirements Specification (SRS)

### 3.1 Introduction

#### 3.1.1 Purpose
This SRS document describes the functional and non-functional requirements for VoteSphere, an end-to-end encrypted electronic voting demonstration system.

#### 3.1.2 Scope
VoteSphere is a web-based voting system demonstrating cryptographic voting principles. It is intended for educational and demonstration purposes.

#### 3.1.3 Definitions & Acronyms

| Term | Definition |
|------|------------|
| LRS | Linkable Ring Signature - cryptographic scheme for anonymous signing |
| Key Image | Unique identifier derived from signer's private key (detects double voting) |
| Ring | Group of public keys used to anonymize the signer |
| Ballot ID | Unique identifier for each vote cast |
| E2EE | End-to-End Encryption |

### 3.2 Overall Description

#### 3.2.1 Product Perspective
VoteSphere is a standalone web application consisting of:
- **Frontend**: React-based SPA with 3D visualizations
- **Backend**: Node.js/Express REST API
- **Database**: SQLite (demo) / PostgreSQL (production)

#### 3.2.2 User Classes

| User Type | Description | Capabilities |
|-----------|-------------|--------------|
| Voter | Anonymous user casting votes | Cast vote, receive receipt, verify vote |
| Admin | Authenticated administrator | View results, monitor elections, manage system |
| Auditor | Public user verifying votes | Search and verify ballots on audit page |

#### 3.2.3 Operating Environment
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Server**: Node.js 18+ runtime
- **Database**: SQLite 3.x or PostgreSQL 14+

### 3.3 Functional Requirements

#### FR-001: Anonymous Vote Casting
| Attribute | Description |
|-----------|-------------|
| ID | FR-001 |
| Priority | High |
| Description | Voter can cast a vote anonymously using linkable ring signatures |
| Input | Candidate selection, voter's private key (generated client-side) |
| Output | Signed ballot, receipt with ballot ID |
| Precondition | Election is active |
| Postcondition | Vote is recorded in ledger with encrypted ballot |

#### FR-002: Double Vote Prevention
| Attribute | Description |
|-----------|-------------|
| ID | FR-002 |
| Priority | High |
| Description | System rejects votes with duplicate key images |
| Input | Ballot with ring signature |
| Output | Error message if key image exists |
| Validation | Key image uniqueness check in database |

#### FR-003: Vote Verification
| Attribute | Description |
|-----------|-------------|
| ID | FR-003 |
| Priority | High |
| Description | Voter can verify their vote exists in the public ledger |
| Input | Ballot ID (hash) from receipt |
| Output | Confirmation of vote presence and timestamp |

#### FR-004: Admin Authentication
| Attribute | Description |
|-----------|-------------|
| ID | FR-004 |
| Priority | Medium |
| Description | Secure JWT-based authentication for admin access |
| Input | Email, password |
| Output | Access token, refresh token |
| Security | Passwords hashed with bcrypt, tokens expire |

#### FR-005: Real-time Results Dashboard
| Attribute | Description |
|-----------|-------------|
| ID | FR-005 |
| Priority | Medium |
| Description | Admin can view live vote counts and statistics |
| Output | Vote counts per candidate, participation rate, timestamps |

#### FR-006: QR Code Receipt Generation
| Attribute | Description |
|-----------|-------------|
| ID | FR-006 |
| Priority | Low |
| Description | Generate QR code containing ballot verification link |
| Output | Scannable QR code with ballot ID |

### 3.4 Non-Functional Requirements

#### NFR-001: Security
- All ballot content encrypted with AES-256
- Ring signatures provide voter anonymity
- HTTPS enforced in production
- JWT tokens with short expiration (15 min access, 7 day refresh)

#### NFR-002: Performance
- Page load time < 3 seconds
- Vote submission < 2 seconds
- Support 100+ concurrent voters (demo scale)

#### NFR-003: Usability
- Accessible design (WCAG 2.1 AA compliance target)
- Mobile-responsive interface
- Intuitive voting flow (< 5 clicks to cast vote)

#### NFR-004: Reliability
- 99% uptime target
- Graceful error handling
- Database transaction integrity

#### NFR-005: Scalability
- Stateless API design
- Horizontal scaling capability
- Database connection pooling

### 3.5 Use Case Diagrams

```
┌─────────────────────────────────────────────────────────────┐
│                        VoteSphere                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │   ┌─────────┐         ┌─────────────────────────┐   │   │
│  │   │  Voter  │────────▶│  Cast Anonymous Vote     │   │   │
│  │   └─────────┘         └─────────────────────────┘   │   │
│  │        │              ┌─────────────────────────┐   │   │
│  │        └─────────────▶│  Verify Vote (Audit)    │   │   │
│  │                       └─────────────────────────┘   │   │
│  │                                                       │   │
│  │   ┌─────────┐         ┌─────────────────────────┐   │   │
│  │   │  Admin  │────────▶│  View Election Results  │   │   │
│  │   └─────────┘         └─────────────────────────┘   │   │
│  │        │              ┌─────────────────────────┐   │   │
│  │        └─────────────▶│  Monitor Participation  │   │   │
│  │                       └─────────────────────────┘   │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.6 Data Flow Diagram

```
                    ┌──────────────┐
                    │    Voter     │
                    └──────┬───────┘
                           │ 1. Select Candidate
                           ▼
                    ┌──────────────┐
                    │   Frontend   │
                    │  (React SPA) │
                    └──────┬───────┘
                           │ 2. Generate Ring Signature
                           │    (Client-side LRS)
                           ▼
                    ┌──────────────┐
                    │   Backend    │
                    │  (Express)   │
                    └──────┬───────┘
                           │ 3. Validate Signature
                           │ 4. Check Key Image
                           │ 5. Store Encrypted Ballot
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    │  (Prisma)    │
                    └──────┬───────┘
                           │ 6. Return Ballot ID
                           ▼
                    ┌──────────────┐
                    │   Receipt    │
                    │  (QR Code)   │
                    └──────────────┘
```

---

## 4. Product Requirements Document (PRD)

### 4.1 Product Overview
**VoteSphere** is a demonstration platform showcasing how cryptographic techniques can enable secure, anonymous, and verifiable electronic voting.

### 4.2 Target Users

| Persona | Description | Goals |
|---------|-------------|-------|
| **Student/Researcher** | Learning about cryptographic voting | Understand LRS implementation |
| **Election Official** | Evaluating e-voting solutions | See practical demo of secure voting |
| **Developer** | Building voting systems | Reference implementation |

### 4.3 User Stories

#### Epic 1: Voting
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US-01 | As a voter, I want to cast my vote anonymously | Vote is recorded without linking to my identity |
| US-02 | As a voter, I want a receipt to verify my vote later | Receive ballot ID and QR code after voting |
| US-03 | As a voter, I want to verify my vote was counted | Can search for my ballot on audit page |

#### Epic 2: Administration
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US-04 | As an admin, I want to view live results | Dashboard shows vote counts in real-time |
| US-05 | As an admin, I want secure login | JWT authentication with token refresh |
| US-06 | As an admin, I want to see participation metrics | View total votes, ring sizes, timestamps |

#### Epic 3: Auditing
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US-07 | As an auditor, I want to see all cast votes | Public ledger shows all ballot IDs |
| US-08 | As an auditor, I want to verify vote integrity | Can check signature validity |

### 4.4 Feature Prioritization (MoSCoW)

| Priority | Features |
|----------|----------|
| **Must Have** | Anonymous voting, LRS implementation, Vote verification, Admin dashboard |
| **Should Have** | QR code receipts, Responsive design, JWT authentication |
| **Could Have** | 3D visualizations, Dark mode, Export results |
| **Won't Have (v1)** | Blockchain integration, Multi-election support, Voter registration |

### 4.5 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Vote Cast Success Rate | > 99% | Successful submissions / attempts |
| Verification Accuracy | 100% | Valid ballots found on audit |
| Page Load Time | < 3s | Lighthouse performance score |
| Security Audit | Pass | No critical vulnerabilities |

---

## 5. Architecture Summary

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     React SPA (Vite)                          │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │  │
│  │  │ Landing │  │  Kiosk  │  │  Audit  │  │ Admin Dashboard │  │  │
│  │  │  Page   │  │  Demo   │  │  Page   │  │                 │  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘  │  │
│  │                      │                                         │  │
│  │              ┌───────┴───────┐                                │  │
│  │              │  LRS Library  │  (Client-side cryptography)    │  │
│  │              │  (lrs npm)    │                                │  │
│  │              └───────────────┘                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (REST API)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVER TIER                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   Node.js / Express                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │ Auth Routes │  │ Vote Routes │  │ Admin Routes        │   │  │
│  │  │ /api/auth/* │  │ /api/votes  │  │ /api/admin/*        │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │
│  │                          │                                     │  │
│  │              ┌───────────┴───────────┐                        │  │
│  │              │    Prisma ORM         │                        │  │
│  │              └───────────────────────┘                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA TIER                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   SQLite / PostgreSQL                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │    Admin    │  │    Vote     │  │   RefreshToken      │   │  │
│  │  │   Table     │  │   Table     │  │      Table          │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Navbar     │    │ AuthContext  │    │ ScrollLayout │  │
│  │  Component   │    │  (Provider)  │    │  Component   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  KioskDemo   │    │    Audit     │    │    Admin     │  │
│  │    Page      │    │    Page      │    │  Dashboard   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ SecurityScene│    │  Landing     │                       │
│  │   (3D/R3F)  │    │    Page      │                       │
│  └──────────────┘    └──────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Database Schema

```
┌─────────────────────┐     ┌─────────────────────┐
│       Admin         │     │    RefreshToken     │
├─────────────────────┤     ├─────────────────────┤
│ id: String (PK)     │◄────│ adminId: String (FK)│
│ email: String (UK)  │     │ id: String (PK)     │
│ passwordHash: String│     │ token: String (UK)  │
│ role: String        │     │ expiresAt: DateTime │
│ createdAt: DateTime │     │ createdAt: DateTime │
│ updatedAt: DateTime │     └─────────────────────┘
└─────────────────────┘

┌─────────────────────────────┐
│           Vote              │
├─────────────────────────────┤
│ id: String (PK)             │
│ ballotId: String (UK)       │  ◄── Public identifier
│ electionId: String          │
│ encryptedBallot: String     │  ◄── AES encrypted
│ choiceId: String            │
│ voterIdHash: String         │
│ keyImage: String (UK)       │  ◄── LRS key image
│ ringSize: Int               │
│ signature: String           │  ◄── Ring signature
│ signingPublicKey: String    │
│ castAt: DateTime            │
└─────────────────────────────┘
```

### 5.4 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Layers                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 1: Transport Security                            │ │
│  │ • HTTPS/TLS encryption                                 │ │
│  │ • Secure headers (CORS, CSP)                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 2: Authentication                                │ │
│  │ • JWT access tokens (15 min expiry)                   │ │
│  │ • Refresh token rotation                              │ │
│  │ • bcrypt password hashing                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 3: Cryptographic Voting                          │ │
│  │ • Linkable Ring Signatures (anonymity)                │ │
│  │ • Key Images (double-vote prevention)                 │ │
│  │ • AES-256 ballot encryption                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 4: Data Integrity                                │ │
│  │ • Database transactions                               │ │
│  │ • Unique constraints on key images                    │ │
│  │ • Immutable vote records                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Tech Stack Summary

### 6.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework |
| **Vite** | 7.x | Build tool & dev server |
| **React Router** | 7.x | Client-side routing |
| **Three.js** | Latest | 3D graphics |
| **React Three Fiber** | Latest | React renderer for Three.js |
| **Framer Motion** | Latest | Animations |
| **QRCode.react** | Latest | QR code generation |
| **lrs** | Latest | Linkable Ring Signatures |
| **Lucide React** | Latest | Icons |

### 6.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 22.x | Runtime |
| **Express** | 5.x | Web framework |
| **Prisma** | 5.x | ORM |
| **SQLite** | 3.x | Database (demo) |
| **bcrypt** | Latest | Password hashing |
| **jsonwebtoken** | Latest | JWT authentication |
| **dotenv** | Latest | Environment variables |

### 6.3 DevOps & Deployment

| Technology | Purpose |
|------------|---------|
| **Render.com** | Cloud hosting |
| **GitHub** | Version control |
| **Git** | Source control |

### 6.4 Development Tools

| Tool | Purpose |
|------|---------|
| **VS Code** | IDE |
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **Prisma Studio** | Database GUI |

---

## 7. Key Features

### 7.1 Core Cryptographic Features

| Feature | Description | Technology |
|---------|-------------|------------|
| **Linkable Ring Signatures** | Anonymous signing within a group | LRS library |
| **Double Vote Prevention** | Unique key images detect duplicate votes | Key image uniqueness |
| **End-to-End Encryption** | Ballot content encrypted | AES-256 |

### 7.2 User-Facing Features

| Feature | Description |
|---------|-------------|
| **3D Landing Page** | Interactive Three.js security visualization |
| **Kiosk Voting Mode** | Full-screen voting interface |
| **QR Code Receipts** | Scannable verification codes |
| **Public Audit Ledger** | Searchable vote records |
| **Admin Dashboard** | Real-time election monitoring |

### 7.3 Technical Features

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Secure admin access with refresh tokens |
| **Responsive Design** | Mobile-first CSS |
| **Dark Mode UI** | Modern glassmorphism aesthetic |
| **API-First Backend** | RESTful architecture |

---

## 8. CV-Ready Description

### 8.1 Short Description (1 line)
> Full-stack e-voting platform using Linkable Ring Signatures for anonymous, verifiable voting with React, Node.js, and Prisma.

### 8.2 Medium Description (2-3 lines)
> Built a secure electronic voting demonstration using Linkable Ring Signatures (LRS) for voter anonymity and double-vote prevention. Features include 3D visualizations with Three.js, JWT authentication, QR code receipts, and a public audit ledger. Deployed on Render.com with React frontend and Node.js/Express backend.

### 8.3 Detailed Description (Bullet Points)

**VoteSphere - Secure E2E Encrypted Voting System**
- Implemented **Linkable Ring Signatures** for anonymous voting while preventing double votes
- Built responsive React frontend with **Three.js 3D visualizations** and **Framer Motion** animations
- Developed RESTful API with **Node.js/Express** and **Prisma ORM** for SQLite/PostgreSQL
- Integrated **JWT authentication** with access/refresh token rotation for admin security
- Created public audit ledger for vote verification with QR code receipt generation
- Deployed full-stack application on **Render.com** with automated CI/CD

### 8.4 Keywords for Resume
`React` `Node.js` `Express` `Prisma` `SQLite` `PostgreSQL` `JWT` `Cryptography` `Ring Signatures` `Three.js` `Vite` `REST API` `Full-Stack` `Authentication` `Security` `Render.com`

---

## 9. Presentation Slides Content

### Slide 1: Title
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🗳️  VOTESPHERE
  Secure End-to-End Encrypted Voting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           [Your Name]
        [Date] • [Course]
```

### Slide 2: Problem Statement
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          THE PROBLEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Traditional voting faces a dilemma:

  ❌ Paper ballots → No verifiability
  ❌ Simple e-voting → No anonymity  
  ❌ Blockchain → Often public = traceable

  ✅ How to achieve BOTH anonymity AND 
     verifiability?
```

### Slide 3: Solution
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LINKABLE RING SIGNATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🔐 Sign anonymously within a group
  🔗 Detect double votes via key image
  ✨ Verify without revealing identity

  [Diagram: Ring of keys with one signer]
```

### Slide 4: Architecture
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         SYSTEM ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────┐    ┌─────────┐    ┌────────┐
  │ React   │───▶│ Express │───▶│ SQLite │
  │ + Three │    │ + JWT   │    │ Prisma │
  └─────────┘    └─────────┘    └────────┘
       │              │
       └── LRS ───────┘
       (Client-side crypto)
```

### Slide 5: Key Features
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🗳️  Anonymous Voting (LRS)
  🔒  E2E Encryption (AES-256)
  📜  Public Audit Ledger
  📱  QR Code Receipts
  📊  Admin Dashboard
  🎨  3D Visualizations
```

### Slide 6: Tech Stack
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Frontend          Backend           DB
  ─────────         ───────           ──
  React 18          Node.js 22        SQLite
  Vite 7            Express 5         Prisma 5
  Three.js          JWT               PostgreSQL
  Framer Motion     bcrypt            (prod)
```

### Slide 7: Demo
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           LIVE DEMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🌐 https://eshaan-guliani-votesphere-api.onrender.com

  Demo Flow:
  1. Landing Page → 3D visualization
  2. Kiosk → Cast a vote
  3. Audit → Verify with ballot ID
  4. Admin → View results
```

### Slide 8: Challenges & Solutions
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       CHALLENGES FACED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Challenge              Solution
  ─────────              ────────
  Node.js in browser  →  Vite polyfills
  Express 5 wildcards →  {*splat} syntax
  Render Free Tier    →  Ephemeral DB setup
  Bundle size         →  Code splitting
```

### Slide 9: Future Scope
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FUTURE SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📌  Multi-election support
  📌  Voter registration system
  📌  Blockchain ledger integration
  📌  Mobile app (React Native)
  📌  Biometric verification
```

### Slide 10: Q&A
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        THANK YOU! 🙏
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Questions?

  📧  [Your Email]
  🔗  github.com/eshaan-eshaan/votesphere
  🌐  Live: eshaan-guliani-votesphere-api.onrender.com
```

---

## 10. Appendix

### 10.1 API Endpoints Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register admin | No |
| `POST` | `/api/auth/login` | Admin login | No |
| `POST` | `/api/auth/refresh` | Refresh token | Yes |
| `GET` | `/api/votes` | Get all votes | No |
| `POST` | `/api/votes` | Cast a vote | No |
| `GET` | `/api/admin/summary` | Election stats | Yes |

### 10.2 Environment Variables

```env
NODE_ENV=production
DATABASE_URL=file:./dev.db
JWT_SECRET=<random-string>
```

### 10.3 Repository Structure

```
votesphere/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── context/           # React context (Auth)
│   ├── pages/             # Page components
│   └── config.js          # API configuration
├── server/                 # Backend source
│   ├── prisma/            # Database schema
│   └── server.js          # Express server
├── public/                 # Static assets
├── docs/                   # Documentation
├── render.yaml            # Render deployment
├── package.json           # Frontend dependencies
└── vite.config.js         # Vite configuration
```

---

**Document Version**: 1.0  
**Last Updated**: February 8, 2026  
**Author**: VoteSphere Development Team
