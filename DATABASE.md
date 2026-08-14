# Harbinger Academy LMS — Centralized Database & Synchronization Guide

This document provides a comprehensive overview of the database configuration, schema structure, connection credentials, multi-laptop deployment options, and database snapshot synchronization for the Harbinger Academy LMS.

---

## 1. Technology Stack

* **Database Engine:** MySQL 8.0 (configured via Docker container or shared network host)
* **Object-Relational Mapping (ORM):** Prisma ORM (TypeScript)
* **Environment Configuration:** Dotenv (`backend/.env`)

---

## 2. Shared & Centralized Database Architecture

All LMS application data — including courses, sections, contents, users, enrollments, quiz submissions, assignment submissions, grades, certificates, progress, audit logs, notifications, and events — is stored persistently in the MySQL database.

### Deployment Options Across Laptops / Systems

#### Option A: Central Shared Database Host (Recommended for Real-Time Sync)
All developer / admin systems connect directly to a single shared MySQL server (e.g. hosted on an internal server IP or cloud DB instance):
1. Open `backend/.env` on each machine.
2. Set `DATABASE_URL`:
   ```env
   DATABASE_URL="mysql://root:rootpassword@<SHARED_DB_HOST_IP>:3306/academy_lms"
   ```
3. All actions performed on System A (creating courses, enrolling learners, grading assignments) instantly reflect on System B.

#### Option B: Database Snapshot Export & Import (Recommended for Offline / Independent Machines)
When systems are on separate networks, use the built-in database snapshot utility:
1. **On Machine A (after creating/modifying data):**
   ```bash
   cd backend
   npm run db:export
   ```
   This generates `backend/prisma/data_dump.json` containing all LMS tables. Commit this file or share it with team members.

2. **On Machine B (to restore/synchronize data):**
   ```bash
   cd backend
   npm run db:import
   ```
   This imports all snapshot tables into Machine B's local database.

---

## 3. Docker & Database Server Management

The MySQL database server is running in a Docker container as defined in [docker-compose.yml](file:///d:/Harbinger%20Training/LMS/LMS/Academy/docker-compose.yml).

### How to Start the Local Database Server
Open a terminal in the root of the project (`academy_lms/`) and run:
```bash
docker compose up -d
```
*The database server runs on host port `3307` mapping to container port `3306`.*

### How to Stop the Database Server
```bash
docker compose down
```

---

## 4. Database Schema & Synchronization Commands

Commands must be executed within the `backend/` directory:

### Push Schema to Database
```bash
npx prisma db push
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Seeding Baseline Test Data
```bash
npm run seed
```

### Export Full Database Snapshot
```bash
npm run db:export
```

### Import Database Snapshot
```bash
npm run db:import
```

### Prisma Studio (Data Explorer UI)
```bash
npx prisma studio
```
Starts visual explorer at [http://localhost:5555](http://localhost:5555).

---

## 5. Seed Data & Test Users

The database seed script at `backend/prisma/seed.ts` populates default users, departments, and roles. All seeded user accounts share the default password: **`Admin@123`**.

Refer to [CREDENTIALS.md](file:///d:/Harbinger%20Training/LMS/LMS/Academy/CREDENTIALS.md) for details.
