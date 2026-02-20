# Cron Endpoints Documentation

This document explains the cron endpoints that replace the built-in `node-cron` schedulers for Vercel deployment.

## Why Cron Endpoints?

Vercel uses serverless functions that:
- Don't support persistent background processes
- Can't run `node-cron` schedulers
- Need external triggers for scheduled tasks

## Available Endpoints

### 1. Trigger Backup

**Endpoint:** `POST /api/cron/trigger-backup`

**Description:** Creates an automatic backup of the database

**Authentication:** Requires `x-cron-secret` header

**Example:**
```bash
curl -X POST https://your-backend.vercel.app/api/cron/trigger-backup \
  -H "x-cron-secret: your_secret_key"
```

**Response:**
```json
{
  "success": true,
  "message": "Backup triggered successfully",
  "timestamp": "2026-02-12T16:50:00.000Z"
}
```

**Recommended Schedule:** Every 7 days (`0 0 */7 * *`)

---

### 2. Check Low Stock

**Endpoint:** `POST /api/cron/check-low-stock`

**Description:** Checks all products for low stock and sends email notifications

**Authentication:** Requires `x-cron-secret` header

**Example:**
```bash
curl -X POST https://your-backend.vercel.app/api/cron/check-low-stock \
  -H "x-cron-secret: your_secret_key"
```

**Response:**
```json
{
  "success": true,
  "message": "Low stock check completed",
  "timestamp": "2026-02-12T16:50:00.000Z"
}
```

**Recommended Schedule:** Daily at 9 AM (`0 9 * * *`)

---

### 3. Health Check

**Endpoint:** `GET /api/cron/health`

**Description:** Check if cron endpoints are working

**Authentication:** None required

**Example:**
```bash
curl https://your-backend.vercel.app/api/cron/health
```

**Response:**
```json
{
  "success": true,
  "message": "Cron endpoints are healthy",
  "timestamp": "2026-02-12T16:50:00.000Z"
}
```

---

## Security

### CRON_SECRET

All cron endpoints (except health check) require authentication via the `x-cron-secret` header.

**Setup:**
1. Generate a strong random secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add to environment variables:
   - **Vercel Backend**: Add `CRON_SECRET` in project settings
   - **GitHub Actions**: Add as repository secret
   - **Cron-job.org**: Add in request headers

**Header Format:**
```
x-cron-secret: your_secret_key_here
```

**Alternative (Query Parameter):**
```
?secret=your_secret_key_here
```

---

## Setup Methods

### Method 1: GitHub Actions (Recommended)

**Pros:**
- Free
- Reliable
- Version controlled
- Easy to manage

**Setup:**
1. File already created: `.github/workflows/cron-jobs.yml`
2. Add secrets to GitHub repository:
   - `BACKEND_URL`: Your Vercel backend URL
   - `CRON_SECRET`: Your secret key
3. Enable Actions in repository settings

**Manual Trigger:**
- Go to **Actions** tab
- Select **Scheduled Cron Jobs**
- Click **Run workflow**
- Choose which job to run

---

### Method 2: Cron-job.org

**Pros:**
- Simple web interface
- Email notifications on failure
- Execution history

**Setup:**
1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new cron job
3. Configure:
   - **URL**: `https://your-backend.vercel.app/api/cron/trigger-backup`
   - **Schedule**: `0 0 */7 * *`
   - **Method**: POST
   - **Headers**: 
     ```
     x-cron-secret: your_secret_key
     Content-Type: application/json
     ```

---

### Method 3: Vercel Cron (Pro Plan Only)

**Pros:**
- Native Vercel integration
- No external service needed

**Cons:**
- Requires Vercel Pro plan ($20/month)

**Setup:**
Update `backend/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/trigger-backup",
      "schedule": "0 0 */7 * *"
    },
    {
      "path": "/api/cron/check-low-stock",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

### Method 4: EasyCron

**Pros:**
- Free tier available
- Good UI
- Reliable

**Setup:**
1. Sign up at [easycron.com](https://easycron.com)
2. Create cron job similar to cron-job.org
3. Add custom headers for authentication

---

## Cron Schedule Format

Format: `minute hour day month day-of-week`

**Examples:**
- `0 0 */7 * *` - Every 7 days at midnight
- `0 9 * * *` - Every day at 9 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month

**Tools:**
- [crontab.guru](https://crontab.guru) - Cron expression editor
- [crontab-generator.org](https://crontab-generator.org) - Visual cron generator

---

## Monitoring

### Check Execution Logs

**GitHub Actions:**
1. Go to **Actions** tab
2. Click on workflow run
3. View job logs

**Cron-job.org:**
1. Go to dashboard
2. Click on job
3. View execution history

**Vercel:**
1. Go to project dashboard
2. Click **Functions**
3. View function logs

### Test Endpoints Manually

```bash
# Test backup
curl -X POST https://your-backend.vercel.app/api/cron/trigger-backup \
  -H "x-cron-secret: your_secret" \
  -v

# Test low stock
curl -X POST https://your-backend.vercel.app/api/cron/check-low-stock \
  -H "x-cron-secret: your_secret" \
  -v
```

---

## Error Handling

### Common Errors

**401 Unauthorized**
- Check `x-cron-secret` header is correct
- Verify `CRON_SECRET` env var is set in Vercel

**500 Internal Server Error**
- Check Vercel function logs
- Verify database connection
- Check email configuration

**Timeout**
- Backup might be too large
- Consider upgrading to Vercel Pro (60s timeout)
- Or use alternative backend hosting (Render/Railway)

### Notifications

Add email notifications for failures:

**GitHub Actions:**
```yaml
- name: Notify on Failure
  if: failure()
  run: |
    curl -X POST https://your-backend.vercel.app/api/notifications/send \
      -H "Content-Type: application/json" \
      -d '{"type":"GENERAL","message":"Cron job failed"}'
```

---

## Migration from node-cron

The original schedulers in `backend/src/scheduler/` are automatically disabled on Vercel.

**Original Code:**
```javascript
// backend/src/scheduler/backupScheduler.js
cron.schedule('0 0 */7 * *', async () => {
  await createAutomaticBackup();
});
```

**New Approach:**
```javascript
// External service calls:
POST /api/cron/trigger-backup
```

**Detection:**
```javascript
// backend/index.js
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  initializeBackupScheduler(); // Only on non-Vercel
}
```

---

## Best Practices

1. **Use GitHub Actions** for free, reliable scheduling
2. **Set up monitoring** to catch failures
3. **Test endpoints** before deploying
4. **Rotate secrets** periodically
5. **Keep backups** of cron configurations
6. **Document schedules** for team members
7. **Monitor execution time** to avoid timeouts

---

## Troubleshooting

### Cron not triggering

1. Check cron service is active
2. Verify schedule syntax
3. Test endpoint manually
4. Check service logs

### Authentication failing

1. Verify `CRON_SECRET` matches
2. Check header name: `x-cron-secret`
3. Ensure no extra spaces in secret
4. Try query parameter: `?secret=xxx`

### Backup failing

1. Check database connection
2. Verify sufficient storage
3. Check Vercel function timeout
4. Review function logs

### Email not sending

1. Verify email configuration
2. Check EMAIL_USER and EMAIL_PASSWORD
3. Use Gmail App Password (not regular password)
4. Check spam folder

---

## Support

For issues:
1. Check Vercel function logs
2. Test endpoints with curl
3. Review GitHub Actions logs
4. Check cron service execution history

---

**Last Updated:** 2026-02-12
