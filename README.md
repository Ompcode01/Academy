# Harbinger Academy LMS

An Enterprise Learning Management System consisting of a Node.js + Express + Prisma (MySQL) backend and a Next.js (TailwindCSS + shadcn/ui) frontend.

This guide outlines the steps required to set up, configure, and run both the backend and frontend applications.

For a detailed breakdown of all user portal features, administrative builders, and API components, see the [Features Documentation](file:///C:/Users/ompra/Desktop/academy_lms/FEATURES.md).

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Node.js** (v18.x or higher recommended)
2. **npm** (comes with Node.js)
3. **Docker Desktop** or **Docker Engine** (required to run the MySQL database)

---

## Step 1: Database Setup (using Docker)

The application uses MySQL as its database. A `docker-compose.yml` file is provided in the project root to spin up a MySQL container.

For detailed information about database tables, columns, relations, seeding configuration, and management operations, please refer to the [Database Documentation](file:///c:/Users/ompra/Desktop/academy_lms/DATABASE.md).

### Starting the Database Server
1. Open your terminal at the root of the project (`academy_lms/`).
2. Run the following command to start the MySQL database container in the background:
   ```bash
   docker compose up -d
   ```
   *Note: This starts MySQL on port `3307` to avoid port conflicts with any local MySQL running on the default `3306` port.*

### Checking Server Status
Verify that the database container is active:
```bash
docker ps -f name=academy_lms_mysql
```

### Stopping the Database Server
To stop the database container and free up resources:
```bash
docker compose down
```

---

## Step 2: Backend Setup & Running

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open the newly created `.env` file and configure your local MySQL database connection credentials:
   - For standard local MySQL / XAMPP (port **3306**):
     ```env
     DATABASE_URL="mysql://root:rootpassword@localhost:3306/academy_lms"
     ```
   - For Docker / custom MySQL (port **3307**):
     ```env
     DATABASE_URL="mysql://root:rootpassword@localhost:3307/academy_lms"
     ```
   *(Note: Ensure your MySQL service is started before running database commands).*

4. Install backend dependencies & sync schema:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

5. Import complete database snapshot (including Agentic AI course, sections & content):
   ```bash
   npm run db:import
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend server will run on [http://localhost:5000](http://localhost:5000).

---

## Step 3: Frontend Setup & Running

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Database Snapshot & Git Workflow (`git pull` & `git push`)

To keep database data (courses, users, sections, learning contents, enrollments) synchronized across all developer environments, follow these steps during `git push` and `git pull`:

### 1. BEFORE PUSHING CHANGES (`git push`)
If you created or modified any courses, sections, contents, or user data locally, export the latest database snapshot before pushing:
```bash
cd backend
npm run db:export
git add prisma/data_dump.json
git commit -m "Export latest database snapshot"
git push
```
> **What this does**: `npm run db:export` exports all database tables into `backend/prisma/data_dump.json`.

---

### 2. AFTER PULLING CHANGES (`git pull`)
Whenever you pull code from GitHub, import the updated snapshot into your local database:
```bash
git pull
cd backend
npm run db:import
```
> **What this does**: `npm run db:import` automatically cleans local stale records and restores the exact database snapshot from `data_dump.json`.

---

## Troubleshooting

### Windows Prisma File Lock (`EPERM: operation not permitted`)
If `npx prisma generate`, `npx prisma db push`, or `npm run db:import` fails with `EPERM: operation not permitted`, stop your running backend server process (`npm run dev`) first. On Windows, active Node processes lock Prisma's query engine DLL file (`query_engine-windows.dll.node`).

### Docker Database Issues
If you encounter port binding errors, ensure no other service is using port `3307`. You can change the mapped host port in `docker-compose.yml` and update the corresponding `DATABASE_URL` port in your `backend/.env`.

### Prisma Schema Modifications
If you modify database models in `backend/prisma/schema.prisma`:
```bash
# 1. Stop backend dev server if running
# 2. Push schema to database
npx prisma db push
npx prisma generate
```
