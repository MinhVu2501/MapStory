# MapStory Creator - Render Deployment Guide

This guide will walk you through deploying your MapStory Creator application on Render.

## Prerequisites

- [Render account](https://render.com) (free tier available)
- GitHub repository with your code
- Google Maps API key
- Basic understanding of environment variables

## Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify these files exist in your repository:**
   - `package.json` ✓
   - `server.js` ✓
   - `build.sh` ✓
   - `render.yaml` ✓ (optional, for infrastructure as code)

## Step 2: Create PostgreSQL Database

1. **Log into Render Dashboard:**
   - Go to [render.com](https://render.com)
   - Sign in with your GitHub account

2. **Create a new PostgreSQL database:**
   - Click "New" → "PostgreSQL"
   - **Name**: `mapstory-db`
   - **Database**: `mapstory`
   - **User**: `mapstory_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
   - Click "Create Database"

3. **Save database connection details:**
   - After creation, note the **Internal Database URL**
   - You'll need this for the web service

## Step 3: Create Web Service

1. **Create a new Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select your MapStory repository

2. **Configure the service:**
   - **Name**: `mapstory-app`
   - **Region**: Same as your database
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

3. **Set Environment Variables:**
   Click "Advanced" and add these environment variables:

   ```
   NODE_ENV=production
   DATABASE_URL=[Your PostgreSQL Internal Database URL]
   JWT_SECRET=[Generate a strong random string]
   VITE_GOOGLE_MAPS_API_KEY=[Your Google Maps API key]
   ```

   **To generate a strong JWT secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Click "Create Web Service"**

## Step 4: Configure Environment Variables

In your Render dashboard, go to your web service and add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Sets production mode |
| `DATABASE_URL` | `[From your PostgreSQL service]` | Database connection string |
| `JWT_SECRET` | `[Generated secure string]` | JWT signing secret |
| `VITE_GOOGLE_MAPS_API_KEY` | `[Your API key]` | Google Maps API key |
| `FRONTEND_URL` | `[Your render app URL]` | Your app's URL (optional) |

## Step 5: Initialize Database

1. **Wait for deployment to complete**
2. **Open the Render Shell:**
   - Go to your web service dashboard
   - Click "Shell" tab
   - Run the database initialization:
   ```bash
   npm run seed:prod
   ```

## Step 6: Verify Deployment

1. **Check your application:**
   - Your app will be available at: `https://mapstory-app.onrender.com`
   - Check the logs for any errors

2. **Test key functionality:**
   - ✅ Homepage loads
   - ✅ User registration/login works
   - ✅ Maps display correctly
   - ✅ Google Maps integration works
   - ✅ Database operations work

## Step 7: Custom Domain (Optional)

1. **Add custom domain:**
   - Go to your web service settings
   - Click "Custom Domains"
   - Add your domain
   - Configure DNS records as shown

2. **SSL Certificate:**
   - Render provides free SSL certificates
   - They're automatically configured

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   ```bash
   # Check build logs in Render dashboard
   # Common fixes:
   - Ensure package.json has correct scripts
   - Check Node.js version compatibility
   - Verify all dependencies are listed
   ```

2. **Database Connection Issues:**
   ```bash
   # Verify DATABASE_URL is correct
   # Check if database is running
   # Ensure database and web service are in same region
   ```

3. **Google Maps Not Loading:**
   ```bash
   # Verify VITE_GOOGLE_MAPS_API_KEY is set
   # Check API key restrictions in Google Cloud Console
   # Ensure billing is enabled for Google Maps
   ```

4. **CORS Errors:**
   ```bash
   # Check FRONTEND_URL environment variable
   # Verify your domain is correctly configured
   ```

### Checking Logs:

1. **Build Logs:**
   - Go to your service dashboard
   - Click "Logs" tab
   - Filter by "Build" to see build process

2. **Runtime Logs:**
   - Same location, filter by "Runtime"
   - Look for application startup and error messages

3. **Database Logs:**
   - Go to your PostgreSQL service
   - Check logs for connection issues

## Environment Variables Reference

Create a `.env` file for local development:

```bash
# Copy from env.example
cp env.example .env

# Edit with your values
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/mapstory
JWT_SECRET=your-super-secret-jwt-key-here
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
PORT=10000
```

## Deployment Commands

```bash
# Test build locally
npm run build

# Test production server locally
NODE_ENV=production npm start

# Deploy to Render (automatic on git push)
git push origin main
```

## Monitoring and Maintenance

1. **Monitor your app:**
   - Check Render dashboard regularly
   - Set up notifications for downtime
   - Monitor resource usage

2. **Database backups:**
   - Render provides automatic backups for paid plans
   - For free tier, consider manual backups

3. **Updates:**
   - Push to GitHub to trigger automatic deploys
   - Monitor logs during deployments

## Scaling and Performance

1. **Free Tier Limitations:**
   - Service spins down after 15 minutes of inactivity
   - 750 hours/month of runtime
   - Shared resources

2. **Upgrading:**
   - Paid plans offer always-on services
   - Dedicated resources
   - Better performance

## Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use Render's environment variable management
   - Rotate secrets regularly

2. **Database Security:**
   - Use strong passwords
   - Limit database access
   - Regular security updates

3. **HTTPS:**
   - Always use HTTPS in production
   - Render provides free SSL certificates

## Support and Resources

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Node.js on Render](https://render.com/docs/node-js)

---

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Web service created and configured
- [ ] Environment variables set
- [ ] Database initialized with seed data
- [ ] Application tested and working
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up

**Your MapStory Creator is now live on Render! 🚀**

Access your application at: `https://your-app-name.onrender.com` 