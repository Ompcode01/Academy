# Backend Architecture: Express App & Core Setup

## 1. Folder Overview: `backend/src/`

This layer configures the Node.js/Express server, middleware chain, Prisma client initialization, authentication utilities, and centralized route registration.

```
backend/src/
├── app.ts                  # Express Application configuration & API endpoint mounting
├── server.ts               # HTTP Server launcher (listens on port 5000)
├── config/
│   └── prisma.ts           # PrismaClient instance with BigInt serialization hooks
├── middleware/
│   ├── auth.middleware.ts  # JWT Authentication verification
│   └── error.middleware.ts # Centralized exception handling & HTTP response formatter
└── utils/
    ├── jwt.ts              # JWT signing & verification helpers
    ├── logger.ts           # Console logging formatting
    └── password.ts         # Bcrypt password hashing & comparison
```

---

## 2. Main Server Entrypoint & Application Logic

### A. `server.ts`
- Imports `app` from `./app`.
- Reads `PORT` from environment variables (defaults to `5000`).
- Initializes HTTP listener and logs successful startup.

### B. `app.ts` (Express Core Stack)
1. **Global Middleware Stack**:
   - `cors()`: Enables Cross-Origin Resource Sharing for the Next.js frontend (`http://localhost:3000`).
   - `express.json()` & `express.urlencoded()`: Parses incoming JSON and URL-encoded bodies.
2. **Universal Static File Resolver (`/storage`)**:
   - Handles static file requests for course attachments, SCORM packages, PDFs, DOCX files, and course thumbnails.
   - Includes candidate lookup logic and recursive fallback search inside `public/storage/uploads` and `public/storage`.
3. **API Route Mappings**:
   - `/api/auth`: Login, registration, and session token verification.
   - `/api/courses`: Course creation wizard, catalog fetching, sections, lessons, and SCORM uploads.
   - `/api/dashboard`: Role-scoped metric aggregation (`SUPER_ADMIN`, `ADMIN`, `TEACHER`, `LEARNER`).
   - `/api/departments`: Department lookups and user counts.
   - `/api/employees`: Staff directory management and Darwinbox sync hooks.
   - `/api/reports`: System usage, enrollment trends, and completion analytics.
   - `/api/admin/audit-logs`: System audit trail logging.
4. **Error Handling Middleware (`middleware/error.middleware.ts`)**:
   - Catches unhandled errors, formats JSON response (`{ success: false, message: ... }`), and prevents server crashes.

---

## 3. Key Utility & Serialization Logic

### A. Prisma BigInt JSON Serialization (`config/prisma.ts`)
MySQL primary keys in Prisma schema use `BigInt`. Standard `JSON.stringify()` throws a `TypeError: Do not know how to serialize a BigInt` error in Node.js.
- `(BigInt.prototype as any).toJSON = function() { return this.toString(); }` monkey-patches `BigInt` to automatically output string IDs when sending API JSON responses.

### B. JWT Session Management (`utils/jwt.ts`)
- `signToken(payload)`: Encodes `userId`, `email`, `role`, and `departmentId` into signed JSON Web Tokens expiring in 24h.
- `verifyToken(token)`: Decodes and validates signature using secret key `process.env.JWT_SECRET`.
