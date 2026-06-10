# Migrate Techno AI Genius from localStorage to Node.js + PostgreSQL

## Background

To organize the workspace cleanly and separate frontend concerns from the backend, we will structure the repository into two main directories:
1. `client/` — containing all client-side files (HTML pages, assets, styling, and services).
2. `server/` — containing the Node.js + Express backend (controllers, routers, config, schema, seeding).

This layout eliminates the root clutter where 20+ HTML files were mixed with services and assets, and leaves a tidy root folder.

---

## Workspace Directory Layout

```
techno-ai-genius/
├── client/              <-- All frontend code (clean and separated)
│   ├── assets/
│   ├── css/
│   ├── js/
│   │   ├── main.js
│   │   └── admin.js
│   ├── services/        <-- Simplified, clean REST API callers
│   │   ├── storageService.js
│   │   ├── authService.js
│   │   ├── insightService.js
│   │   ├── videoService.js
│   │   ├── mediaService.js
│   │   └── apiService.js
│   ├── index.html
│   ├── admin.html
│   └── (all other HTML pages)
│
├── server/              <-- All backend code (MVC pattern)
│   ├── config/
│   │   ├── connectDB.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── insightController.js
│   │   └── ...
│   ├── routers/
│   │   ├── authRoutes.js
│   │   ├── insightRoutes.js
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js
│   ├── index.js
│   ├── package.json
│   ├── schema.sql
│   ├── seedData.js
│   ├── seed.js
│   └── .env
│
├── package.json         <-- Root package.json (optional command runner)
└── README.md
```

---

## User Review Required

> [!IMPORTANT]
> **PostgreSQL Configuration**: The backend will connect to a PostgreSQL database using the credentials provided:
> - User: `postgres`
> - Password: `root`
> - Host: `localhost`
> - Port: `5432`
> - Database: `techno_ai_genius`
> - Port: `5000` (for Express server)
>
> **Cloudinary Settings**: Cloudinary configuration will be kept securely in the backend `.env` file using the credentials provided.
> - Cloud Name: `drt11vpg0`
> - API Key: `726786756351389`
> - API Secret: `zsjI-UxK88OVSj4Yd1lWrJotU8w`
>
> **JWT Authentication**: We will secure the admin panel routes using JSON Web Tokens (JWT) instead of plain localStorage values.

---

## Proposed Changes

### 1. Structure Reorganization (Moving frontend files)

We will move the following files and directories from the root folder into the `client/` folder:
- All `.html` files (`index.html`, `admin.html`, `about.html`, etc.)
- `assets/`
- `css/`
- `js/`
- `services/`
- `robots.txt`, `sitemap.xml`

### 2. Backend Server — `server/` (NEW)

#### [NEW] [server/package.json](file:///d:/node/techno-ai-genius/server/package.json)
- Setup dependencies: `express`, `pg` (PostgreSQL), `cloudinary` (Cloudinary SDK), `multer` (file upload handling), `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`.
- Scripts: `start`, `dev` (running nodemon), and `seed`.

#### [NEW] [server/.env](file:///d:/node/techno-ai-genius/server/.env)
- Environment variables containing the database configuration, JWT secret, and Cloudinary settings.

#### [NEW] [server/config/connectDB.js](file:///d:/node/techno-ai-genius/server/config/connectDB.js)
- Establishes connection to PostgreSQL using `pg.Pool`.

#### [NEW] [server/config/cloudinary.js](file:///d:/node/techno-ai-genius/server/config/cloudinary.js)
- Configures Cloudinary SDK.

#### [NEW] [server/middleware/auth.js](file:///d:/node/techno-ai-genius/server/middleware/auth.js)
- Middleware to verify the JWT from the `Authorization` header.

