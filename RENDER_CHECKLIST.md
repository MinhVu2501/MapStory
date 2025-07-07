# Render Deployment Checklist for MapStory Creator

## Before Deployment
- [x] Code tested locally
- [x] Build process verified
- [x] Required files present

## Render Setup Required

### 1. Environment Variables to Set in Render:
```
NODE_ENV=production
DATABASE_URL=[Get from your PostgreSQL service]
JWT_SECRET=8642035d22dbac875647a556ea69e928568a44aeb69a628e8e5c44eed277ce042fd431983f7d6f90c58280709ac267139dfa6bc001a8ae5953c38a0db86bc81e
VITE_GOOGLE_MAPS_API_KEY=[Your Google Maps API key]
```

### 2. Service Configuration:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/maps`
- **Port**: 10000 (auto-detected)

### 3. Database Setup:
- Create PostgreSQL service first
- Copy Internal Database URL to web service
- Run `npm run seed:prod` in Render shell after deployment

## Post-Deployment
- [ ] Test application functionality
- [ ] Verify Google Maps integration
- [ ] Test user registration/login
- [ ] Check database operations

## Your Generated JWT Secret:
`8642035d22dbac875647a556ea69e928568a44aeb69a628e8e5c44eed277ce042fd431983f7d6f90c58280709ac267139dfa6bc001a8ae5953c38a0db86bc81e`

**⚠️ Important**: Save this JWT secret securely and add it to your Render environment variables.
