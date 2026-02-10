# Deployment Guide for Kirana Store IMS

This project consists of two parts: a **Frontend** (Vite + React) and a **Backend** (Node.js + Express + Prisma).

Each part should be deployed separately to the most suitable platform.

## 1. Backend Deployment (Node.js)

Since your backend uses `node-cron` for scheduled tasks (backups, low stock monitoring), it requires a platform that supports **long-running processes**. 

**Recommended Platform:** [Render](https://render.com) or [Railway](https://railway.app).
**⚠️ Note:** Vercel is *Serverless* and is **NOT** recommended for this backend because it will kill background tasks like your schedulers.

### Steps to Deploy Backend on Render:
1.  Push your code to GitHub.
2.  Create a new **Web Service** on Render.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Root Directory:** `backend`
    *   **Build Command:** `npm install`
    *   **Start Command:** `node index.js`
5.  **Environment Variables:** Add these under "Environment":
    *   `DATABASE_URL`: Your Supabase/PostgreSQL connection string.
    *   `JWT_SECRET`: Your secret key.
    *   `PORT`: `5000` (or `10000`, Render assigns one automatically, your code handles `process.env.PORT` correctly).
    *   (Add other variables from `backend/.env`).

Once deployed, Render will give you a **Backend URL** (e.g., `https://kirana-backend.onrender.com`). COPY THIS URL.

---

## 2. Frontend Deployment (Vercel)

The frontend is a static React application and is perfect for **Vercel**.

### Steps to Deploy Frontend on Vercel:
1.  Go to [Vercel](https://vercel.com) and sign up/login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  Configure the project:
    *   **Framework Preset:** Vite
    *   **Root Directory:** `frontend` (Click "Edit" next to Root Directory and select the `frontend` folder).
5.  **Environment Variables:**
    *   Add `VITE_API_URL` with the value of your **deployed Backend URL** (e.g., `https://kirana-backend.onrender.com/api`).
    *   **Important:** Make sure to include `/api` at the end if your backend routes require it (your local setup uses `/api`, and `frontend/src/lib/api.js` expects it).
    *   Add your Supabase variables:
        *   `VITE_SUPABASE_PROJECT_ID`
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_PUBLISHABLE_KEY`
6.  Click **Deploy**.

## Summary Checklist
- [ ] Backend deployed to Render/Railway.
- [ ] Backend URL copied.
- [ ] Frontend deployed to Vercel.
- [ ] `VITE_API_URL` set in Vercel to point to Backend.
