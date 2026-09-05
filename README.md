<div align="center">

# 🏦 SmartBank — Digital Queue Management System

**A fair, fast, and fully digital replacement for the physical bank queue.**

Customers get a live queue number from their phone. Staff serve people in a guaranteed
first-in-first-out order. Admins see everything happening across every service, in real time.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)
[![Status](https://img.shields.io/badge/Status-Active%20Development-yellow)](#)

[Course Info](#-course-project-information) •
[Overview](#-overview) •
[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) •
[API Reference](#-api-reference) •
[Testing](#-testing) •
[Deployment](#-deployment) •
[Troubleshooting](#-troubleshooting) •
[Team](#-team)

</div>

---

## 🎓 Course Project Information

| Field | Detail |
|---|---|
| **Course Code / Title** | ICT 2140 — Introduction to Software Engineering |
| **Group Number** | _Add your group number_ |
| **Project Topic** | SmartBank — Digital Queue Management System |
| **Group Leader** | _Add name_ |
| **Link to GitHub Repository** | https://github.com/nforfavour/SmartBank-Queue-Management-System |
| **Live Deployed App** | _Add your Render/Railway URL here once deployed — see [Deployment](#-deployment) below_ |

> ⚠️ Per the course project specification: **applications that are not deployed
> are capped at 75% of the overall score**, regardless of functionality. The
> live link above must be filled in and working before submission — see
> [Deployment](#-deployment) for exact steps.

---

## 📖 Overview

**SmartBank** replaces the physical act of standing in a bank line with a digital,
FIFO-ordered (First In, First Out) queueing system. Instead of queuing in person,
a customer opens the app, selects the service they need (Deposit, Withdrawal,
Transfer, etc.), and receives a queue number with a live estimated wait time —
similar to a number-dispenser machine, except everything updates on their own
screen in real time.

This project was built to solve three concrete problems with traditional bank
queues:

- Customers have no visibility into how long they'll wait.
- Physical lines cause overcrowding in the banking hall.
- Staff have no fast, tamper-proof way to know who's actually next.

The system has **three roles**, each with its own dedicated screen:

| Role | Who they are | What they do |
|---|---|---|
| 👤 **Customer** | Members of the public | Request a ticket, join the live queue, track their position, book appointments ahead of time |
| 👔 **Staff** | Bank employees at service counters | View their service's live queue, call the next customer, manage no-shows and skips |
| 🛠️ **Admin** | Bank managers | View system-wide statistics, manage services, create/remove staff accounts |

---

## ✨ Features

- 🎫 **Digital ticketing** — customers preview a queue number and estimated wait before committing to join
- 🔁 **True FIFO ordering** — a custom queue data structure guarantees fairness; no one can cut the line
- 🏢 **Per-service queues** — Deposit, Withdrawal, Transfer, etc. each have their own independent line, just like separate counters in a real branch
- 📡 **Live status updates** — the customer's screen polls automatically, no page refresh needed
- 📅 **Appointment booking** — customers can book ahead and check in later, skipping straight into the live queue
- 🔐 **Role-based authentication** — secure JWT-based login with strict customer / staff / admin permission boundaries
- 📊 **Admin analytics dashboard** — daily totals, per-service performance, and average wait times
- 💾 **Zero-config database** — SQLite via `better-sqlite3`; the entire database lives in one file, no separate server needed
- 🐳 **Deployment-ready** — includes a `Dockerfile` and `render.yaml` for one-click hosting

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, vanilla JavaScript (no build step required) |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (via `better-sqlite3`) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` password hashing |
| **Deployment** | Docker, Render.com / Railway |

---

## 🗂️ Project Structure

```
smartbank-queue-system/
│
├── backend/
│   ├── db/
│   │   ├── db.js              # Database connection + table schema
│   │   └── seed.js            # Seeds starter admin/staff accounts + services
│   │
│   ├── middleware/
│   │   └── auth.js            # JWT authentication + role authorization
│   │
│   ├── queue/
│   │   ├── FIFOQueue.js       # Core First-In-First-Out data structure
│   │   └── queueManager.js    # One FIFOQueue instance per banking service
│   │
│   ├── routes/
│   │   ├── auth.js            # Register / login
│   │   ├── services.js        # List / manage banking services
│   │   ├── queue.js           # Ticket lifecycle + staff queue actions
│   │   ├── appointments.js    # Book-ahead + check-in
│   │   └── admin.js           # Stats, staff accounts, activity log
│   │
│   ├── server.js              # Application entry point
│   ├── package.json
│   ├── .env.example           # Template for required environment variables
│   └── .env                   # Your local secrets (never committed)
│
├── frontend/
│   ├── css/style.css          # All visual styling
│   ├── js/api.js              # Shared fetch/session helper used by every page
│   ├── index.html             # Login / registration
│   ├── customer.html          # Customer portal
│   ├── staff.html             # Staff dashboard
│   └── admin.html             # Admin dashboard
│
├── .gitignore
├── Dockerfile
├── render.yaml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **[Node.js](https://nodejs.org/) v18 or v20 LTS** (recommended — newer versions can
  have native-module compile issues with `better-sqlite3`; see [Troubleshooting](#-troubleshooting))
- **npm** (bundled with Node.js)
- A code editor such as [VS Code](https://code.visualstudio.com/)

Check your installed versions:

```bash
node --version
npm --version
```

### 1. Clone the repository

```bash
git clone https://github.com/nforfavour/SmartBank-Queue-Management-System.git
cd SmartBank-Queue-Management-System
```

> 💡 If you downloaded this as a ZIP instead, extract it somewhere simple like
> your Desktop or Documents folder — avoid extracting inside a cloud-synced
> folder (OneDrive, Google Drive) or a path containing spaces.

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server runs on | `4000` |
| `JWT_SECRET` | Secret key used to sign login tokens — **change this** | `a-long-random-string` |
| `JWT_EXPIRES_IN` | How long a login session lasts | `8h` |
| `DB_PATH` | Where the SQLite database file is created | `./db/smartbank.sqlite` |
| `STAFF_SIGNUP_CODE` | Secret code required to register as Staff — **change this** | `a-secret-code` |
| `ADMIN_SIGNUP_CODE` | Secret code required to register as Admin — **change this** | `a-different-secret-code` |

> ⚠️ **Never commit your real `.env` file.** It's already listed in `.gitignore`
> — only `.env.example` (with placeholder values) should ever be pushed to GitHub.

### 4. Seed the database

Creates the database file and the default list of banking services (no user
accounts are created — everyone registers their own, see below):

```bash
npm run seed
```

### 5. Start the server

```bash
npm start
```

You should see:

```
SmartBank server running on http://localhost:4000
```

### 6. Open the app

Visit **[http://localhost:4000](http://localhost:4000)** in your browser.

> 🚫 **Do not** open `frontend/index.html` directly as a file (`file://...`) —
> it must be loaded through the running server so it can reach the API.
> This is the single most common setup mistake.

### Account registration — no default logins

There are **no pre-created accounts**. Everyone — Customer, Staff, and Admin
alike — creates their own account from the **Register** tab on the login
page.

- **Customers** register normally, no code needed.
- **Staff/Admin** select their role at registration and must enter the
  matching secret code (`STAFF_SIGNUP_CODE` / `ADMIN_SIGNUP_CODE` from your
  `.env`). This is what stops a random visitor from granting themselves
  bank-employee access — only people your team gives the code to can become
  Staff or Admin.

> 🔑 Share your `STAFF_SIGNUP_CODE` / `ADMIN_SIGNUP_CODE` with your teammates
> directly (e.g. in your group chat) — never commit them to GitHub. Change
> both to something unique before deploying; don't leave the `.env.example`
> placeholder values in place.

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Full request/response details live in
[`docs/API.md`](docs/API.md) *(create this if you want a dedicated API doc — see
note at the end of this README)*. Summary:

<details>
<summary><strong>Auth & Services</strong></summary>

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a customer account |
| POST | `/auth/login` | Public | Log in, returns a JWT |
| GET | `/auth/me` | Authenticated | Get current user's details |
| GET | `/services` | Public | List active banking services |
| POST | `/services` | Admin | Add a new service |
| PATCH | `/services/:id` | Admin | Edit or deactivate a service |

</details>

<details>
<summary><strong>Queue — Customer Actions</strong></summary>

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/queue/request` | Customer | Preview a ticket + estimated wait |
| POST | `/queue/:id/accept` | Customer | Join the live queue |
| POST | `/queue/:id/decline` | Customer | Decline the previewed ticket |
| POST | `/queue/:id/cancel` | Customer | Cancel an active ticket |
| GET | `/queue/:id/status` | Owner | Live position + wait estimate |
| GET | `/queue/my/history` | Customer | Past ticket history |

</details>

<details>
<summary><strong>Queue — Staff Actions</strong></summary>

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/queue/service/:id` | Staff/Admin | Full live queue for one service |
| POST | `/queue/service/:id/call-next` | Staff/Admin | Call the next customer |
| POST | `/queue/:id/start` | Staff/Admin | Mark customer as in-service |
| POST | `/queue/:id/complete` | Staff/Admin | Mark service complete |
| POST | `/queue/:id/skip` | Staff/Admin | Skip a non-responsive customer |
| POST | `/queue/:id/recall` | Staff/Admin | Recall a skipped customer to the front |
| POST | `/queue/:id/absent` | Staff/Admin | Mark a no-show |

</details>

<details>
<summary><strong>Appointments & Admin</strong></summary>

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/appointments` | Customer | Book a service ahead of time |
| GET | `/appointments/my` | Customer | List own appointments |
| POST | `/appointments/:id/checkin` | Customer | Convert booking into a live ticket |
| POST | `/appointments/:id/cancel` | Customer | Cancel a booking |
| GET | `/admin/stats` | Admin | Dashboard statistics |
| GET | `/admin/users` | Admin | List all accounts |
| POST | `/admin/users` | Admin | Create a staff/admin account |
| DELETE | `/admin/users/:id` | Admin | Remove an account |
| GET | `/admin/queue-log` | Admin | Full activity log |

</details>

---

## 🏗️ How It Works (High Level)

```
Customer requests a ticket
        │
        ▼
Backend calculates a queue number + estimated wait   (status: Pending)
        │
        ▼
Customer accepts  ──►  ticket enters the real FIFO queue  (status: Waiting)
        │
        ▼
Staff click "Call Next Customer"  ──►  front of the queue is dequeued
        │
        ▼
Customer's screen updates automatically (polls every 8 seconds)
```

Each banking service (Deposit, Transfer, etc.) has its own **independent FIFO
queue**, so calling the next customer on one service never affects another.
If the server restarts, every "Waiting" ticket is automatically restored to
its correct position from the database — no one loses their place in line.

For a full line-by-line explanation of the codebase, see the project's
companion teaching documents (Beginner's Guide + Code Walkthrough) shared
alongside this repository.

---

## 🧪 Testing

The course specification (Phase 5) requires each group to test their
application using a testing framework appropriate to their tech stack, doing
either white-box or black-box testing — with **Jest** given as the example
for JavaScript projects.

> ⚠️ **Current status: no automated test suite exists in this repository
> yet.** This is a required deliverable, not optional documentation — it
> needs to be added before submission. The steps below get a real Jest suite
> running against the actual API.

**To add it:**

```bash
cd backend
npm install --save-dev jest supertest
```

Add to `backend/package.json`:

```json
"scripts": {
  "test": "jest"
}
```

Suggested first tests (`backend/tests/queue.test.js`), covering the core
FIFO behavior directly (white-box) and the API endpoints end-to-end
(black-box):

```js
const FIFOQueue = require("../queue/FIFOQueue");

describe("FIFOQueue (white-box)", () => {
  test("dequeues in the same order items were enqueued", () => {
    const q = new FIFOQueue();
    q.enqueue({ queueId: "A" });
    q.enqueue({ queueId: "B" });
    q.enqueue({ queueId: "C" });
    expect(q.dequeue().queueId).toBe("A");
    expect(q.dequeue().queueId).toBe("B");
  });

  test("dequeue on an empty queue returns null", () => {
    const q = new FIFOQueue();
    expect(q.dequeue()).toBeNull();
  });
});

// Black-box: hit the real HTTP endpoints with supertest, e.g.
// register -> login -> request a ticket -> accept -> call-next,
// asserting on status codes and response bodies at each step.
```

Run the suite with:

```bash
npm test
```

Once real tests exist, briefly describe your testing approach (what's
covered, white-box vs. black-box, how to run it) in your project report's
**Chapter Three — Test Case document** section.

---

## 📑 Other Required Deliverables

Per the course project specification, the GitHub repo is only one part of
what's submitted. Keep the rest of the deliverables in the repo too, so
everything is in one place for grading:

```
docs/
├── SmartBank_Project_Report.pdf   # Full report (Chapters 1-5, using the
│                                   # course's Project Report Template)
├── SmartBank_Presentation.pptx    # Max 20 slides
└── uml/
    ├── use-case-diagram.png
    ├── class-diagram.png
    └── sequence-diagrams/         # At least 5 sequence diagrams
```

- **Report (25%)** — Chapters 1–5 as specified (Introduction, Literature
  Review, Methodology & Materials, Results & Discussion, Recommendations &
  Conclusion). Include this README's architecture diagram and API table as
  a starting point for Chapter Three's system design section.
- **UML Diagrams** — use case diagram, class diagram, and at least 5
  sequence diagrams (e.g. customer joins queue, staff calls next, login,
  appointment check-in, admin views stats — see [How It Works](#-how-it-works-high-level)
  and the flow diagrams in the companion Code Walkthrough guide for a head
  start on each).
- **Presentation (15%)** — no more than 20 slides.

---

## ☁️ Deployment

This project is ready to deploy as-is:

- **`Dockerfile`** — builds a container image for any Docker-compatible host
- **`render.yaml`** — enables one-click deployment on [Render.com](https://render.com)
- Works equally well on [Railway](https://railway.app) or any Node-friendly host

**Before deploying:**

1. Set the environment variables listed above in your hosting provider's dashboard
   (never rely on a committed `.env` file in production).
2. Generate a strong, random `JWT_SECRET` — do not reuse the local development value.
3. Change the default admin/staff passwords immediately after your first deploy.

---

## 🛠️ Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `Failed to fetch` in the browser | Opened `index.html` directly instead of through the server | Start the server (`npm start`) and visit `http://localhost:4000` |
| `'npm' is not recognized` | Node.js isn't installed, or not on PATH | Install [Node.js LTS](https://nodejs.org/) and restart your terminal |
| `Cannot find module 'dotenv'` (or similar) | `npm install` failed silently, often on newer Node versions | Delete `node_modules` and `package-lock.json`, switch to Node 18/20 LTS, run `npm install` again |
| Native build errors during `npm install` | `better-sqlite3` needs to compile native code | Use Node 18 or 20 LTS rather than the very latest Node version |
| Port already in use | Another process is using port 4000 | Change `PORT` in `.env`, or stop the other process |

---

## 🤝 Contributing (Team Workflow)

This is a group academic project. Each member works on their own branch and
opens a pull request into `main` for review before merging:

```bash
git checkout -b your-branch-name
# make your changes
git add .
git commit -m "Describe your change"
git push origin your-branch-name
```

Please avoid committing directly to `main`.

---

## 👥 Team

| SN | Member's Name | Registration Number | Team Role | GitHub |
|---|---|---|---|---|
| 1 | _Nfor Divine Favour Nfor_ | _ICTU20251213_ | _e.g. Backend_ | _@nforfavour_ |
| 2 | _Nteban Christel Javnyuy_ | _ICTU20251351_ | _e.g. Frontend_ | _@ntebanjavnyuy_ |
| 3 | _Tameu Penlap Jude Elysee_ | _ICTU2025----_ | _e.g. Database_ | _@judexnnn_ |
| 4 | _Tiomela Tatsabong Britney_ | _ICTU2025----_ | _e.g. Documentation_ | _@tiomelabritney-star_ |



---

## 🙏 Acknowledgments

- Built as the final project for **ICT 2140 — Introduction to Software
  Engineering**, Faculty of Information and Communication Technologies,
  **ICT University**, Summer 2026, under **Instructor Tekoh Palma Achu**.
- Queue design inspired by real-world bank ticketing systems.

<div align="center">

**[⬆ Back to top](#-smartbank--digital-queue-management-system)**

</div>
