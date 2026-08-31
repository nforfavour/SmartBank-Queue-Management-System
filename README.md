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

[Overview](#-overview) •
[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) •
[API Reference](#-api-reference) •
[Deployment](#-deployment) •
[Troubleshooting](#-troubleshooting) •
[Team](#-team)

</div>

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
| `ADMIN_DEFAULT_EMAIL` | Email for the auto-created admin account | `admin@smartbank.com` |
| `ADMIN_DEFAULT_PASSWORD` | Password for the auto-created admin account | `Admin@12345` |

> ⚠️ **Never commit your real `.env` file.** It's already listed in `.gitignore`
> — only `.env.example` (with placeholder values) should ever be pushed to GitHub.

### 4. Seed the database

Creates the database file, plus a starter admin account, staff account, and
default list of banking services:

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

### Default login credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartbank.com` | `Admin@12345` |
| Staff | `staff@smartbank.com` | `Staff@12345` |

Customers register their own account from the login page.

> 🔒 Change these default passwords immediately in any real deployment.

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

| Name | Role | GitHub |
|---|---|---|
| _Add name_ | _e.g. Backend_ | _@handle_ |
| _Add name_ | _e.g. Frontend_ | _@handle_ |
| _Add name_ | _e.g. Database_ | _@handle_ |
| _Add name_ | _e.g. Documentation_ | _@handle_ |

*(Fill in your team's actual names, roles, and GitHub handles before submission.)*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to replace
this section if your course requires a different license, or remove it entirely
if the project isn't intended for reuse.

---

## 🙏 Acknowledgments

- Built as a group project for **[Course Name / Code]** at **ICT University**.
- Queue design inspired by real-world bank ticketing systems.

<div align="center">

**[⬆ Back to top](#-smartbank--digital-queue-management-system)**

</div>