#### [NEW] [server/controllers/](file:///d:/node/techno-ai-genius/server/controllers/)
Controllers:
- [authController.js](file:///d:/node/techno-ai-genius/server/controllers/authController.js): Admin login, password changes.
- [insightController.js](file:///d:/node/techno-ai-genius/server/controllers/insightController.js): CRUD for insights.
- [videoController.js](file:///d:/node/techno-ai-genius/server/controllers/videoController.js): CRUD for videos.
- [eventController.js](file:///d:/node/techno-ai-genius/server/controllers/eventController.js): CRUD for events.
- [podcastController.js](file:///d:/node/techno-ai-genius/server/controllers/podcastController.js): CRUD for podcasts.
- [communityController.js](file:///d:/node/techno-ai-genius/server/controllers/communityController.js): CRUD for community signups.
- [mediaController.js](file:///d:/node/techno-ai-genius/server/controllers/mediaController.js): Uploads files to Cloudinary using Multer, saves records to PostgreSQL, deletes media.
- [settingsController.js](file:///d:/node/techno-ai-genius/server/controllers/settingsController.js): Gets/updates single-row settings configurations.

#### [NEW] [server/routers/](file:///d:/node/techno-ai-genius/server/routers/)
Express routers routing to the controllers:
- [authRoutes.js](file:///d:/node/techno-ai-genius/server/routers/authRoutes.js)
- [insightRoutes.js](file:///d:/node/techno-ai-genius/server/routers/insightRoutes.js)
- [videoRoutes.js](file:///d:/node/techno-ai-genius/server/routers/videoRoutes.js)
- [eventRoutes.js](file:///d:/node/techno-ai-genius/server/routers/eventRoutes.js)
- [podcastRoutes.js](file:///d:/node/techno-ai-genius/server/routers/podcastRoutes.js)
- [communityRoutes.js](file:///d:/node/techno-ai-genius/server/routers/communityRoutes.js)
- [mediaRoutes.js](file:///d:/node/techno-ai-genius/server/routers/mediaRoutes.js)
- [settingsRoutes.js](file:///d:/node/techno-ai-genius/server/routers/settingsRoutes.js)

#### [NEW] [server/index.js](file:///d:/node/techno-ai-genius/server/index.js)
- Main Express server configuration. Serve static assets from `../client`, register API routes, start server on port 5000.

#### [NEW] [server/schema.sql](file:///d:/node/techno-ai-genius/server/schema.sql)
SQL DDL script to create tables in PostgreSQL database:
- `admin_users`, `settings`, `insights`, `videos`, `events`, `podcasts`, `gallery`, `community`.

#### [NEW] [server/seedData.js](file:///d:/node/techno-ai-genius/server/seedData.js)
- Extracts the initial seed data from the client's `js/data.js` and formats it as JSON exports for seeding.

#### [NEW] [server/seed.js](file:///d:/node/techno-ai-genius/server/seed.js)
- Runs `schema.sql` to initialize database tables and inserts seed data.

---

### 3. Frontend Services Layer — `client/services/` (MODIFY)

We will simplify all files inside `client/services/` to perform async fetch operations directly:
- `storageService.js`: Serves as the general API caller routing simple REST operations.
- `authService.js`: Async auth calls (`/api/auth/login`, etc.).
- `insightService.js` / `videoService.js`: Delegate all operations directly to `storageService`.
- `mediaService.js`: Simple multipart/FormData uploads to `/api/media/upload`.
- `apiService.js`: Kept as a simple stub configuration to avoid HTML page errors.

---

### 4. Root Commands — `package.json` (NEW)

#### [NEW] [package.json](file:///d:/node/techno-ai-genius/package.json)
- Define a root scripts runner using concurrently:
  - `"dev"`: Runs the backend server development mode.
  - `"seed"`: Triggers backend database seeding.

---

## Verification Plan

### Database and Backend Seeding
1. Run database initialization and seed:
   ```bash
   npm run seed
   ```

### Running Server
1. Start development server from root:
   ```bash
   npm run dev
   ```
2. Verify server is listening on port `5000`.

### Manual Interface Verification
1. Open administrative portal (`admin.html`) at `http://localhost:5000/admin.html` (served via Express).
2. Login, add/modify/delete records, and upload media to test full integration.
