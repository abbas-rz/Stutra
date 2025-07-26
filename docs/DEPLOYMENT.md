# Deployment Guide

This guide provides comprehensive instructions for deploying the Stutra application to various platforms.

## Table of Contents
- [Pre-deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Post-deployment Setup](#post-deployment-setup)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Pre-deployment Checklist

### Code Quality Checks
- [ ] All tests pass (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Remove all console.log statements
- [ ] Update environment variables for production
- [ ] Review and update security settings

### Firebase Setup
- [ ] Firebase project created and configured
- [ ] Realtime Database enabled with proper security rules
- [ ] Service account credentials configured
- [ ] Billing enabled (if using paid features)

### Content Review
- [ ] Update application metadata (title, description)
- [ ] Review and finalize user interface text
- [ ] Ensure proper error messages are displayed
- [ ] Test with production data

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Application Configuration
VITE_APP_NAME=Stutra
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

### Firebase Security Rules

Update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "students": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$studentId": {
        ".validate": "newData.hasChildren(['id', 'name', 'admission_number', 'section'])"
      }
    },
    "teachers": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "attendance_logs": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["date", "student_id", "section"]
    }
  }
}
```

## Build Process

### Local Build
```bash
# Install dependencies
npm ci

# Run tests
npm run test

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Automated Build (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Run linting
        run: npm run lint
      
      - name: Build application
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to hosting
        # Add your deployment steps here
        run: echo "Deploy to your hosting platform"
```

## Deployment Options

### 1. Vercel (Recommended)

#### Quick Deploy
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

#### Manual Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### vercel.json Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_FIREBASE_API_KEY": "@vite_firebase_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@vite_firebase_auth_domain",
    "VITE_FIREBASE_DATABASE_URL": "@vite_firebase_database_url"
  }
}
```

### 2. Netlify

#### Deploy from Git
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

#### Manual Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### 3. Firebase Hosting

#### Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy --only hosting
```

#### firebase.json Configuration
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 4. AWS S3 + CloudFront

#### Build and Upload
```bash
# Build the project
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 5. Docker Deployment

#### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
    }
}
```

#### Deploy with Docker
```bash
# Build image
docker build -t stutra-app .

# Run container
docker run -p 80:80 stutra-app
```

## Post-deployment Setup

### 1. Create Admin Account
```javascript
// Run this in browser console after deployment
const createAdmin = async () => {
  const response = await fetch('/api/auth/create-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@yourdomain.com',
      name: 'System Administrator',
      password: 'secure_password_here'
    })
  });
  console.log(await response.json());
};
createAdmin();
```

### 2. Import Student Data
Use the Python script in `/scripts` to import student data:

```bash
cd scripts
pip install -r requirements.txt
python add_students.py --file students.csv
```

### 3. Configure Sections
Update the sections in your database or through the admin interface:

```json
{
  "sections": {
    "XI-A": { "name": "XI Raman", "capacity": 40 },
    "XI-B": { "name": "XI Satyarthi", "capacity": 40 },
    "XI-C": { "name": "XI Curie", "capacity": 40 }
  }
}
```

### 4. Set Up Monitoring

#### Error Tracking (Sentry)
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

#### Analytics (Google Analytics)
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Monitoring and Maintenance

### Performance Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor Core Web Vitals
- Track user engagement metrics
- Monitor Firebase usage and costs

### Regular Maintenance Tasks

#### Weekly
- [ ] Review error logs
- [ ] Check application performance
- [ ] Monitor Firebase usage
- [ ] Backup critical data

#### Monthly
- [ ] Update dependencies (`npm audit` and `npm update`)
- [ ] Review user feedback
- [ ] Analyze usage patterns
- [ ] Performance optimization review

#### Quarterly
- [ ] Security audit
- [ ] Dependency vulnerability scan
- [ ] Performance benchmarking
- [ ] User experience testing

### Backup Strategy

#### Database Backup
```bash
# Export Firebase data
firebase database:get / --output backup-$(date +%Y%m%d).json

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
firebase database:get / --output "backups/backup-$DATE.json"
gzip "backups/backup-$DATE.json"

# Keep only last 30 days of backups
find backups/ -name "backup-*.json.gz" -mtime +30 -delete
```

#### Code Backup
- Ensure code is backed up in version control
- Tag releases for easy rollback
- Maintain deployment documentation

### Rollback Procedure

#### Quick Rollback
```bash
# Revert to previous Git commit
git revert HEAD
git push origin main

# Or rollback to specific version
git reset --hard <commit-hash>
git push --force origin main
```

#### Database Rollback
```bash
# Restore from backup
firebase database:set / backup-20240115.json
```

### Security Checklist

#### Deployment Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API endpoints protected
- [ ] Input validation implemented
- [ ] Authentication working properly
- [ ] Session management secure

#### Ongoing Security
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Review access logs
- [ ] Update passwords regularly
- [ ] Monitor for suspicious activity

### Troubleshooting Common Issues

#### Application Won't Load
1. Check environment variables
2. Verify Firebase configuration
3. Check browser console for errors
4. Verify build artifacts

#### Authentication Issues
1. Verify Firebase Auth configuration
2. Check user permissions
3. Verify password hashing consistency
4. Check session storage

#### Performance Issues
1. Check Firebase usage limits
2. Optimize bundle size
3. Review database queries
4. Check network connectivity

#### Data Issues
1. Verify database schema
2. Check data validation
3. Review import scripts
4. Verify backup integrity

This comprehensive deployment guide ensures a smooth transition from development to production while maintaining security, performance, and reliability standards.
