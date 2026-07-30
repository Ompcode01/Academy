# Harbinger Academy LMS — Database Documentation

This document provides a comprehensive overview of the database configuration, schema structure, connection credentials, and management commands for the Harbinger Academy LMS.

---

## 1. Technology Stack

* **Database Engine:** MySQL 8.0 (configured via Docker container)
* **Object-Relational Mapping (ORM):** Prisma ORM (TypeScript)
* **Environment Configuration:** Dotenv (`backend/.env`)

---

## 2. Docker & Database Server Management

The MySQL database server is running in a Docker container as defined in [docker-compose.yml](file:///c:/Users/ompra/Desktop/academy_lms/docker-compose.yml). 

### How to Start the Database Server
Open a terminal in the root of the project (`academy_lms/`) and run:
```bash
docker compose up -d
```
*The database server runs on host port `3307` mapping to container port `3306` to prevent conflicts with native MySQL installations.*

### How to Stop the Database Server
To stop the MySQL container and free up resources:
```bash
docker compose down
```

### Checking Status and Logs
* **Check if container is running:**
  ```bash
  docker ps -f name=academy_lms_mysql
  ```
* **View database server logs:**
  ```bash
  docker compose logs -f mysql
  ```

---

## 3. Database Connection Configuration

The backend application connects to the MySQL instance using the `DATABASE_URL` environment variable located in [backend/.env](file:///c:/Users/ompra/Desktop/academy_lms/backend/.env).

### Connection Parameters
* **Host:** `localhost`
* **Port:** `3307`
* **Username:** `root`
* **Password:** `rootpassword`
* **Database Name:** `academy_lms`
* **Prisma Connection String:**
  ```env
  DATABASE_URL="mysql://root:rootpassword@localhost:3307/academy_lms"
  ```

---

## 4. Schema Synchronizing & Client Generation

Commands should be executed within the [backend](file:///c:/Users/ompra/Desktop/academy_lms/backend) directory:

### Push Schema to Database
To create or update database tables according to the [schema.prisma](file:///c:/Users/ompra/Desktop/academy_lms/backend/prisma/schema.prisma) model definitions:
```bash
npx prisma db push
```

### Generate Prisma Client
To generate or update the local typescript client types matching your schema:
```bash
npx prisma generate
```

### Seeding default data
To populate the database with default departments, employee profiles, user accounts, system roles, permissions, categories, and test courses:
```bash
npm run seed
```

### Prisma Studio (Data Explorer UI)
Prisma provides a visual database editor to browse and edit database tables from your browser:
```bash
npx prisma studio
```
This starts a GUI server at [http://localhost:5555](http://localhost:5555).

---

## 5. Database Schema & Tables

The schema is defined in [schema.prisma](file:///c:/Users/ompra/Desktop/academy_lms/backend/prisma/schema.prisma). Below is a breakdown of the models:

### Identity & Access Control Models

| Model / Table | DB Table Map | Description | Key Fields & Relations |
| :--- | :--- | :--- | :--- |
| **`Department`** | `departments` | Corporate organizational departments. | `id`, `departmentCode` (unique), `departmentName`, `isActive` |
| **`Employee`** | `employees` | Main profile information for company staff/users. | `id`, `employeeCode` (unique), `officialEmail` (unique), `departmentId` (relates to Department), `managerId` (self-relation for hierarchy) |
| **`UserAccount`** | `user_accounts` | Authentication credentials linked to an employee. | `id`, `employeeId` (unique mapping to Employee), `username` (unique), `passwordHash`, `accountLocked` |
| **`Role`** | `roles` | Access roles for RBAC. | `id`, `roleName`, `roleCode` (unique) |
| **`Permission`** | `permissions` | Specific application permissions grouped by module. | `id`, `permissionCode` (unique), `moduleName` |
| **`UserRole`** | `user_roles` | Mappings of employees to their assigned roles. | `employeeId`, `roleId` (unique composite key) |
| **`RolePermission`** | `role_permissions`| Mappings of permissions to roles. | `roleId`, `permissionId` (unique composite key) |

### Learning Management System (LMS) Models

| Model / Table | DB Table Map | Description | Key Fields & Relations |
| :--- | :--- | :--- | :--- |
| **`Category`** | `categories` | Course category tags (e.g. Technical, Soft Skills). | `id`, `name` (unique), `description` |
| **`Course`** | `courses` | Training courses metadata and lifecycle status. | `id`, `categoryId` (relates to Category), `departmentId` (optional department targeting), `creatorId` (relates to Employee), `title`, `status` (`DRAFT`, `PUBLISHED`, `ARCHIVED`) |
| **`CourseSection`** | `course_sections` | Chapters or modules within a course. | `id`, `courseId` (relates to Course), `title`, `sectionOrder` |
| **`LearningContent`** | `learning_contents`| Individual course units, lectures, or activities. | `id`, `sectionId` (relates to CourseSection), `title`, `contentType` (video/doc), `contentUrl`, `contentOrder` |
| **`Enrollment`** | `enrollments` | Learners enrolled in courses and their progress. | `userId` (relates to UserAccount/Employee), `courseId` (relates to Course), `progress` (Decimal %), `status` (IN_PROGRESS/COMPLETED) |

### Schema Enums
* **`CourseStatus`**: `DRAFT`, `PUBLISHED`, `ARCHIVED`
* **`EmploymentStatus`**: `ACTIVE`, `INACTIVE`, `RESIGNED`

---

## 6. Seed Data & Test Users

The database seeding script at [seed.ts](file:///c:/Users/ompra/Desktop/academy_lms/backend/prisma/seed.ts) populates several default users, departments, and roles. All seeded user accounts share the default password: **`Admin@123`**.

Refer to [CREDENTIALS.md](file:///c:/Users/ompra/Desktop/academy_lms/CREDENTIALS.md) for usernames, names, roles, and emails.
