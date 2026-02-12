# Vercel Deployment Guide for IntelliMart

This guide will help you deploy both the frontend and backend of IntelliMart to Vercel.

## ⚠️ Important Notes

### Backend Limitations on Vercel
Vercel uses **serverless functions** which have the following limitations:
- **No persistent processes**: Your `node-cron` schedulers (backup scheduler, low stock monitor) will NOT work on Vercel
- **10-second timeout** on Hobby plan, 60 seconds on Pro
- **Cold starts**: Functions sleep when not in use

### Recommended Alternatives for Backend
For a production-ready deployment with cron jobs, consider:
1. **Render** (Free tier available, supports long-running processes)
2. **Railway** (Free tier available, supports background jobs)
3. **Heroku** (Paid, but reliable)
4. **DigitalOcean App Platform**

### If You Still Want to Use Vercel for Backend
You can deploy the backend to Vercel, but you'll need to:
1. Remove or disable the cron schedulers
2. Use external cron services like:
   - **Vercel Cron Jobs** (Pro plan only)
   - **GitHub Actions** (free, can trigger API endpoints on schedule)
   - **Cron-job.org** (free external cron service)

---

## Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **PostgreSQL Database** - Recommended: [Supabase](https://supabase.com) (free tier available)
4. **Environment Variables** - Prepare all required environment variables

---

## Part 1: Database Setup (Supabase)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: IntelliMart
   - **Database Password**: (save this!)
   - **Region**: Choose closest to your users
4. Wait for project to be created

### Step 2: Get Database Connection String
1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to **Connection String** → **URI**
3. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual database password
5. Save this - you'll need it for environment variables

### Step 3: Run Database Migrations
1. Update your `backend/.env` file with the Supabase connection string:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

2. Run Prisma migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## Part 2: Backend Deployment to Vercel

### Step 1: Prepare Backend for Vercel

1. **Disable Cron Schedulers** (temporarily)
   
   Edit `backend/index.js` and comment out the scheduler initialization:
   ```javascript
   app.listen(port, () => {
       console.log(`Server is running on port ${port}`);
   
       // Disable for Vercel serverless deployment
       // initializeBackupScheduler();
       // initializeLowStockMonitoring();
   });
   ```

2. **Verify vercel.json exists** in `backend/` folder (already created)

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 3: Deploy Backend on Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: Click **"Edit"** → Select **`backend`**
   - **Build Command**: `npm install && npx prisma generate`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   Click **"Environment Variables"** and add:
   
   ```
   DATABASE_URL = postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   JWT_SECRET = your_super_secret_jwt_key_change_this
   NODE_ENV = production
   EMAIL_SERVICE = gmail
   EMAIL_USER = your_email@gmail.com
   EMAIL_PASSWORD = your_app_specific_password
   ```

6. Click **"Deploy"**

7. Wait for deployment to complete

8. **Copy your Backend URL** (e.g., `https://your-backend.vercel.app`)

---

## Part 3: Frontend Deployment to Vercel

### Step 1: Update Frontend Environment Variables

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend.vercel.app/api
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### Step 2: Verify vercel.json

The `frontend/vercel.json` file should already exist with:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Push Changes

```bash
git add .
git commit -m "Add production environment variables"
git push origin main
```

### Step 4: Deploy Frontend on Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (same repo, different project)
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: Click **"Edit"** → Select **`frontend`**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   
   ```
   VITE_API_URL = https://your-backend.vercel.app/api
   VITE_SUPABASE_PROJECT_ID = your_project_id
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY = your_publishable_key
   ```

6. Click **"Deploy"**

7. Wait for deployment to complete

8. **Your app is live!** 🎉

---

## Part 4: Setting Up Cron Jobs (Alternative Solutions)

Since Vercel serverless doesn't support `node-cron`, here are alternatives:

### Option 1: GitHub Actions (Recommended - Free)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Scheduled Tasks

on:
  schedule:
    # Run backup every 7 days at midnight
    - cron: '0 0 */7 * *'
    # Run low stock check daily at 9 AM
    - cron: '0 9 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Backup
        run: |
          curl -X POST https://your-backend.vercel.app/api/backup/trigger \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  low-stock-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Low Stock
        run: |
          curl -X POST https://your-backend.vercel.app/api/notifications/check-low-stock \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Then create API endpoints in your backend to handle these cron triggers.

### Option 2: Vercel Cron (Pro Plan Only)

Add to `backend/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/backup/trigger",
      "schedule": "0 0 */7 * *"
    },
    {
      "path": "/api/notifications/check-low-stock",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Option 3: External Cron Service (Free)

Use [cron-job.org](https://cron-job.org):
1. Sign up for free
2. Create new cron jobs pointing to your API endpoints
3. Set schedules as needed

---

## Part 5: Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database connected and migrations run
- [ ] Environment variables set correctly
- [ ] Test user registration/login
- [ ] Test creating a shop
- [ ] Test adding products
- [ ] Test billing functionality
- [ ] Set up cron job alternatives (if needed)
- [ ] Configure custom domain (optional)

---

## Troubleshooting

### Backend Issues

**Error: "Cannot find module '@prisma/client'"**
- Solution: Add `npx prisma generate` to build command

**Error: "Database connection failed"**
- Solution: Check DATABASE_URL is correct
- Ensure Supabase database is running
- Check IP allowlist in Supabase (should allow all IPs)

**Error: "Function timeout"**
- Solution: Optimize slow queries
- Consider upgrading to Vercel Pro for 60s timeout

### Frontend Issues

**Error: "Failed to fetch" or CORS errors**
- Solution: Ensure VITE_API_URL is correct
- Check backend CORS configuration allows frontend domain

**Error: "Environment variables not defined"**
- Solution: Rebuild the project after adding env vars
- Ensure env vars start with `VITE_`

### Cron Jobs Not Running

- Solution: Implement one of the alternative solutions in Part 4
- Vercel serverless doesn't support persistent cron jobs

---

## Monitoring and Logs

### View Backend Logs
1. Go to Vercel Dashboard
2. Select your backend project
3. Click **"Deployments"** → Select latest deployment
4. Click **"Functions"** → View logs

### View Frontend Logs
1. Use browser DevTools Console
2. Check Vercel deployment logs for build errors

---

## Cost Considerations

### Free Tier Limits (Vercel Hobby)
- 100 GB bandwidth/month
- 100 hours serverless function execution/month
- 6,000 minutes build time/month
- Usually sufficient for small to medium projects

### When to Upgrade
- High traffic (>100GB/month)
- Need cron jobs (Vercel Pro)
- Need longer function timeouts
- Need team collaboration

---

## Alternative: Hybrid Deployment (Recommended)

For the best of both worlds:

1. **Frontend on Vercel** (perfect for static sites)
2. **Backend on Render/Railway** (supports cron jobs)

This gives you:
- ✅ Fast frontend delivery via Vercel CDN
- ✅ Working cron jobs on Render/Railway
- ✅ Better separation of concerns
- ✅ Both have free tiers

See `DEPLOY.md` for Render deployment instructions.

---

## Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test API endpoints directly using Postman/Thunder Client

---

**Good luck with your deployment! 🚀**
