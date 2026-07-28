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

1. Open your terminal at the root of the project (`academy_lms/`).
2. Run the following command to start the MySQL database container in the background:
   ```bash
   docker compose up -d
   ```
   *Note: This starts MySQL on port `3307` to avoid port conflicts with any local MySQL running on the default `3306` port.*

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
3. Open the newly created `.env` file and configure your database URL if it differs. The default configuration connects to the Docker database on port `3307`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="mysql://root:rootpassword@localhost:3307/academy_lms"
   JWT_SECRET="supersecretjwtkey"
   JWT_EXPIRES_IN="1d"
   LOG_LEVEL="debug"
   ```
4. Install the backend dependencies:
   ```bash
   npm install
   ```
5. Generate the Prisma client and push the schema to the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
6. (Optional) If you have a seeding script, seed the database:
   ```bash
   npm run seed
   ```
7. Start the backend development server:
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

## Troubleshooting

### Docker Database Issues
If you encounter port binding errors, ensure no other service is using port `3307`. You can change the mapped host port in `docker-compose.yml` and update the corresponding `DATABASE_URL` port in your `backend/.env`.

### Prisma Database Sync
If you modify the database models in `backend/prisma/schema.prisma`, sync the database again using:
```bash
npx prisma db push
npx prisma generate
```
