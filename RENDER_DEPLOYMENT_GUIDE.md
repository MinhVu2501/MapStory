# 🚀 Render Deployment Guide - MapStory Creator

## Overview
This guide will help you deploy your MapStory Creator application to Render with proper static asset serving.

## 📋 Prerequisites
- GitHub repository with your code
- Render account
- Environment variables configured

## 🔧 Render Service Configuration

### 1. Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `mapstory-creator`
- **Region**: Choose closest to your users
- **Branch**: `feature/deployment-setup` (or `main`)
- **Root Directory**: Leave blank
- **Runtime**: `Node`

**Build & Deploy Settings:**
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 2. Environment Variables
Add these environment variables in Render:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FRONTEND_URL=https://your-app-name.onrender.com
RENDER_EXTERNAL_URL=https://your-app-name.onrender.com
```

### 3. Advanced Settings
- **Auto-Deploy**: Yes
- **Health Check Path**: `/`
- **Instance Type**: Starter (can upgrade later)

## 🛠️ Key Fixes Applied

### 1. Static Asset Serving
- ✅ Fixed Vite build dependencies in `package.json`
- ✅ Improved Express static file serving with proper caching
- ✅ Added error handling for missing assets
- ✅ Optimized build output structure

### 2. API Configuration
- ✅ Dynamic API URL configuration for dev/prod environments
- ✅ Proper CORS configuration for Render
- ✅ Environment-based URL switching

### 3. Build Process
- ✅ Custom build script (`render-build.sh`)
- ✅ Proper dependency management
- ✅ Build verification steps

## 🔍 Troubleshooting

### Common Issues

**1. 502 Bad Gateway Errors**
- **Cause**: Static assets not building properly
- **Fix**: Check build logs, ensure `dist/` folder is created
- **Command**: `npm run build` locally to test

**2. API Calls Failing**
- **Cause**: Wrong API URLs in production
- **Fix**: Verify `src/config/api.js` configuration
- **Check**: Environment variables are set correctly

**3. Google Maps Not Loading**
- **Cause**: Missing or incorrect API key
- **Fix**: Set `VITE_GOOGLE_MAPS_API_KEY` in Render environment
- **Verify**: API key has correct permissions

**4. Database Connection Issues**
- **Cause**: Incorrect `DATABASE_URL`
- **Fix**: Verify PostgreSQL connection string
- **Test**: Check database is accessible from Render

## 🔄 Deployment Process

### Automatic Deployment
1. Push changes to your GitHub branch
2. Render automatically detects changes
3. Build process runs (`npm run build`)
4. Application starts (`npm start`)
5. Health check verifies deployment

### Manual Deployment
1. Go to Render Dashboard
2. Select your service
3. Click "Manual Deploy"
4. Choose branch and deploy

## 📊 Monitoring

### Build Logs
- Check build process in Render dashboard
- Look for errors in npm install/build steps
- Verify `dist/` folder creation

### Runtime Logs
- Monitor application logs for errors
- Check database connection status
- Verify API endpoints are working

### Performance
- Monitor response times
- Check static asset loading
- Verify Google Maps integration

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Build completes successfully
- [ ] Static assets load properly
- [ ] API endpoints work correctly
- [ ] Database connection established
- [ ] Google Maps loads without errors
- [ ] User registration/login works
- [ ] Map creation/viewing functions
- [ ] Image uploads work correctly

## 🆘 Support

If you encounter issues:
1. Check Render build/runtime logs
2. Verify environment variables
3. Test build locally: `npm run build`
4. Check API configuration in browser DevTools
5. Verify database connectivity

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)
- [Express.js Static Files](https://expressjs.com/en/starter/static-files.html)

---

**Last Updated**: January 2025
**Version**: 1.0.0 