\# VoteSphere Architecture



\## 1. High-Level Overview



VoteSphere is a full‑stack web application for secure, verifiable online voting.  

It follows a classic 3‑tier architecture:



\- \*\*Client (Frontend)\*\* – React + Vite single‑page app, running in the browser.

\- \*\*Server (Backend API)\*\* – Node.js + Express app, exposing a small REST API.

\- \*\*Ledger Storage (Data Layer)\*\* – Append‑only JSON file acting as a simple ledger.



The main design goal is to demonstrate \*\*end‑to‑end verifiability\*\* and \*\*voter privacy\*\* without depending on heavy infrastructure.



---



\## 2. Main Components



\### 2.1 Frontend (React + Vite)



\- \*\*Routing \& Pages\*\*

&nbsp; - `Landing` – entry point with navigation to Kiosk, Admin, Audit.

&nbsp; - `KioskDemo` – voter flow: verification, candidate selection, client‑side “encryption”.

&nbsp; - `AdminDashboard` – turnout stats and conceptual ledger blocks.

&nbsp; - `PublicAudit` – search by ballot hash and view all hashes.

&nbsp; - `AdminLogin`, `NotFound`, etc.



\- \*\*Shared Components\*\*

&nbsp; - `Layout` – top‑level layout, navbar, container.

&nbsp; - `Navbar` – navigation links between main sections.

&nbsp; - Contexts for theme / language (if enabled).



\- \*\*Utilities\*\*

&nbsp; - `utils/ledger.js` – client‑side helper for demo ledger/audit events.

&nbsp; - API base URL is read from `import.meta.env.VITE\_API\_URL`, so the same build can talk to different backends.



\### 2.2 Backend (Node + Express)



\- \*\*Server Entry (`server/server.js`)\*\*

&nbsp; - Sets up Express app and CORS.

&nbsp; - Registers routes:

&nbsp;   - `GET /api/health` – simple health check.

&nbsp;   - `GET /api/votes` – returns all ballots from `votes.json`.

&nbsp;   - `POST /api/votes` – appends a new ballot entry.



\- \*\*Data Store (`server/data/votes.json`)\*\*

&nbsp; - JSON array of ballot objects:

&nbsp;   - `electionId`

&nbsp;   - `encryptedBallot`

&nbsp;   - `choiceId`

&nbsp;   - `auditHash`

&nbsp;   - `timestamp`

&nbsp; - Treated as \*\*append‑only ledger\*\*: no update/delete operations.



---



\## 3. Request \& Data Flow



\### 3.1 Casting a Vote (Kiosk → API → Ledger)



1\. Voter opens the \*\*Kiosk\*\* page in the browser.

2\. After mock identity verification, the user selects a candidate.

3\. Frontend generates:

&nbsp;  - A simulated ciphertext (fake cipher).

&nbsp;  - A ballot hash (used as receipt and ledger anchor).

4\. Frontend sends `POST /api/votes` to the Express API with:

&nbsp;  - `electionId`

&nbsp;  - `encryptedBallot`

&nbsp;  - `choiceId`

&nbsp;  - `auditHash`

5\. Backend:

&nbsp;  - Reads the current `votes.json`.

&nbsp;  - Appends the new ballot object.

&nbsp;  - Writes back to disk.

&nbsp;  - Returns success JSON to the client.

6\. Frontend displays a \*\*Vote Receipt\*\* with:

&nbsp;  - Ballot ID (client‑side identifier).

&nbsp;  - Receipt hash (same as `auditHash`).

&nbsp;  - QR code encoding the hash.



\### 3.2 Admin View (API → Dashboard)



1\. Admin opens the \*\*Admin Dashboard\*\* page.  

2\. Frontend calls `GET /api/votes`.

3\. Backend returns the full ballot list from `votes.json`.

4\. Dashboard:

&nbsp;  - Calculates `votesCast = votes.length`.

&nbsp;  - Combines with a configured `totalVoters` value.

&nbsp;  - Animates the turnout percentage.



\### 3.3 Public Audit (API → Audit Page)



1\. User opens the \*\*Public Audit\*\* page.

2\. Page fetches all ballots from `GET /api/votes` (or a mock list + local last ballot).

3\. For verification:

&nbsp;  - User pastes their receipt hash into the search box.

&nbsp;  - Frontend does an \*\*exact match\*\* against known hashes.

&nbsp;  - If found, it shows block ID / timestamp / status.

4\. The full table renders all hashes so anyone can inspect the ledger.



---



\## 4. Security \& Privacy Design



> Note: Current implementation uses simulated encryption; the architecture is designed to be crypto‑ready.



\- \*\*Client‑Side Encryption Boundary\*\*

&nbsp; - The ballot choice is “encrypted” in the browser.

&nbsp; - API only ever sees `encryptedBallot` and `auditHash`, not the plaintext choice.

&nbsp; - Real system would replace the fake cipher with Web Crypto (RSA‑OAEP or ECC).



\- \*\*Voter Anonymity\*\*

&nbsp; - Kiosk logic masks voter IDs before writing anything to the demo ledger.

&nbsp; - `votes.json` does \*\*not\*\* store any real voter identifiers, only ballot data.



\- \*\*Tamper‑Evident Ledger\*\*

&nbsp; - Each ballot has a unique `auditHash`.

&nbsp; - Public Audit exposes all hashes so observers can detect:

&nbsp;   - Missing hashes (dropped votes).

&nbsp;   - Duplicate hashes (attempted double voting).



---



\## 5. Deployment Architecture



\- \*\*Frontend\*\*

&nbsp; - Built with `npm run build` (Vite).

&nbsp; - Static assets in `dist/` are deployed as a \*\*Render Static Site\*\*.

&nbsp; - Environment variable on Render:  

&nbsp;   - `VITE\_API\_URL = https://votesphere-api-7925.onrender.com`



\- \*\*Backend\*\*

&nbsp; - Deployed as a \*\*Render Web Service\*\* from the `server/` directory.

&nbsp; - Build command: `npm install`

&nbsp; - Start command: `npm start`

&nbsp; - Exposes HTTPS endpoint at:  

&nbsp;   `https://votesphere-api-7925.onrender.com`



---



\## 6. Future Architecture Enhancements



\- Swap JSON file for a proper database or blockchain‑backed ledger.

\- Introduce an \*\*authentication/authorization\*\* layer:

&nbsp; - Voter registration \& token issuance.

&nbsp; - Admin roles, JWTs, and rate limiting.

\- Replace fake encryption with production‑grade cryptography.

\- Add candidate‑wise aggregation endpoints for result visualization.

\- Split API into:

&nbsp; - `/api/kiosk/\*` – write operations.

&nbsp; - `/api/admin/\*` – admin‑only reads and analytics.

&nbsp; - `/api/audit/\*` – public read‑only endpoints.



