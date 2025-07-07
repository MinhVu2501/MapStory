# MapStory Creator - Deployment Guide

This guide covers various deployment options for the MapStory Creator application.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Google Maps API Key
- (Optional) Docker & Docker Compose

## Environment Setup

1. **Copy environment file:**
   ```bash
   cp env.example .env
   ```

2. **Configure environment variables:**
   ```bash
   # Required
   DATABASE_URL=postgresql://username:password@localhost:5432/mapstory
   JWT_SECRET=your-super-secret-jwt-key-here
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   
   # Optional
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://your-domain.com
   ```

## Deployment Options

### Option 1: Docker Compose (Recommended)

**Quick start with Docker:**

```bash
# 1. Build and start all services
docker-compose up -d

# 2. Check logs
docker-compose logs -f mapstory

# 3. Initialize database (first time only)
docker-compose exec mapstory npm run seed:prod
```

**Services included:**
- PostgreSQL database
- MapStory application
- Nginx reverse proxy (optional)

**URLs:**
- Application: http://localhost:3001
- Database: localhost:5432

### Option 2: Manual Deployment

**1. Install dependencies:**
```bash
npm install
```

**2. Build the application:**
```bash
npm run build
```

**3. Set up PostgreSQL database:**
```bash
# Create database
createdb mapstory

# Run migrations/seed
npm run seed:prod
```

**4. Start the application:**
```bash
npm start
```

### Option 3: Heroku Deployment

**1. Install Heroku CLI and login:**
```bash
heroku login
```

**2. Create Heroku app:**
```bash
heroku create your-mapstory-app
```

**3. Add PostgreSQL addon:**
```bash
heroku addons:create heroku-postgresql:mini
```

**4. Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-jwt-key
heroku config:set VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**5. Deploy:**
```bash
git push heroku main
```

**6. Initialize database:**
```bash
heroku run npm run seed:prod
```

### Option 4: VPS/Cloud Server

**1. Server setup (Ubuntu/Debian):**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

**2. Database setup:**
```bash
# Create database user
sudo -u postgres createuser --createdb --pwprompt mapstory_user

# Create database
sudo -u postgres createdb -O mapstory_user mapstory
```

**3. Application setup:**
```bash
# Clone repository
git clone https://github.com/your-username/mapstory.git
cd mapstory

# Install dependencies
npm install

# Build application
npm run build

# Set up environment
cp env.example .env
# Edit .env with your values
```

**4. Start with PM2:**
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'mapstory',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**5. Nginx setup (optional):**
```bash
# Install Nginx
sudo apt-get install -y nginx

# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/mapstory
sudo ln -s /etc/nginx/sites-available/mapstory /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

## SSL Certificate (Production)

**Using Let's Encrypt:**
```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Management

**Backup database:**
```bash
pg_dump $DATABASE_URL > backup.sql
```

**Restore database:**
```bash
psql $DATABASE_URL < backup.sql
```

**Run migrations:**
```bash
npm run seed:prod
```

## Monitoring & Maintenance

**Check application status:**
```bash
# Docker
docker-compose ps

# PM2
pm2 status
pm2 logs mapstory

# System resources
htop
df -h
```

**Update application:**
```bash
# Pull latest code
git pull origin main

# Rebuild
npm run build

# Restart
docker-compose restart mapstory
# or
pm2 restart mapstory
```

## Security Checklist

- [ ] Use strong JWT secret
- [ ] Enable HTTPS in production
- [ ] Set up firewall (UFW)
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs
- [ ] Rate limiting enabled
- [ ] Environment variables secured

## Troubleshooting

**Common issues:**

1. **Database connection errors:**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall settings

2. **Build failures:**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version: `node --version`

3. **Google Maps not loading:**
   - Verify API key is correct
   - Check API key restrictions
   - Ensure billing is enabled

4. **Port conflicts:**
   - Change PORT in .env
   - Check for other services: `lsof -i :3001`

**Logs locations:**
- Docker: `docker-compose logs mapstory`
- PM2: `pm2 logs mapstory`
- Nginx: `/var/log/nginx/`

## Performance Optimization

**Production optimizations:**
- Enable gzip compression
- Use CDN for static assets
- Database connection pooling
- Redis for session storage
- Image optimization
- Monitoring with tools like New Relic

## Support

For deployment issues:
1. Check logs first
2. Verify environment variables
3. Test database connectivity
4. Review security settings

---

**Happy Deploying! 🚀** 