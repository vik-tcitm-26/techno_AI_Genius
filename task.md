# Migration Task Checklist

## Folder Reorganization
- [x] Create `client` directory
- [x] Move frontend files (HTMLs, assets, css, js, services) into `client/`

## Backend Server
- [x] server/package.json Setup
- [x] server/.env Setup
- [x] server/config/connectDB.js
- [x] server/config/cloudinary.js
- [x] server/middleware/auth.js
- [x] server/schema.sql
- [x] server/seedData.js (extracted from data.js)
- [x] server/seed.js (database seeding script)
- [x] Controllers:
  - [x] server/controllers/authController.js
  - [x] server/controllers/insightController.js
  - [x] server/controllers/videoController.js
  - [x] server/controllers/eventController.js
  - [x] server/controllers/podcastController.js
  - [x] server/controllers/communityController.js
  - [x] server/controllers/mediaController.js
  - [x] server/controllers/settingsController.js
- [x] Routers:
  - [x] server/routers/authRoutes.js
  - [x] server/routers/insightRoutes.js
  - [x] server/routers/videoRoutes.js
  - [x] server/routers/eventRoutes.js
  - [x] server/routers/podcastRoutes.js
  - [x] server/routers/communityRoutes.js
  - [x] server/routers/mediaRoutes.js
  - [x] server/routers/settingsRoutes.js
- [x] server/index.js (main entry point)

## Frontend Services Simplification
- [ ] client/services/storageService.js
- [ ] client/services/authService.js
- [ ] client/services/insightService.js
- [ ] client/services/videoService.js
- [ ] client/services/mediaService.js
- [ ] client/services/apiService.js
- [ ] client/js/data.js (remove seed data, simplify TAG.init)

## Root Commands
- [ ] Root package.json setup

## Verification
- [ ] Install packages and seed database
- [ ] Run server and verify endpoints
- [ ] Verify frontend navigation and admin panel CRUD operations
